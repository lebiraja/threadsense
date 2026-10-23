"""ThreadSense API: read-only over MapReduce results, plus TF-IDF scoring for pasted text."""
import math
import os
import re
from collections import Counter, defaultdict
from contextlib import asynccontextmanager
from typing import Any, AsyncIterator

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import AsyncMongoClient

from schemas import (CategoryStat, EvalResult, Example, Graph, GraphEdge, GraphNode, Neighbour,
                     Overview, PipelineStep, RecommendRequest, RecommendResponse, Recommendation,
                     Results, SubredditBrief, SubredditDetail, TimingRow, WordWeight)

TOP_K = 5
URL = re.compile(r"https?://\S+")
ENTITY = re.compile(r"&gt;|&lt;|&amp;|&#x200B;")
NON_LETTER = re.compile(r"[^a-z' ]+")
STEP_ORDER = ["01_clean", "02_split", "03_job1_wordcount", "04_job2_index", "05_job3_similarity",
              "06_job4_recommend_eval", "07_prep_stats", "08_timing"]


def normalise(text: str) -> str:
    """Same normalisation as pipeline/clean.py so query text matches the indexed vocabulary."""
    text = URL.sub(" ", ENTITY.sub(" ", text.replace("<lb>", " "))).lower()
    return " ".join(NON_LETTER.sub(" ", text).split())


class State:
    norms: dict[str, float]
    category: dict[str, str]


state = State()


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    client: AsyncMongoClient[Any] = AsyncMongoClient(os.environ["MONGO_URI"])
    app.state.db = client["threadsense"]
    db = app.state.db
    state.norms = {d["_id"]: d["value"] ** 0.5 async for d in db.sub_norms.find()}
    state.category = {d["_id"]: d["category"] async for d in db.subreddit_stats.find({}, {"category": 1})}
    yield
    await client.close()


app = FastAPI(title="ThreadSense API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
                   allow_methods=["*"], allow_headers=["*"])


def db_of() -> Any:
    return app.state.db


async def score(text: str) -> tuple[list[Recommendation], int]:
    counts = Counter(normalise(text).split())
    totals: dict[str, float] = defaultdict(float)
    matched: dict[str, list[WordWeight]] = defaultdict(list)
    known = 0
    async for doc in db_of().word_index.find({"_id": {"$in": list(counts)}}):
        known += 1
        tf = 1 + math.log(counts[doc["_id"]])
        for sub, w in doc["value"]["p"]:
            totals[sub] += tf * w
            matched[sub].append(WordWeight(word=doc["_id"], weight=round(tf * w, 3)))
    ranked = sorted(((s, v / state.norms[s]) for s, v in totals.items() if s in state.norms),
                    key=lambda x: -x[1])[:TOP_K]
    recs = [Recommendation(subreddit=s, category=state.category.get(s, "uncategorised"),
                           score=round(v, 4),
                           matched_words=sorted(matched[s], key=lambda m: -m.weight)[:6])
            for s, v in ranked]
    return recs, known


@app.get("/api/overview", response_model=Overview)
async def overview() -> Overview:
    db = db_of()
    return Overview(
        posts_raw=await db.posts_raw.estimated_document_count(),
        posts_clean=await db.posts_clean.estimated_document_count(),
        train=await db.posts_clean.count_documents({"split": "train"}),
        test=await db.posts_clean.count_documents({"split": "test"}),
        subreddits=await db.subreddit_stats.estimated_document_count(),
        indexed_words=await db.word_index.estimated_document_count(),
        word_subreddit_counts=await db.word_counts.estimated_document_count())


@app.get("/api/pipeline", response_model=list[PipelineStep])
async def pipeline() -> list[PipelineStep]:
    docs = {d["step"]: d async for d in db_of().pipeline_logs.find({}, {"_id": 0})}
    steps = []
    for name in STEP_ORDER:
        d = docs.get(name)
        if not d:
            continue
        log = (f"$ step {d['step']}\nfinished   {d['finished']:%Y-%m-%d %H:%M:%S} UTC\n"
               f"duration   {d['duration_s']} s\nrecords in {d['records_in']:,}\n"
               f"records out {d['records_out']:,}\nnotes      {d['notes']}")
        steps.append(PipelineStep(**d, log=log))
    return steps


@app.get("/api/results", response_model=Results)
async def results() -> Results:
    ev = await db_of().results.find_one({"_id": "eval"})
    tm = await db_of().results.find_one({"_id": "timing"})
    if not ev or not tm:
        raise HTTPException(503, "results not computed yet")
    return Results(eval=EvalResult(**ev), timing=[TimingRow(**r) for r in tm["rows"]])


@app.get("/api/categories", response_model=list[CategoryStat])
async def categories() -> list[CategoryStat]:
    rows = await db_of().subreddit_stats.aggregate([
        {"$group": {"_id": "$category", "subreddits": {"$sum": 1}, "posts": {"$sum": "$posts"}}},
        {"$sort": {"posts": -1}}])
    return [CategoryStat(category=r["_id"], subreddits=r["subreddits"], posts=r["posts"])
            async for r in rows]


@app.get("/api/subreddits", response_model=list[SubredditBrief])
async def subreddits() -> list[SubredditBrief]:
    return [SubredditBrief(name=d["_id"], category=d["category"], posts=d["posts"])
            async for d in db_of().subreddit_stats.find().sort("_id", 1)]


@app.get("/api/subreddits/{name}", response_model=SubredditDetail)
async def subreddit(name: str) -> SubredditDetail:
    st = await db_of().subreddit_stats.find_one({"_id": name})
    if not st:
        raise HTTPException(404, "unknown subreddit")
    sim = await db_of().subreddit_sim.find_one({"_id": name})
    return SubredditDetail(name=name, category=st["category"], posts=st["posts"],
                           neighbours=[Neighbour(**n) for n in (sim or {}).get("neighbours", [])],
                           top_words=[WordWeight(**w) for w in st["top_words"]])


@app.get("/api/graph", response_model=Graph)
async def graph(limit: int = 150) -> Graph:
    sims = {d["_id"]: d["neighbours"] async for d in db_of().subreddit_sim.find()}
    strength = {s: sum(n["sim"] for n in ns) for s, ns in sims.items()}
    keep = set(sorted(strength, key=lambda s: -strength[s])[:max(1, min(limit, 400))])
    stats = {d["_id"]: d async for d in db_of().subreddit_stats.find({"_id": {"$in": list(keep)}})}
    edges: dict[tuple[str, str], float] = {}
    for s in keep:
        for n in sims[s]:
            if n["subreddit"] in keep:
                edges[tuple(sorted((s, n["subreddit"])))] = n["sim"]  # type: ignore[assignment]
    return Graph(nodes=[GraphNode(id=s, category=stats[s]["category"], posts=stats[s]["posts"])
                        for s in keep if s in stats],
                 edges=[GraphEdge(source=a, target=b, sim=v) for (a, b), v in edges.items()])


@app.get("/api/examples", response_model=list[Example])
async def examples() -> list[Example]:
    if getattr(app.state, "examples", None):
        return app.state.examples
    out: list[Example] = []
    seen: set[str] = set()
    cursor = await db_of().posts_clean.aggregate([
        {"$match": {"split": "test", "n_words": {"$gte": 25, "$lte": 120}}},
        {"$sample": {"size": 400}}])
    async for post in cursor:
        if post["subreddit"] in seen:
            continue
        recs, _ = await score(post["text"])
        if recs and recs[0].subreddit == post["subreddit"]:
            seen.add(post["subreddit"])
            out.append(Example(text=post["text"], true_subreddit=post["subreddit"],
                               preview=post["text"][:90]))
        if len(out) == 6:
            break
    app.state.examples = out
    return out


@app.post("/api/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest) -> RecommendResponse:
    if not req.text.strip():
        raise HTTPException(422, "text is empty")
    recs, known = await score(req.text)
    return RecommendResponse(recommendations=recs, n_known_words=known)

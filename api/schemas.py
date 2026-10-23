"""Pydantic response models (see docs/API.md)."""
from datetime import datetime

from pydantic import BaseModel


class Overview(BaseModel):
    posts_raw: int
    posts_clean: int
    train: int
    test: int
    subreddits: int
    indexed_words: int
    word_subreddit_counts: int


class PipelineStep(BaseModel):
    step: str
    finished: datetime
    duration_s: float
    records_in: int
    records_out: int
    dropped: int
    notes: str
    log: str


class EvalResult(BaseModel):
    n_test: int
    k: int
    top1_accuracy: float
    hit_rate_at_5: float
    baseline_top1: float
    baseline_hit_rate_at_5: float


class TimingRow(BaseModel):
    method: str
    indexed: bool
    seconds: float
    input_posts: int
    output_docs: int


class Results(BaseModel):
    eval: EvalResult
    timing: list[TimingRow]


class CategoryStat(BaseModel):
    category: str
    subreddits: int
    posts: int


class SubredditBrief(BaseModel):
    name: str
    category: str
    posts: int


class Neighbour(BaseModel):
    subreddit: str
    sim: float


class WordWeight(BaseModel):
    word: str
    weight: float


class SubredditDetail(SubredditBrief):
    neighbours: list[Neighbour]
    top_words: list[WordWeight]


class GraphNode(BaseModel):
    id: str
    category: str
    posts: int


class GraphEdge(BaseModel):
    source: str
    target: str
    sim: float


class Graph(BaseModel):
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class Example(BaseModel):
    text: str
    true_subreddit: str
    preview: str


class RecommendRequest(BaseModel):
    text: str


class Recommendation(BaseModel):
    subreddit: str
    category: str
    score: float
    matched_words: list[WordWeight]


class RecommendResponse(BaseModel):
    recommendations: list[Recommendation]
    n_known_words: int

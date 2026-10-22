# Big Data IA3: Decided Plan

Status: planned, no code yet. Written 2026-10-22. Due **2026-10-25** (upload to GCR). See `IA3.md` for the assignment text and rubric facts.

## 1. Project in one line

A Reddit **community recommender and trend finder** built as a batch pipeline on **MongoDB + MapReduce**, with a small **front end** that shows the pipeline, charts, evaluation and a "try a user" recommendation prototype.

**Final title (decided 2026-10-22):** *ThreadSense: Discovering Which Reddit Communities You Belong In*

**Dataset (decided):** Reddit, from Kaggle. Primary candidate: [pypiahmad/reddit-submissions](https://www.kaggle.com/datasets/pypiahmad/reddit-submissions/data) (CSV, about 14 GB, submitter username, subreddit, votes, comment count; columns NOT yet verified). Fallback: [mswarbrickjones/reddit-selfposts](https://www.kaggle.com/datasets/mswarbrickjones/reddit-selfposts) (1.013M self-posts, 1,013 subreddits, TSV; author field unverified). Yelp was considered and dropped by Lebi's choice. Items = subreddits, "users" = authors. Final Kaggle link goes in the report once the schema is confirmed.

Rejected datasets: Twitter Friends (about 40k, under the 50k minimum), Sentiment140 (no hashtags), Reddit Data Huge (250 GB), Amazon 2023 (not confirmed on Kaggle).

## 1b. Pivot after checking the data (2026-10-22)

`reddit-selfposts` (the dataset we are using) has only `id, subreddit, title, selftext`: **no author, no timestamp**. 1,013,000 posts, 1,013 subreddits, imported to Mongo (`threadsense.posts_raw`). `reddit-submissions` turned out to be raw HTML pages and is dropped.

So ThreadSense is a **content-based** community recommender, not a per-user one:
1. Job 1: word counts per subreddit. 2. Job 2: TF-IDF per word per subreddit. 3. Job 3: subreddit-to-subreddit similarity (related communities, graph edges). 4. Job 4: for pasted text, score all subreddits and return top 5.
Evaluation: hold out 10% of posts, top-k accuracy vs a "most common subreddit" baseline. Insights charts use `subreddit_info.csv` categories instead of time trends. The per-user and monthly-trend jobs in section 6 are dropped; the "try a user" page becomes "paste a post".

Verified: `mapReduce` runs on `mongo:7.0`.

## 2. Why this idea

- Classmates' topics (from the sheet Lebi pasted): DisasterPulse, network intrusion, WikiPulse, web log analytics (x2), GridWatch power grid, patient drug-safety, food waste, cyber threat (Hadoop + Spark), SATQuery vision-language, supply chain, real-time purchase analytics. Mostly logs, security and domain analytics.
- Nobody picked social media or recommendation, so it stands out.
- Lebi wants it "bigger and better" than the classmates'. Decision: get that through **depth inside the brief**, not by leaving it.

## 3. Constraints from the brief (do not break)

- Kaggle dataset, **50,000+ records**, **semi-structured/unstructured**, Kaggle link goes in the report.
- **MongoDB** for storage and querying.
- **MapReduce** for the large-scale processing.
- Report: problem statement, dataset description, methodology, tools, MapReduce code, results, visualizations, conclusions, evidence of execution.
- PPT: 7 to 10 pages.
- Live demo on Lebi's laptop at the III IA.
- Hadoop and Spark are **not required**. One classmate chose them; we mention them as future scaling only.

## 4. What was rejected, and why

| Idea | Why not |
|---|---|
| Graph DB (Neo4j) | Brief says MongoDB. Co-occurrence pairs act as graph edges instead. |
| Live data from X / Instagram / Reddit | APIs are restricted or paid, scraping eats the 3 days, brief wants a Kaggle dataset. |
| Real-time stream processing | Kafka/Spark territory, not MapReduce on stored data. Listed as future work. |
| A new research algorithm | 3 days. Marks are for the pipeline, results and demo. |

## 5. Where the "big data" is (be honest in the viva)

- **Volume:** target 1M+ records (brief asks 50k+).
- **Variety:** nested JSON, missing keys, free text, hashtags, timestamps, scores. This is why Mongo.
- **Velocity:** weak. Data is batch, processed in time windows. Do **not** claim real-time. Streaming is future work.
- 1M records fits on a laptop: this is big-data *methods* at small scale. Do not say petabyte-scale.

## 6. Pipeline

1. **Ingest:** `mongoimport` the Kaggle dump into MongoDB.
2. **Clean:** dedupe, drop deleted users and bots, normalise text, fix timestamps (aggregation pipelines or Python).
3. **MapReduce jobs** (the core of the marks):
   - Job 1: user to topic counts, giving a per-user interest profile.
   - Job 2: item-item co-occurrence (pairs of topics/subreddits/hashtags the same user touched), giving the graph edges.
   - Job 3: score pairs (lift or Jaccard).
   - Job 4: per-user top-N recommendations.
   - Possibly a trending-by-time-window job.
4. **Evaluate:** hold out part of each user's activity, recommend, report **precision@k and hit rate vs a "most popular" baseline**.
5. **Performance comparison:** time `mapReduce` against an equivalent aggregation pipeline on one job, with and without an index.
6. **Persist step logs:** each step stores name, records in, records out, duration, log text as a document in Mongo (feeds the front end's pipeline view).

## 7. Front end (decided)

Purpose: show outputs, not run jobs live. Jobs run beforehand; the UI only reads stored results. Reasons: nothing can stall in the review, it covers visualizations plus evidence of execution in one place, and report screenshots come from it.

Sections:
1. **Pipeline view:** the steps as a flow, each with records in/out and duration. Clicking a step opens its captured log in a side panel (stands in for raw logs).
2. **Insights:** top co-occurring pairs, trends over time, most active topics, network graph of topics (nodes = topics, lines = co-occurrence).
3. **Try it:** pick/enter a user; show their history next to recommendations and the score behind each. It looks up **precomputed** recommendations, it does not run MapReduce. Say so if asked. Keep 3 pre-checked good example users.
4. **Results:** precision@k vs baseline, and the `mapReduce` vs aggregation timing.

Design: dark/minimal with a clear visual direction, not a card-grid dashboard (per Lebi's frontend preference).

## 8. Stack

| Need | Tool |
|---|---|
| Storage and queries | MongoDB in Docker |
| Processing | MongoDB `mapReduce` (JS map/reduce functions) |
| Runner, glue, evaluation | Python (pymongo, pandas) |
| API | FastAPI reading output collections |
| Front end | Next.js + charts + network graph (networkx or pyvis for static, or a JS graph lib) |
| Charts for report | matplotlib |
| Data | Kaggle (needs free account + API token) |

All services in Docker Compose, talking over Docker network names, `env_file:` for config, healthchecks included.

**Risk:** MongoDB deprecated `mapReduce` in 5.0. It still runs in 6.x/7.x images. First task is to pin an image where it works and prove it with a test job. If the faculty wants the old `db.collection.mapReduce()` specifically, that is what we use; if it breaks, fall back to aggregation and say so.

## 9. Presentation plan (5 to 7 minutes)

1. `countDocuments()` and `findOne()` to show volume and variety (30s).
2. Show a saved MapReduce run's output (time, output doc count), not a long live run (1 min).
3. Top related pairs as a table (1 min).
4. Charts and network graph from the front end (1 min).
5. "Try it" demo with a pre-checked user (2 min).
6. precision@k vs baseline slide (30s).

Backup: record a screen video of the whole thing working and keep it on the laptop in case Docker fails.

## 10. Report and PPT mapping

- Slides 1-2 / report sections 1-2: problem, dataset (with Kaggle link).
- Slides 3-4: methodology, tools, MapReduce code (map and reduce functions, commented).
- Slides 5-8: results, charts, network graph, evaluation, timing comparison.
- Slides 9-10: demo screenshots, conclusion, future work (Neo4j, live streaming, Spark scaling).
- Report adds: evidence-of-execution screenshots (terminal output and front-end pipeline view).

## 11. Timeline (3 days)

- **Day 1 (Oct 22/23):** Docker Compose + Mongo with a working test MapReduce job; verify and download the Reddit dataset (sample first, then a 1M+ slice); ingest; clean.
- **Day 2:** the MapReduce jobs, evaluation, timing comparison, step-log persistence.
- **Day 3 (Oct 24/25):** FastAPI + front end, screenshots, report, PPT, rehearsal, record backup video, upload to GCR by 25-10-26.

## 12. Open items (resolve first in the next session)

- [ ] **Lebi's row in the assignment sheet** (https://docs.google.com/spreadsheets/d/1csqoVLrCfscBXFYnW0wmF9clx0baP4mVJPVUVP77dyc/edit?usp=sharing). If it fixes a topic/dataset, this plan must fit inside it. Not read yet. Also confirm whether the sheet's projects are meant to be unique and this one is free.
- [ ] Confirm the Reddit dataset schema (author, subreddit, timestamp, text) by downloading a sample; if `reddit-submissions` lacks fields or is too heavy, switch to `reddit-selfposts`. Check licence.
- [x] Title chosen: ThreadSense. Dataset family chosen: Reddit.
- [ ] Kaggle account/API token for download.
- [ ] Confirm team size, exact review date, and rubric split of the 30 marks (not given).
- [ ] Confirm whether faculty expects classic `mapReduce` specifically.
- [ ] Final project name.

## 13. First actions for the next session

1. Read `IA3.md`, then this file.
2. Lebi shares the sheet row; adjust the topic if needed.
3. Create `docker-compose.yml` (mongo pinned to a version that supports `mapReduce`) and run a test MapReduce job.
4. Download a sample of the Reddit dataset and confirm its schema.
5. Continue with section 11, Day 1.

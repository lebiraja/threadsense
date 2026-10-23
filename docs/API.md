# ThreadSense API (FastAPI, port 8000)

Read-only over precomputed MapReduce results, except `POST /api/recommend`, which scores text against the stored TF-IDF index (it does not run MapReduce). JSON, CORS open for `http://localhost:3000`.

| Method + path | Returns |
|---|---|
| `GET /api/overview` | `{posts_raw, posts_clean, train, test, subreddits, indexed_words, word_subreddit_counts}` |
| `GET /api/pipeline` | `[{step, finished, duration_s, records_in, records_out, dropped, notes, log}]` ordered by step. `log` is the captured text output of that step. |
| `GET /api/results` | `{eval: {n_test, k, top1_accuracy, hit_rate_at_5, baseline_top1, baseline_hit_rate_at_5}, timing: [{method, indexed, seconds, input_posts, output_docs}]}` |
| `GET /api/categories` | `[{category, subreddits, posts}]` sorted by posts desc |
| `GET /api/subreddits` | `[{name, category, posts}]` |
| `GET /api/subreddits/{name}` | `{name, category, posts, neighbours: [{subreddit, sim}], top_words: [{word, weight}]}` |
| `GET /api/graph?limit=150` | `{nodes: [{id, category, posts}], edges: [{source, target, sim}]}` (the `limit` most strongly connected subreddits and the links among them) |
| `GET /api/examples` | 6 held-out posts that the model classifies correctly: `[{text, true_subreddit, preview}]` |
| `POST /api/recommend` body `{"text": str}` | `{recommendations: [{subreddit, category, score, matched_words: [{word, weight}]}], n_known_words}` (top 5) |

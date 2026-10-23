"""Job 4: recommend communities for a text, and evaluate on the held-out test split."""
import math
import random
import sys
import time
from collections import Counter, defaultdict
from typing import Any

from db import get_db, log_step
from clean import normalise

TOP_K = 5
EVAL_SAMPLE = 5000


def score(db: Any, norms: dict[str, float], text: str) -> list[tuple[str, float]]:
    counts = Counter(text.split())
    totals: dict[str, float] = defaultdict(float)
    for doc in db.word_index.find({"_id": {"$in": list(counts)}}):
        tf = 1 + math.log(counts[doc["_id"]])
        for sub, w in doc["value"]["p"]:
            totals[sub] += tf * w
    ranked = sorted(((s, v / norms[s]) for s, v in totals.items() if s in norms),
                    key=lambda x: -x[1])
    return ranked[:TOP_K]


def main() -> None:
    started = time.time()
    db = get_db()
    norms = {d["_id"]: d["value"] ** 0.5 for d in db.sub_norms.find()}
    random.seed(7)
    test = list(db.posts_clean.aggregate([{"$match": {"split": "test"}},
                                          {"$sample": {"size": EVAL_SAMPLE}}]))
    popular = db.posts_clean.aggregate([{"$match": {"split": "train"}},
                                        {"$group": {"_id": "$subreddit", "n": {"$sum": 1}}},
                                        {"$sort": {"n": -1}}, {"$limit": TOP_K}])
    popular_subs = [d["_id"] for d in popular]
    hit1 = hitk = base_hit1 = base_hitk = 0
    for post in test:
        recs = [s for s, _ in score(db, norms, post["text"])]
        hit1 += bool(recs and recs[0] == post["subreddit"])
        hitk += post["subreddit"] in recs
        base_hit1 += post["subreddit"] == popular_subs[0]
        base_hitk += post["subreddit"] in popular_subs
    n = len(test)
    result = {"_id": "eval", "n_test": n, "k": TOP_K,
              "top1_accuracy": hit1 / n, f"hit_rate_at_{TOP_K}": hitk / n,
              "baseline_top1": base_hit1 / n, f"baseline_hit_rate_at_{TOP_K}": base_hitk / n}
    db.results.replace_one({"_id": "eval"}, result, upsert=True)
    print(result)
    print(log_step(db, "06_job4_recommend_eval", started, n, n, "held-out posts; TF-IDF scoring vs most-popular baseline"))


if __name__ == "__main__":
    if len(sys.argv) > 1:
        d = get_db()
        nrm = {x["_id"]: x["value"] ** 0.5 for x in d.sub_norms.find()}
        print(score(d, nrm, normalise(" ".join(sys.argv[1:]), "")))
    else:
        main()

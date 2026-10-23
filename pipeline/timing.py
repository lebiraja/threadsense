"""Compare mapReduce with an equivalent aggregation pipeline, with and without an index.

Task: word counts per (word, subreddit) over training posts of 50 subreddits.
"""
import time

from bson.code import Code

from db import get_db, log_step
from job1_wordcount import MAP, REDUCE, STOP

N_SUBS = 50


def main() -> None:
    started = time.time()
    db = get_db()
    subs = sorted(db.posts_clean.distinct("subreddit"))[:N_SUBS]
    query = {"split": "train", "subreddit": {"$in": subs}}
    n_in = db.posts_clean.count_documents(query)
    stop = list(STOP)

    def run_mr() -> int:
        db.command({"mapReduce": "posts_clean", "map": MAP, "reduce": REDUCE, "query": query,
                    "scope": {"STOP": STOP}, "out": {"replace": "timing_mr"}})
        return db.timing_mr.count_documents({})

    def run_agg() -> int:
        db.posts_clean.aggregate([
            {"$match": query},
            {"$project": {"subreddit": 1, "w": {"$setUnion": [{"$split": ["$text", " "]}, []]}}},
            {"$unwind": "$w"},
            {"$match": {"$expr": {"$and": [{"$gte": [{"$strLenCP": "$w"}, 3]},
                                           {"$lte": [{"$strLenCP": "$w"}, 20]}]},
                        "w": {"$nin": stop}}},
            {"$group": {"_id": {"$concat": ["$w", "|", "$subreddit"]}, "value": {"$sum": 1}}},
            {"$out": "timing_agg"},
        ], allowDiskUse=True)
        return db.timing_agg.count_documents({})

    rows = []
    for indexed in (True, False):
        if indexed:
            db.posts_clean.create_index("subreddit")
        else:
            db.posts_clean.drop_index("subreddit_1")
        for method, fn in (("mapReduce", run_mr), ("aggregation", run_agg)):
            t = time.time()
            n_out = fn()
            rows.append({"method": method, "indexed": indexed, "seconds": round(time.time() - t, 2),
                         "input_posts": n_in, "output_docs": n_out})
            print(rows[-1], flush=True)
    db.posts_clean.create_index("subreddit")
    db.results.replace_one({"_id": "timing"}, {"_id": "timing", "rows": rows}, upsert=True)
    db.timing_mr.drop()
    db.timing_agg.drop()
    print(log_step(db, "08_timing", started, n_in, len(rows),
                   "mapReduce vs aggregation pipeline, word counts for 50 subreddits, index on subreddit on/off"))


if __name__ == "__main__":
    main()

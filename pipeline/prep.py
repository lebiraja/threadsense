"""Step 7: load subreddit categories and precompute per-subreddit stats for the API."""
import csv
import time
from collections import defaultdict

from db import get_db, log_step

INFO_CSV = "/data/selfposts/subreddit_info.csv"
TOP_WORDS = 15


def main() -> None:
    started = time.time()
    db = get_db()
    info = {}
    with open(INFO_CSV, newline="") as f:
        for row in csv.DictReader(f):
            info[row["subreddit"]] = row["category_1"] or "uncategorised"
    posts = {d["_id"]: d["n"] for d in db.posts_clean.aggregate(
        [{"$group": {"_id": "$subreddit", "n": {"$sum": 1}}}])}
    top: dict[str, list[tuple[str, float]]] = defaultdict(list)
    for d in db.word_index.find():
        for sub, w in d["value"]["p"]:
            top[sub].append((d["_id"], w))
    db.subreddit_stats.drop()
    db.subreddit_stats.insert_many(
        {"_id": s, "category": info.get(s, "uncategorised"), "posts": n,
         "top_words": [{"word": w, "weight": round(x, 3)}
                       for w, x in sorted(top[s], key=lambda t: -t[1])[:TOP_WORDS]]}
        for s, n in posts.items())
    entry = log_step(db, "07_prep_stats", started, len(posts), db.subreddit_stats.count_documents({}),
                     "subreddit categories (subreddit_info.csv) + top TF-IDF words per subreddit")
    print(entry)


if __name__ == "__main__":
    main()

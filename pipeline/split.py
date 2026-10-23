"""Step 2: tag every post train/test (10% held out by a stable hash of the id)."""
import time

from db import get_db, log_step


def main() -> None:
    started = time.time()
    db = get_db()
    n = db.posts_clean.count_documents({})
    db.posts_clean.update_many({}, [{"$set": {"split": {
        "$cond": [{"$eq": [{"$mod": [{"$toHashedIndexKey": "$id"}, 10]}, 0]}, "test", "train"]}}}])
    db.posts_clean.create_index("split")
    entry = log_step(db, "02_split", started, n, n,
                     f"hash(id) mod 10 == 0 -> test ({db.posts_clean.count_documents({'split': 'test'})} posts)")
    print(entry)


if __name__ == "__main__":
    main()

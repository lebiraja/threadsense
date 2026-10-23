"""Step 1: posts_raw -> posts_clean (dedupe, normalise text, drop tiny posts)."""
import re
import time

from pymongo import ASCENDING
from pymongo.errors import BulkWriteError

from db import get_db, log_step

BATCH = 5000
MIN_WORDS = 5
URL = re.compile(r"https?://\S+")
ENTITY = re.compile(r"&gt;|&lt;|&amp;|&#x200B;")
NON_LETTER = re.compile(r"[^a-z' ]+")


def normalise(title: str, body: str) -> str:
    text = f"{title} {body}".replace("<lb>", " ")
    text = URL.sub(" ", ENTITY.sub(" ", text)).lower()
    return " ".join(NON_LETTER.sub(" ", text).split())


def main() -> None:
    started = time.time()
    db = get_db()
    db.posts_clean.drop()
    db.posts_clean.create_index([("id", ASCENDING)], unique=True)  # dedupe by Reddit id

    records_in = 0
    batch: list[dict] = []

    def flush() -> None:
        if not batch:
            return
        try:
            db.posts_clean.insert_many(batch, ordered=False)
        except BulkWriteError:
            pass  # duplicate ids rejected by the unique index
        batch.clear()

    for doc in db.posts_raw.find({}, {"_id": 0}, batch_size=BATCH):
        records_in += 1
        text = normalise(str(doc.get("title", "")), str(doc.get("selftext", "")))
        n_words = len(text.split())
        if n_words >= MIN_WORDS:
            batch.append({"id": doc["id"], "subreddit": doc["subreddit"],
                          "text": text, "n_words": n_words})
        if len(batch) >= BATCH:
            flush()
    flush()
    db.posts_clean.create_index([("subreddit", ASCENDING)])

    entry = log_step(db, "01_clean", started, records_in, db.posts_clean.count_documents({}),
                     "dedupe by id; strip <lb>, HTML entities, URLs; lowercase; letters only; "
                     f"drop posts under {MIN_WORDS} words")
    print(entry)


if __name__ == "__main__":
    main()

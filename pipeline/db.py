"""Shared Mongo connection and step logging."""
import os
import time
from datetime import datetime, timezone
from typing import Any

from pymongo import MongoClient
from pymongo.database import Database


def get_db() -> Database[Any]:
    return MongoClient(os.environ["MONGO_URI"])["threadsense"]


def log_step(db: Database[Any], step: str, started: float, records_in: int,
             records_out: int, notes: str) -> dict[str, Any]:
    entry = {
        "step": step,
        "finished": datetime.now(timezone.utc),
        "duration_s": round(time.time() - started, 2),
        "records_in": records_in,
        "records_out": records_out,
        "dropped": records_in - records_out,
        "notes": notes,
    }
    db.pipeline_logs.delete_many({"step": step})
    db.pipeline_logs.insert_one(dict(entry))
    return entry

import json
import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent.parent / "scoutai_cache.db"


def init_cache():
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS api_cache (
                cache_key TEXT PRIMARY KEY,
                data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def get_cached_data(cache_key: str):
    with sqlite3.connect(DB_PATH) as connection:
        row = connection.execute(
            """
            SELECT data
            FROM api_cache
            WHERE cache_key = ?
            """,
            (cache_key,),
        ).fetchone()

    if row is None:
        return None

    return json.loads(row[0])


def save_cached_data(cache_key: str, data):
    with sqlite3.connect(DB_PATH) as connection:
        connection.execute(
            """
            INSERT OR REPLACE INTO api_cache (cache_key, data)
            VALUES (?, ?)
            """,
            (cache_key, json.dumps(data)),
        )
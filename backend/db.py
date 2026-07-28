import sqlite3
from contextlib import contextmanager

import config


def _dict_factory(cursor, row):
    fields = [column[0] for column in cursor.description]
    return dict(zip(fields, row))


def get_connection():
    conn = sqlite3.connect(config.DB_PATH)
    conn.row_factory = _dict_factory
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


@contextmanager
def get_cursor(commit=False):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        yield cursor
        if commit:
            conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        cursor.close()
        conn.close()

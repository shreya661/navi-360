"""Database helper module for NAVI 360.
Provides SQLite database connection management, schema initialization, and column migrations.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
import hashlib
import secrets

from .settings import get_settings


def get_db_path() -> Path:
    configured = Path(get_settings().analysis_db_path)
    if configured.is_absolute():
        return configured
    return Path.cwd() / configured


def get_db_connection() -> sqlite3.Connection:
    path = get_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db() -> None:
    with get_db_connection() as conn:
        cursor = conn.cursor()
        
        # Users table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )

        # User Sessions table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )

        # User Settings table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS user_settings (
                user_id TEXT PRIMARY KEY,
                language TEXT DEFAULT 'te',
                deadline_reminders INTEGER DEFAULT 1,
                missing_doc_alerts INTEGER DEFAULT 1,
                api_key TEXT DEFAULT '',
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )

        # Cases table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS cases (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                status TEXT NOT NULL,
                priority TEXT NOT NULL,
                summary TEXT NOT NULL,
                request_id TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )

        # Evidence table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS evidence (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                case_id TEXT,
                file_name TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_path TEXT,
                extracted_text TEXT,
                source TEXT NOT NULL,
                created_at TEXT NOT NULL,
                metadata_json TEXT DEFAULT '{}',
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE SET NULL
            )
            """
        )

        # Reminders table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS reminders (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                case_id TEXT,
                title TEXT NOT NULL,
                description TEXT DEFAULT '',
                due_date TEXT NOT NULL,
                status TEXT NOT NULL,
                priority TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE SET NULL
            )
            """
        )

        # Analyses table
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS analyses (
                request_id TEXT PRIMARY KEY,
                user_id TEXT,
                created_at TEXT NOT NULL,
                language TEXT NOT NULL,
                notice_type TEXT NOT NULL,
                payload TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )

        # Check if user_id column exists in analyses table for migration
        cols = [row[1] for row in cursor.execute("PRAGMA table_info(analyses)").fetchall()]
        if "user_id" not in cols:
            cursor.execute("ALTER TABLE analyses ADD COLUMN user_id TEXT")

        conn.commit()


# Helper for password hashing using PBKDF2-HMAC-SHA256
def hash_password(password: str, salt: str | None = None) -> str:
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"{salt}${key.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt, key_hex = stored_hash.split("$")
        recalculated = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000).hex()
        return secrets.compare_digest(key_hex, recalculated)
    except Exception:
        return False

"""Small, local, privacy-conscious persistence for completed analyses."""

from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

from ..models.schemas import AnalysisResponse
from .settings import get_settings


def _database_path() -> Path:
    configured = Path(get_settings().analysis_db_path)
    if configured.is_absolute():
        return configured
    return Path(__file__).resolve().parents[3] / configured


def _connection() -> sqlite3.Connection:
    path = _database_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(path)
    connection.execute(
        """CREATE TABLE IF NOT EXISTS analyses (
        request_id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        language TEXT NOT NULL,
        notice_type TEXT NOT NULL,
        payload TEXT NOT NULL
        )"""
    )
    return connection


def _safe_payload(response: AnalysisResponse) -> dict:
    """Retain results, but exclude uploaded contents and optional audio data."""
    payload = response.model_dump(mode="json")
    payload["notice"]["extracted_text"] = ""
    for item in payload["evidence"]:
        item["text_preview"] = None
    for segment in payload["audio_segments"]:
        segment["audio_url"] = None
    return payload


def save_analysis(response: AnalysisResponse) -> None:
    payload = _safe_payload(response)
    with _connection() as connection:
        connection.execute(
            "INSERT OR REPLACE INTO analyses (request_id, created_at, language, notice_type, payload) VALUES (?, ?, ?, ?, ?)",
            (
                response.request_id,
                datetime.now(UTC).isoformat(),
                response.language,
                response.notice.notice_type,
                json.dumps(payload, ensure_ascii=False),
            ),
        )
        retention_days = get_settings().analysis_retention_days
        if retention_days > 0:
            connection.execute("DELETE FROM analyses WHERE created_at < datetime('now', ?)", (f"-{retention_days} days",))


def get_analysis(request_id: str) -> AnalysisResponse | None:
    with _connection() as connection:
        row = connection.execute("SELECT payload FROM analyses WHERE request_id = ?", (request_id,)).fetchone()
    return AnalysisResponse.model_validate_json(row[0]) if row else None


def delete_analysis(request_id: str) -> bool:
    with _connection() as connection:
        cursor = connection.execute("DELETE FROM analyses WHERE request_id = ?", (request_id,))
    return cursor.rowcount > 0

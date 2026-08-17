"""Small, local, privacy-conscious persistence for completed analyses."""

from __future__ import annotations

import json
import sqlite3
from datetime import UTC, datetime
from pathlib import Path

from ..models.schemas import AnalysisResponse
from .database import get_db_connection
from .settings import get_settings


def _safe_payload(response: AnalysisResponse) -> dict:
    """Retain results, but exclude uploaded contents and optional audio data."""
    payload = response.model_dump(mode="json")
    payload["notice"]["extracted_text"] = ""
    for item in payload["evidence"]:
        item["text_preview"] = None
    for segment in payload["audio_segments"]:
        segment["audio_url"] = None
    return payload


def save_analysis(response: AnalysisResponse, user_id: str | None = None) -> None:
    payload = _safe_payload(response)
    with get_db_connection() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO analyses (request_id, user_id, created_at, language, notice_type, payload)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                response.request_id,
                user_id,
                datetime.now(UTC).isoformat(),
                response.language,
                response.notice.notice_type,
                json.dumps(payload, ensure_ascii=False),
            ),
        )
        retention_days = get_settings().analysis_retention_days
        if retention_days > 0:
            conn.execute("DELETE FROM analyses WHERE created_at < datetime('now', ?)", (f"-{retention_days} days",))
        conn.commit()


def get_analysis(request_id: str, user_id: str | None = None) -> AnalysisResponse | None:
    with get_db_connection() as conn:
        row = conn.execute("SELECT payload, user_id FROM analyses WHERE request_id = ?", (request_id,)).fetchone()
        if not row:
            return None
        stored_user = row["user_id"]
        # Enforce user isolation: if an analysis belongs to a user, only that user can retrieve it
        if stored_user and stored_user != user_id:
            return None
    return AnalysisResponse.model_validate_json(row["payload"])


def get_user_analyses(user_id: str) -> list[AnalysisResponse]:
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT payload FROM analyses WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
            (user_id,),
        ).fetchall()
    return [AnalysisResponse.model_validate_json(row["payload"]) for row in rows]


def delete_analysis(request_id: str, user_id: str | None = None) -> bool:
    with get_db_connection() as conn:
        if user_id is None:
            cursor = conn.execute("DELETE FROM analyses WHERE request_id = ? AND user_id IS NULL", (request_id,))
        else:
            cursor = conn.execute("DELETE FROM analyses WHERE request_id = ? AND user_id = ?", (request_id, user_id))
        conn.commit()
    return cursor.rowcount > 0

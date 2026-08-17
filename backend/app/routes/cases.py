"""My Cases management routes."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from ..services.database import get_db_connection
from .auth import require_auth_user_id, get_current_user_id

router = APIRouter(prefix="/cases", tags=["cases"])


class CaseCreateRequest(BaseModel):
    title: str
    category: str = "General Notice"
    status: str = "Action Required"
    priority: str = "Critical"
    summary: str = ""
    request_id: str | None = None


def format_case_row(row, evidence_count: int = 0, reminders_count: int = 0) -> dict:
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "title": row["title"],
        "category": row["category"],
        "status": row["status"],
        "priority": row["priority"],
        "summary": row["summary"],
        "request_id": row["request_id"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "evidence_count": evidence_count,
        "reminders_count": reminders_count,
    }


@router.get("")
async def list_cases(
    q: str | None = Query(default=None),
    user_id: str = Depends(require_auth_user_id),
):
    with get_db_connection() as conn:
        if q and q.strip():
            term = f"%{q.strip().lower()}%"
            rows = conn.execute(
                """
                SELECT c.*, 
                    (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.id) as evidence_count,
                    (SELECT COUNT(*) FROM reminders r WHERE r.case_id = c.id) as reminders_count
                FROM cases c 
                WHERE c.user_id = ? AND (LOWER(c.title) LIKE ? OR LOWER(c.summary) LIKE ? OR LOWER(c.category) LIKE ?)
                ORDER BY c.created_at DESC
                """,
                (user_id, term, term, term),
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT c.*, 
                    (SELECT COUNT(*) FROM evidence e WHERE e.case_id = c.id) as evidence_count,
                    (SELECT COUNT(*) FROM reminders r WHERE r.case_id = c.id) as reminders_count
                FROM cases c 
                WHERE c.user_id = ?
                ORDER BY c.created_at DESC
                """,
                (user_id,),
            ).fetchall()

        cases = [format_case_row(row, row["evidence_count"], row["reminders_count"]) for row in rows]
        return {"cases": cases, "total": len(cases)}


@router.post("")
async def create_case(
    req: CaseCreateRequest,
    user_id: str = Depends(require_auth_user_id),
):
    if not req.title.strip():
        raise HTTPException(status_code=422, detail="Case title is required.")

    case_id = str(uuid4())
    now = datetime.now(UTC).isoformat()

    with get_db_connection() as conn:
        conn.execute(
            """
            INSERT INTO cases (id, user_id, title, category, status, priority, summary, request_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                case_id,
                user_id,
                req.title.strip(),
                req.category.strip(),
                req.status.strip(),
                req.priority.strip(),
                req.summary.strip(),
                req.request_id,
                now,
                now,
            ),
        )
        conn.commit()

        row = conn.execute("SELECT * FROM cases WHERE id = ?", (case_id,)).fetchone()
        return format_case_row(row)


@router.get("/{case_id}")
async def get_case_detail(
    case_id: str,
    user_id: str = Depends(require_auth_user_id),
):
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM cases WHERE id = ? AND user_id = ?", (case_id, user_id)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Case not found.")

        evidence_rows = conn.execute("SELECT * FROM evidence WHERE case_id = ? ORDER BY created_at DESC", (case_id,)).fetchall()
        reminder_rows = conn.execute("SELECT * FROM reminders WHERE case_id = ? ORDER BY created_at DESC", (case_id,)).fetchall()

        evidence = [
            {
                "id": e["id"],
                "file_name": e["file_name"],
                "file_type": e["file_type"],
                "source": e["source"],
                "created_at": e["created_at"],
                "extracted_text": e["extracted_text"],
            }
            for e in evidence_rows
        ]

        reminders = [
            {
                "id": r["id"],
                "title": r["title"],
                "description": r["description"],
                "due_date": r["due_date"],
                "status": r["status"],
                "priority": r["priority"],
            }
            for r in reminder_rows
        ]

        result = format_case_row(row, len(evidence), len(reminders))
        result["evidence"] = evidence
        result["reminders"] = reminders
        return result


@router.delete("/{case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_case(
    case_id: str,
    user_id: str = Depends(require_auth_user_id),
):
    with get_db_connection() as conn:
        cursor = conn.execute("DELETE FROM cases WHERE id = ? AND user_id = ?", (case_id, user_id))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Case not found.")

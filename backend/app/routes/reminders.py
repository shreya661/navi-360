"""Reminders management routes."""

from __future__ import annotations

from datetime import UTC, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from ..services.database import get_db_connection
from .auth import require_auth_user_id

router = APIRouter(prefix="/reminders", tags=["reminders"])


class ReminderCreateRequest(BaseModel):
    title: str
    description: str = ""
    due_date: str
    priority: str = "Action Required"
    case_id: str | None = None


class ReminderUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    due_date: str | None = None
    status: str | None = None
    priority: str | None = None


def format_reminder_row(row) -> dict:
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "case_id": row["case_id"],
        "title": row["title"],
        "description": row["description"],
        "due_date": row["due_date"],
        "status": row["status"],
        "priority": row["priority"],
        "created_at": row["created_at"],
    }


@router.get("")
async def list_reminders(
    user_id: str = Depends(require_auth_user_id),
):
    with get_db_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM reminders WHERE user_id = ? ORDER BY due_date ASC",
            (user_id,),
        ).fetchall()

        items = [format_reminder_row(r) for r in rows]
        active = [r for r in items if r["status"] != "Completed"]
        completed = [r for r in items if r["status"] == "Completed"]
        return {"reminders": items, "active_count": len(active), "completed_count": len(completed)}


@router.post("")
async def create_reminder(
    req: ReminderCreateRequest,
    user_id: str = Depends(require_auth_user_id),
):
    if not req.title.strip():
        raise HTTPException(status_code=422, detail="Reminder title is required.")
    if not req.due_date.strip():
        raise HTTPException(status_code=422, detail="Due date is required.")

    reminder_id = str(uuid4())
    now = datetime.now(UTC).isoformat()

    with get_db_connection() as conn:
        conn.execute(
            """
            INSERT INTO reminders (id, user_id, case_id, title, description, due_date, status, priority, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                reminder_id,
                user_id,
                req.case_id if req.case_id and req.case_id.strip() else None,
                req.title.strip(),
                req.description.strip(),
                req.due_date.strip(),
                "Active",
                req.priority.strip(),
                now,
            ),
        )
        conn.commit()

        row = conn.execute("SELECT * FROM reminders WHERE id = ?", (reminder_id,)).fetchone()
        return format_reminder_row(row)


@router.put("/{reminder_id}")
async def update_reminder(
    reminder_id: str,
    req: ReminderUpdateRequest,
    user_id: str = Depends(require_auth_user_id),
):
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM reminders WHERE id = ? AND user_id = ?", (reminder_id, user_id)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Reminder not found.")

        title = req.title.strip() if req.title is not None else row["title"]
        desc = req.description.strip() if req.description is not None else row["description"]
        due = req.due_date.strip() if req.due_date is not None else row["due_date"]
        rem_status = req.status.strip() if req.status is not None else row["status"]
        prio = req.priority.strip() if req.priority is not None else row["priority"]

        conn.execute(
            """
            UPDATE reminders
            SET title = ?, description = ?, due_date = ?, status = ?, priority = ?
            WHERE id = ? AND user_id = ?
            """,
            (title, desc, due, rem_status, prio, reminder_id, user_id),
        )
        conn.commit()

        updated = conn.execute("SELECT * FROM reminders WHERE id = ?", (reminder_id,)).fetchone()
        return format_reminder_row(updated)


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reminder(
    reminder_id: str,
    user_id: str = Depends(require_auth_user_id),
):
    with get_db_connection() as conn:
        cursor = conn.execute("DELETE FROM reminders WHERE id = ? AND user_id = ?", (reminder_id, user_id))
        conn.commit()
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Reminder not found.")

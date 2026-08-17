"""Evidence Vault management routes."""

from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel

from ..services.database import get_db_connection
from ..services.settings import get_settings
from .auth import require_auth_user_id

router = APIRouter(prefix="/evidence", tags=["evidence"])

UPLOADS_DIR = Path.cwd() / "data" / "uploads"


class TextEvidenceCreateRequest(BaseModel):
    title: str
    content: str
    category: str = "Documents"
    case_id: str | None = None


def format_evidence_row(row) -> dict:
    return {
        "id": row["id"],
        "user_id": row["user_id"],
        "case_id": row["case_id"],
        "file_name": row["file_name"],
        "file_type": row["file_type"],
        "file_path": row["file_path"],
        "extracted_text": row["extracted_text"],
        "source": row["source"],
        "created_at": row["created_at"],
    }


@router.get("")
async def list_evidence(
    category: str | None = None,
    user_id: str = Depends(require_auth_user_id),
):
    with get_db_connection() as conn:
        if category and category.lower() != "all":
            rows = conn.execute(
                "SELECT * FROM evidence WHERE user_id = ? AND LOWER(source) = ? ORDER BY created_at DESC",
                (user_id, category.lower()),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM evidence WHERE user_id = ? ORDER BY created_at DESC",
                (user_id,),
            ).fetchall()

        items = [format_evidence_row(r) for r in rows]
        return {"evidence": items, "total": len(items)}


@router.post("")
async def upload_evidence(
    file: UploadFile = File(default=None),
    text_content: str = Form(default=""),
    title: str = Form(default=""),
    category: str = Form(default="Documents"),
    case_id: str | None = Form(default=None),
    user_id: str = Depends(require_auth_user_id),
):
    if not file and not text_content.strip():
        raise HTTPException(status_code=422, detail="Please upload a file or paste text content.")

    settings = get_settings()

    # Validate case ownership if case_id provided
    clean_case_id = case_id.strip() if case_id and case_id.strip() else None
    if clean_case_id:
        with get_db_connection() as conn:
            case_check = conn.execute("SELECT id FROM cases WHERE id = ? AND user_id = ?", (clean_case_id, user_id)).fetchone()
            if not case_check:
                raise HTTPException(status_code=404, detail="Case not found or access denied.")

    evidence_id = str(uuid4())
    now = datetime.now(UTC).isoformat()
    file_path_str = None
    original_filename = Path(file.filename).name if file and file.filename else None
    file_name = original_filename if original_filename else (title.strip() or f"Evidence-{evidence_id[:8]}")
    file_type = file.content_type if file and file.content_type else "text/plain"

    if file:
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        max_bytes = settings.max_upload_mb * 1024 * 1024
        contents = await file.read()
        if len(contents) > max_bytes:
            raise HTTPException(
                status_code=422,
                detail=f"File exceeds maximum upload size of {settings.max_upload_mb} MB.",
            )

        safe_filename = f"{evidence_id}_{file_name}"
        target_path = UPLOADS_DIR / safe_filename
        target_path.write_bytes(contents)
        file_path_str = f"/data/uploads/{safe_filename}"

    with get_db_connection() as conn:
        conn.execute(
            """
            INSERT INTO evidence (id, user_id, case_id, file_name, file_type, file_path, extracted_text, source, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                evidence_id,
                user_id,
                clean_case_id,
                file_name,
                file_type,
                file_path_str,
                text_content.strip(),
                category.strip() or "Documents",
                now,
            ),
        )
        conn.commit()

        row = conn.execute("SELECT * FROM evidence WHERE id = ?", (evidence_id,)).fetchone()
        return format_evidence_row(row)


@router.get("/{evidence_id}/download")
async def download_evidence(
    evidence_id: str,
    user_id: str = Depends(require_auth_user_id),
):
    with get_db_connection() as conn:
        row = conn.execute("SELECT * FROM evidence WHERE id = ? AND user_id = ?", (evidence_id, user_id)).fetchone()
        if not row or not row["file_path"]:
            raise HTTPException(status_code=404, detail="Evidence file not found.")

        rel = row["file_path"].replace("/data/uploads/", "")
        local_file = (UPLOADS_DIR / rel).resolve()
        uploads_resolved = UPLOADS_DIR.resolve()

        if not local_file.is_relative_to(uploads_resolved) or not local_file.exists():
            raise HTTPException(status_code=404, detail="Evidence file not found.")

        return FileResponse(
            path=local_file,
            media_type=row["file_type"],
            filename=row["file_name"],
        )


@router.delete("/{evidence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_evidence(
    evidence_id: str,
    user_id: str = Depends(require_auth_user_id),
):
    with get_db_connection() as conn:
        row = conn.execute("SELECT file_path FROM evidence WHERE id = ? AND user_id = ?", (evidence_id, user_id)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Evidence item not found.")

        if row["file_path"]:
            rel = row["file_path"].replace("/data/uploads/", "")
            local_file = (UPLOADS_DIR / rel).resolve()
            uploads_resolved = UPLOADS_DIR.resolve()
            if local_file.is_relative_to(uploads_resolved) and local_file.exists():
                try:
                    local_file.unlink()
                except Exception:
                    pass

        conn.execute("DELETE FROM evidence WHERE id = ? AND user_id = ?", (evidence_id, user_id))
        conn.commit()


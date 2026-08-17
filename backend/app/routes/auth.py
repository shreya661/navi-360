"""Authentication and User Profile routes."""

from __future__ import annotations

from datetime import UTC, datetime
import secrets
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, EmailStr

from ..services.database import get_db_connection, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


class UserRegisterRequest(BaseModel):
    email: str
    password: str
    name: str | None = None


class UserLoginRequest(BaseModel):
    email: str
    password: str


class ProfileUpdateRequest(BaseModel):
    name: str | None = None
    email: str | None = None
    apiKey: str | None = None
    language: str | None = None
    deadlineReminders: bool | None = None
    missingDocAlerts: bool | None = None


def get_current_user_id(authorization: str | None = Header(default=None)) -> str | None:
    if not authorization:
        return None
    token = authorization.replace("Bearer ", "").strip() if authorization.startswith("Bearer ") else authorization.strip()
    if not token:
        return None

    with get_db_connection() as conn:
        row = conn.execute("SELECT user_id FROM sessions WHERE token = ?", (token,)).fetchone()
        if row:
            return row["user_id"]
    return None


def require_auth_user_id(authorization: str | None = Header(default=None)) -> str:
    user_id = get_current_user_id(authorization)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
        )
    return user_id


def build_user_payload(user_id: str) -> dict:
    with get_db_connection() as conn:
        user_row = conn.execute("SELECT id, email, name, created_at FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user_row:
            raise HTTPException(status_code=404, detail="User not found.")
        
        settings_row = conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user_id,)).fetchone()
        
        return {
            "id": user_row["id"],
            "email": user_row["email"],
            "name": user_row["name"],
            "apiKey": settings_row["api_key"] if settings_row else "",
            "language": settings_row["language"] if settings_row else "te",
            "notifications": {
                "deadline": bool(settings_row["deadline_reminders"]) if settings_row else True,
                "missingDoc": bool(settings_row["missing_doc_alerts"]) if settings_row else True,
            },
        }


@router.post("/register")
async def register(req: UserRegisterRequest):
    email = req.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=422, detail="Please enter a valid email address.")
    if len(req.password) < 4:
        raise HTTPException(status_code=422, detail="Password must be at least 4 characters long.")

    name = req.name.strip() if req.name and req.name.strip() else email.split("@")[0]
    user_id = str(uuid4())
    now = datetime.now(UTC).isoformat()
    hashed = hash_password(req.password)

    with get_db_connection() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="An account with this email address already exists.")

        conn.execute(
            "INSERT INTO users (id, email, name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, email, name, hashed, now, now),
        )
        conn.execute(
            "INSERT INTO user_settings (user_id, language, deadline_reminders, missing_doc_alerts, api_key, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (user_id, "te", 1, 1, "", now),
        )
        token = secrets.token_hex(32)
        conn.execute("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)", (token, user_id, now))
        conn.commit()

    return {"token": token, "user": build_user_payload(user_id)}


@router.post("/login")
async def login(req: UserLoginRequest):
    email = req.email.strip().lower()
    with get_db_connection() as conn:
        row = conn.execute("SELECT id, password_hash FROM users WHERE email = ?", (email,)).fetchone()
        if not row or not verify_password(req.password, row["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid email or password. Please try again.")

        user_id = row["id"]
        now = datetime.now(UTC).isoformat()
        token = secrets.token_hex(32)
        conn.execute("INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)", (token, user_id, now))
        conn.commit()

    return {"token": token, "user": build_user_payload(user_id)}


@router.post("/logout")
async def logout(authorization: str | None = Header(default=None)):
    if authorization:
        token = authorization.replace("Bearer ", "").strip()
        with get_db_connection() as conn:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
            conn.commit()
    return {"status": "ok"}


@router.get("/me")
async def get_me(user_id: str = Depends(require_auth_user_id)):
    return build_user_payload(user_id)


@router.patch("/me")
async def update_profile(req: ProfileUpdateRequest, user_id: str = Depends(require_auth_user_id)):
    now = datetime.now(UTC).isoformat()
    with get_db_connection() as conn:
        if req.name is not None or req.email is not None:
            current_user = conn.execute("SELECT email, name FROM users WHERE id = ?", (user_id,)).fetchone()
            new_name = req.name.strip() if req.name is not None and req.name.strip() else current_user["name"]
            new_email = req.email.strip().lower() if req.email is not None and req.email.strip() else current_user["email"]

            if new_email != current_user["email"]:
                conflict = conn.execute("SELECT id FROM users WHERE email = ? AND id != ?", (new_email, user_id)).fetchone()
                if conflict:
                    raise HTTPException(status_code=400, detail="This email is already in use by another account.")

            conn.execute(
                "UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?",
                (new_name, new_email, now, user_id),
            )

        if any(v is not None for v in (req.apiKey, req.language, req.deadlineReminders, req.missingDocAlerts)):
            current_settings = conn.execute("SELECT * FROM user_settings WHERE user_id = ?", (user_id,)).fetchone()
            api_key = req.apiKey.strip() if req.apiKey is not None else (current_settings["api_key"] if current_settings else "")
            lang = req.language if req.language is not None else (current_settings["language"] if current_settings else "te")
            deadline = int(req.deadlineReminders) if req.deadlineReminders is not None else (current_settings["deadline_reminders"] if current_settings else 1)
            missing = int(req.missingDocAlerts) if req.missingDocAlerts is not None else (current_settings["missing_doc_alerts"] if current_settings else 1)

            conn.execute(
                """
                INSERT INTO user_settings (user_id, language, deadline_reminders, missing_doc_alerts, api_key, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(user_id) DO UPDATE SET
                    language = excluded.language,
                    deadline_reminders = excluded.deadline_reminders,
                    missing_doc_alerts = excluded.missing_doc_alerts,
                    api_key = excluded.api_key,
                    updated_at = excluded.updated_at
                """,
                (user_id, lang, deadline, missing, api_key, now),
            )
        conn.commit()

    return build_user_payload(user_id)

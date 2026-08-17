from uuid import uuid4
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoints():
    res1 = client.get("/health")
    assert res1.status_code == 200
    assert res1.json()["status"] == "ok"

    res2 = client.get("/api/health")
    assert res2.status_code == 200
    assert res2.json()["status"] == "ok"


def test_readiness_endpoints():
    res1 = client.get("/ready")
    assert res1.status_code == 200
    assert "live_ai_configured" in res1.json()

    res2 = client.get("/api/ready")
    assert res2.status_code == 200
    assert "live_ai_configured" in res2.json()
    assert res2.json()["db_connected"] is True


def test_auth_flow():
    email = f"testuser_{uuid4().hex[:8]}@example.com"
    password = "password123"
    name = "Test QA User"

    res_reg = client.post("/api/auth/register", json={"email": email, "password": password, "name": name})
    assert res_reg.status_code == 200
    reg_data = res_reg.json()
    assert "token" in reg_data
    token = reg_data["token"]
    assert reg_data["user"]["email"] == email
    assert reg_data["user"]["name"] == name

    # Get Me
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["email"] == email

    # Update Profile
    res_update = client.patch(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Updated QA User", "language": "hi"},
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Updated QA User"
    assert res_update.json()["language"] == "hi"

    # Login
    res_login = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res_login.status_code == 200
    assert res_login.json()["user"]["name"] == "Updated QA User"


def test_cases_crud():
    email = f"caseuser_{uuid4().hex[:8]}@example.com"
    res_reg = client.post("/api/auth/register", json={"email": email, "password": "password123", "name": "Case User"})
    assert res_reg.status_code == 200
    token = res_reg.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Case
    res_create = client.post(
        "/api/cases",
        headers=headers,
        json={"title": "Electricity Bill Notice", "category": "Utility Notice", "status": "Action Required", "summary": "Payment due soon"},
    )
    assert res_create.status_code == 200
    case_id = res_create.json()["id"]

    # List Cases
    res_list = client.get("/api/cases", headers=headers)
    assert res_list.status_code == 200
    assert res_list.json()["total"] >= 1

    # Detail
    res_detail = client.get(f"/api/cases/{case_id}", headers=headers)
    assert res_detail.status_code == 200
    assert res_detail.json()["title"] == "Electricity Bill Notice"

    # Delete
    res_del = client.delete(f"/api/cases/{case_id}", headers=headers)
    assert res_del.status_code == 204


def test_reminders_crud():
    email = f"remuser_{uuid4().hex[:8]}@example.com"
    res_reg = client.post("/api/auth/register", json={"email": email, "password": "password123", "name": "Reminder User"})
    assert res_reg.status_code == 200
    token = res_reg.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create
    res_create = client.post(
        "/api/reminders",
        headers=headers,
        json={"title": "Scholarship Deadline", "due_date": "2026-08-30", "priority": "Critical"},
    )
    assert res_create.status_code == 200
    rem_id = res_create.json()["id"]

    # List
    res_list = client.get("/api/reminders", headers=headers)
    assert res_list.status_code == 200
    assert res_list.json()["active_count"] >= 1

    # Update status to Completed
    res_up = client.put(f"/api/reminders/{rem_id}", headers=headers, json={"status": "Completed"})
    assert res_up.status_code == 200
    assert res_up.json()["status"] == "Completed"

    # Delete
    res_del = client.delete(f"/api/reminders/{rem_id}", headers=headers)
    assert res_del.status_code == 204


def test_empty_analyze_returns_422():
    res = client.post("/api/analyze", data={"text_input": "", "language": "te"})
    assert res.status_code == 422


def test_analyze_and_store_lifecycle():
    # Create analysis via /api/analyze
    res = client.post("/api/analyze", data={"text_input": "Scholarship notice for 2026", "language": "en"})
    assert res.status_code == 200
    data = res.json()
    assert "request_id" in data
    assert data["notice"]["title"] != ""
    request_id = data["request_id"]

    # Retrieve analysis via /api/analyses/{request_id}
    res_get = client.get(f"/api/analyses/{request_id}")
    assert res_get.status_code == 200
    assert res_get.json()["request_id"] == request_id

    # Delete analysis via /api/analyses/{request_id}
    res_del = client.delete(f"/api/analyses/{request_id}")
    assert res_del.status_code == 204

    # Confirm deleted
    res_get_deleted = client.get(f"/api/analyses/{request_id}")
    assert res_get_deleted.status_code == 404

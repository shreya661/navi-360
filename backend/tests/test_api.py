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


def test_user_data_isolation():
    # User A setup
    email_a = f"usera_{uuid4().hex[:8]}@example.com"
    reg_a = client.post("/api/auth/register", json={"email": email_a, "password": "password123", "name": "User A"})
    assert reg_a.status_code == 200
    token_a = reg_a.json()["token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # User B setup
    email_b = f"userb_{uuid4().hex[:8]}@example.com"
    reg_b = client.post("/api/auth/register", json={"email": email_b, "password": "password123", "name": "User B"})
    assert reg_b.status_code == 200
    token_b = reg_b.json()["token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # User A creates a case
    res_case_a = client.post("/api/cases", headers=headers_a, json={"title": "User A Private Case", "category": "Tax Notice"})
    assert res_case_a.status_code == 200
    case_a_id = res_case_a.json()["id"]

    # User B tries to access User A's case -> 404
    assert client.get(f"/api/cases/{case_a_id}", headers=headers_b).status_code == 404
    assert client.delete(f"/api/cases/{case_a_id}", headers=headers_b).status_code == 404

    # User B tries to attach evidence to User A's case -> 404
    res_cross_ev = client.post(
        "/api/evidence",
        headers=headers_b,
        data={"title": "Sneaky Evidence", "category": "Documents", "text_content": "Test", "case_id": case_a_id},
    )
    assert res_cross_ev.status_code == 404

    # User B tries to create reminder on User A's case -> 404
    res_cross_rem = client.post(
        "/api/reminders",
        headers=headers_b,
        json={"title": "Sneaky Reminder", "due_date": "2026-09-01", "case_id": case_a_id},
    )
    assert res_cross_rem.status_code == 404

    # User A creates an analysis
    res_an_a = client.post("/api/analyze", headers=headers_a, data={"text_input": "Notice for User A", "language": "en"})
    assert res_an_a.status_code == 200
    analysis_a_id = res_an_a.json()["request_id"]

    # User B tries to access or delete User A's analysis -> 404
    assert client.get(f"/api/analyses/{analysis_a_id}", headers=headers_b).status_code == 404
    assert client.delete(f"/api/analyses/{analysis_a_id}", headers=headers_b).status_code == 404


def test_evidence_download():
    # User A setup
    email_a = f"evuser_{uuid4().hex[:8]}@example.com"
    reg_a = client.post("/api/auth/register", json={"email": email_a, "password": "password123", "name": "EV User"})
    token_a = reg_a.json()["token"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Upload evidence file
    files = {"file": ("test_doc.txt", b"Confidential evidence content", "text/plain")}
    res_up = client.post("/api/evidence", headers=headers_a, data={"title": "Doc"}, files=files)
    assert res_up.status_code == 200
    evidence_id = res_up.json()["id"]

    # Owner download -> 200 OK
    res_down = client.get(f"/api/evidence/{evidence_id}/download", headers=headers_a)
    assert res_down.status_code == 200
    assert res_down.content == b"Confidential evidence content"

    # Unauthenticated download -> 401
    res_unauth = client.get(f"/api/evidence/{evidence_id}/download")
    assert res_unauth.status_code == 401

    # User B download -> 404
    email_b = f"evuser_b_{uuid4().hex[:8]}@example.com"
    reg_b = client.post("/api/auth/register", json={"email": email_b, "password": "password123", "name": "EV User B"})
    headers_b = {"Authorization": f"Bearer {reg_b.json()['token']}"}
    res_cross_down = client.get(f"/api/evidence/{evidence_id}/download", headers=headers_b)
    assert res_cross_down.status_code == 404


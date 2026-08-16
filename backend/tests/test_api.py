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

def test_empty_analyze_returns_422():
    res = client.post("/analyze", data={"text_input": "", "language": "te"})
    assert res.status_code == 422

def test_analyze_and_store_lifecycle():
    # 1. Create analysis via /analyze
    res = client.post("/analyze", data={"text_input": "Scholarship notice for 2026", "language": "en"})
    assert res.status_code == 200
    data = res.json()
    assert "request_id" in data
    assert data["notice"]["title"] != ""
    request_id = data["request_id"]

    # 2. Retrieve analysis via /analyses/{request_id}
    res_get = client.get(f"/analyses/{request_id}")
    assert res_get.status_code == 200
    assert res_get.json()["request_id"] == request_id

    # 3. Delete analysis via /analyses/{request_id}
    res_del = client.delete(f"/analyses/{request_id}")
    assert res_del.status_code == 204

    # 4. Confirm deleted
    res_get_deleted = client.get(f"/analyses/{request_id}")
    assert res_get_deleted.status_code == 404

def test_api_prefix_analyze():
    res = client.post("/api/analyze", data={"text_input": "Tax notice test", "language": "hi"})
    assert res.status_code == 200
    assert res.json()["language"] == "hi"

def test_custom_nvidia_api_key_header():
    # Passing a custom API key triggers the live LLM attempt; an invalid test key returns 502 Bad Gateway from the AI provider
    res = client.post(
        "/analyze",
        data={"text_input": "Custom key test notice", "language": "te"},
        headers={"X-NVIDIA-API-KEY": "nvapi-invalid-test-key"},
    )
    assert res.status_code == 502
    assert "detail" in res.json()

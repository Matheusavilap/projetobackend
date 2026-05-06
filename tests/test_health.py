from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint_exists():
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["ok"] is True
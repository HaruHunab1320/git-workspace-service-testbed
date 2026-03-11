"""
Unit tests for the GET /api/health endpoint.
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from server import app


@pytest.fixture
def client():
    return TestClient(app)


class TestHealthEndpoint:
    def test_returns_200(self, client):
        r = client.get("/api/health")
        assert r.status_code == 200

    def test_response_structure(self, client):
        data = client.get("/api/health").json()
        assert "status" in data
        assert "version" in data
        assert "git_commit" in data
        assert "uptime_seconds" in data
        assert "database" in data
        assert "status" in data["database"]

    def test_healthy_status(self, client):
        data = client.get("/api/health").json()
        assert data["status"] == "healthy"
        assert data["database"]["status"] == "connected"

    def test_version_present(self, client):
        data = client.get("/api/health").json()
        assert data["version"] == "1.0.0"

    def test_git_commit_present(self, client):
        data = client.get("/api/health").json()
        assert isinstance(data["git_commit"], str)
        assert len(data["git_commit"]) > 0

    def test_uptime_is_positive(self, client):
        data = client.get("/api/health").json()
        assert data["uptime_seconds"] >= 0

    def test_degraded_when_game_unavailable(self, client):
        with patch("server.game") as mock_game:
            mock_game.day = property(lambda self: (_ for _ in ()).throw(RuntimeError))
            type(mock_game).day = property(lambda self: (_ for _ in ()).throw(RuntimeError("boom")))
            data = client.get("/api/health").json()
            assert data["status"] == "degraded"
            assert data["database"]["status"] == "disconnected"

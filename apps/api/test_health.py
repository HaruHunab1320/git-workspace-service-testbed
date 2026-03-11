"""Unit tests for GET /api/health endpoint."""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from server import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_200_when_healthy(self):
        r = client.get("/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["database"] == "connected"

    def test_health_includes_version(self):
        r = client.get("/api/health")
        data = r.json()
        assert "version" in data
        assert data["version"] == "1.0.0"

    def test_health_includes_commit(self):
        with patch("server._git_commit", "abc123"):
            r = client.get("/api/health")
            data = r.json()
            assert data["commit"] == "abc123"

    def test_health_includes_uptime(self):
        r = client.get("/api/health")
        data = r.json()
        assert "uptime" in data
        assert isinstance(data["uptime"], float)
        assert data["uptime"] >= 0

    def test_health_returns_503_when_db_disconnected(self):
        with patch("server._db_check", side_effect=Exception("connection refused")):
            r = client.get("/api/health")
            assert r.status_code == 503
            data = r.json()
            assert data["status"] == "error"
            assert data["database"] == "disconnected"

    def test_health_returns_503_when_db_check_returns_false(self):
        with patch("server._db_check", return_value=False):
            r = client.get("/api/health")
            assert r.status_code == 503
            data = r.json()
            assert data["status"] == "error"
            assert data["database"] == "disconnected"

    def test_health_response_has_all_fields(self):
        r = client.get("/api/health")
        data = r.json()
        expected_fields = {"status", "version", "commit", "uptime", "database"}
        assert set(data.keys()) == expected_fields

    def test_health_git_commit_defaults_to_unknown(self):
        with patch("server._git_commit", "unknown"):
            r = client.get("/api/health")
            data = r.json()
            assert data["commit"] == "unknown"

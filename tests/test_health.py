"""
Tests for health check endpoints.
These endpoints have no DB dependency, so they use the plain ASGI client.
"""
import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.fixture
async def bare_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_liveness(bare_client):
    resp = await bare_client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "version" in body
    assert "timestamp" in body


@pytest.mark.asyncio
async def test_liveness_service_name(bare_client):
    resp = await bare_client.get("/health")
    assert resp.json()["service"] == "Voxa AI Voice Agent"


@pytest.mark.asyncio
async def test_detailed_health_shape(bare_client):
    """Detailed health must return the expected service keys even when all deps are down."""
    resp = await bare_client.get("/api/v1/health/detailed")
    assert resp.status_code == 200
    body = resp.json()
    assert "status" in body
    assert "timestamp" in body
    services = body.get("services", {})
    expected_keys = {"postgres", "redis", "chromadb", "openai", "deepgram", "elevenlabs", "twilio"}
    assert expected_keys == set(services.keys())


@pytest.mark.asyncio
async def test_detailed_health_status_values(bare_client):
    """Every service entry must have a 'status' field with a recognised value."""
    resp = await bare_client.get("/api/v1/health/detailed")
    services = resp.json()["services"]
    allowed = {"ok", "error", "unconfigured", "degraded"}
    for svc, info in services.items():
        assert "status" in info, f"{svc} missing 'status'"
        assert info["status"] in allowed, f"{svc} has unexpected status: {info['status']}"

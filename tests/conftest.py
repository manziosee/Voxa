"""
Shared pytest fixtures.

Uses httpx.AsyncClient with ASGI transport to exercise the FastAPI app in-process.
Database calls are intercepted via a mock AsyncSession injected through the get_db
dependency override, so tests run without a live PostgreSQL connection.
"""
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.api.deps import get_db


@pytest.fixture
def mock_db():
    """Minimal async session mock — add .get / .execute / .scalar_one_or_none as needed per test."""
    session = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.flush = AsyncMock()
    session.refresh = AsyncMock()
    session.add = MagicMock()
    return session


@pytest_asyncio.fixture
async def client(mock_db):
    """AsyncClient with the real ASGI app and get_db overridden to the mock session."""
    async def _override_db():
        yield mock_db

    app.dependency_overrides[get_db] = _override_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.pop(get_db, None)


@pytest_asyncio.fixture
async def unauthed_client():
    """Client without any dependency overrides — for testing 403/401 responses."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

"""
Detailed health checks for all external dependencies.
"""
import asyncio
from datetime import datetime

import httpx
from fastapi import APIRouter
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/health", tags=["Health"])


async def _check_postgres() -> dict:
    try:
        from sqlalchemy import text
        from app.database import AsyncSessionLocal
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
        return {"status": "ok"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


async def _check_redis() -> dict:
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.redis_url, socket_connect_timeout=3)
        await r.ping()
        await r.aclose()
        return {"status": "ok"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


async def _check_chromadb() -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"http://{settings.chroma_host}:{settings.chroma_port}/api/v1/heartbeat")
            if resp.status_code == 200:
                return {"status": "ok"}
            return {"status": "error", "detail": f"HTTP {resp.status_code}"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


async def _check_openai() -> dict:
    if not settings.openai_api_key:
        return {"status": "unconfigured"}
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
            )
            if resp.status_code == 200:
                return {"status": "ok"}
            return {"status": "error", "detail": f"HTTP {resp.status_code}"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


async def _check_deepgram() -> dict:
    if not settings.deepgram_api_key:
        return {"status": "unconfigured"}
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                "https://api.deepgram.com/v1/projects",
                headers={"Authorization": f"Token {settings.deepgram_api_key}"},
            )
            if resp.status_code in (200, 401):
                # 401 means key is invalid but service is reachable
                return {"status": "ok" if resp.status_code == 200 else "error", "detail": f"HTTP {resp.status_code}"}
            return {"status": "error", "detail": f"HTTP {resp.status_code}"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


async def _check_elevenlabs() -> dict:
    if not settings.elevenlabs_api_key:
        return {"status": "unconfigured"}
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                "https://api.elevenlabs.io/v1/user",
                headers={"xi-api-key": settings.elevenlabs_api_key},
            )
            if resp.status_code == 200:
                return {"status": "ok"}
            return {"status": "error", "detail": f"HTTP {resp.status_code}"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


async def _check_twilio() -> dict:
    if not settings.twilio_account_sid or not settings.twilio_auth_token:
        return {"status": "unconfigured"}
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(
                f"https://api.twilio.com/2010-04-01/Accounts/{settings.twilio_account_sid}.json",
                auth=(settings.twilio_account_sid, settings.twilio_auth_token),
            )
            if resp.status_code == 200:
                return {"status": "ok"}
            return {"status": "error", "detail": f"HTTP {resp.status_code}"}
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


@router.get(
    "/detailed",
    summary="Detailed dependency health",
    description=(
        "Check connectivity to all external services: PostgreSQL, Redis, ChromaDB, "
        "OpenAI, Deepgram, ElevenLabs, and Twilio. Returns individual status per service."
    ),
)
async def detailed_health():
    checks = await asyncio.gather(
        _check_postgres(),
        _check_redis(),
        _check_chromadb(),
        _check_openai(),
        _check_deepgram(),
        _check_elevenlabs(),
        _check_twilio(),
        return_exceptions=True,
    )

    labels = ["postgres", "redis", "chromadb", "openai", "deepgram", "elevenlabs", "twilio"]
    services = {}
    overall = "ok"
    for label, result in zip(labels, checks):
        if isinstance(result, Exception):
            services[label] = {"status": "error", "detail": str(result)}
            overall = "degraded"
        else:
            services[label] = result
            if result.get("status") == "error":
                overall = "degraded"

    return {
        "status": overall,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "services": services,
    }

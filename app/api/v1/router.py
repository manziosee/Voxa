from fastapi import APIRouter, Depends
from app.api.deps import require_api_key
from app.api.v1 import (
    businesses, customers, appointments, calls,
    whatsapp, webhooks, analytics, outbound, utilities,
    auth, tickets, sms, webhook_configs, health,
)

api_router = APIRouter()

# ── Public routes (no API key) ─────────────────────────────────────────────
# Twilio/Meta call these directly; they validate via their own signatures.
api_router.include_router(webhooks.router)           # Twilio voice
api_router.include_router(whatsapp.router)           # Meta WhatsApp webhook
api_router.include_router(sms.router)                # Twilio SMS webhook
api_router.include_router(health.router)             # Health checks
api_router.include_router(auth.router)               # API key creation (bootstrapping)

# ── Protected routes (X-API-Key required) ─────────────────────────────────
_protected = {"dependencies": [Depends(require_api_key)]}

api_router.include_router(businesses.router, **_protected)
api_router.include_router(customers.router, **_protected)
api_router.include_router(appointments.router, **_protected)
api_router.include_router(calls.router, **_protected)
api_router.include_router(tickets.router, **_protected)
api_router.include_router(webhook_configs.router, **_protected)
api_router.include_router(analytics.router, **_protected)
api_router.include_router(outbound.router, **_protected)
api_router.include_router(utilities.router, **_protected)

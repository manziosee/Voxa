from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import get_settings
from app.core.exceptions import VoxaException, voxa_exception_handler
from app.core.logging import configure_logging
from app.api.v1.router import api_router

settings = get_settings()

DESCRIPTION = """
## Voxa — AI Voice Agent for African Businesses

Voxa is a **24/7 multilingual AI phone receptionist** that handles inbound calls,
books appointments, speaks local languages, and integrates with WhatsApp and SMS.

### Authentication
All API requests must include an `X-API-Key` header.
Generate keys via `POST /api/v1/auth/businesses/{id}/keys`.

### Supported Languages
| Code | Language    |
|------|-------------|
| `en` | English     |
| `fr` | French      |
| `sw` | Swahili     |
| `rw` | Kinyarwanda |

### Core Voice Pipeline
```
Caller → Twilio → /webhooks/twilio/inbound
                      ↓
              IVR Menu (optional) OR direct AI greeting
                      ↓
              Caller speaks → Deepgram STT
                      ↓
              LangGraph AI Agent (RAG + Memory)
                      ↓
              Emotion detection → Escalation check
                      ↓
              ElevenLabs TTS → TwiML response
                      ↓
              Loop → Call ends → AI summary generated
```

### Communication Channels
| Channel   | Description |
|-----------|-------------|
| **Voice** | Twilio inbound/outbound calls with full AI agent |
| **WhatsApp** | Meta Cloud API + interactive buttons |
| **SMS** | Twilio Programmable SMS |

### CRM Event Forwarding
Subscribe to Voxa events and receive signed webhook payloads at your CRM endpoint.
Events: `call.completed` · `call.escalated` · `call.missed` · `appointment.booked` ·
`appointment.cancelled` · `ticket.created` · `customer.created`

### Business Categories
`clinic` · `salon` · `hotel` · `logistics` · `sacco` · `agriculture` · `restaurant` · `other`

---
> Base URL: `{base_url}/api/v1`
> Rate limit: 100 requests/minute per IP (Twilio webhooks exempt)
"""

TAGS_METADATA = [
    {
        "name": "Health",
        "description": "Service liveness and detailed dependency status checks (PostgreSQL, Redis, ChromaDB, OpenAI, Deepgram, ElevenLabs, Twilio).",
    },
    {
        "name": "Auth",
        "description": (
            "API key management for business tenants. Keys are SHA-256 hashed before storage — "
            "the raw key is shown **only once** at creation. Include keys in `X-API-Key` header."
        ),
    },
    {
        "name": "Businesses",
        "description": (
            "Register and manage businesses. Each business gets its own AI persona, "
            "knowledge base, language settings, booking calendar, and IVR configuration."
        ),
    },
    {
        "name": "Customers",
        "description": (
            "Customer records are created automatically on first call or message. "
            "The AI builds a vector memory of each customer's history, preferences, and complaints."
        ),
    },
    {
        "name": "Appointments",
        "description": (
            "Full booking lifecycle: create, check availability, update, cancel. "
            "WhatsApp interactive buttons and SMS confirmations/reminders are sent automatically."
        ),
    },
    {
        "name": "Tickets",
        "description": (
            "Support ticket management. Tickets are created automatically when the AI detects "
            "a complaint, or manually via this API. Full status workflow: open → in_progress → resolved → closed."
        ),
    },
    {
        "name": "Calls",
        "description": (
            "Read-only access to call records, full transcripts, and AI-generated call summaries "
            "with speaker labels, emotion detection, and escalation details."
        ),
    },
    {
        "name": "WhatsApp",
        "description": (
            "WhatsApp Business API webhook handler and direct chat API. "
            "Supports Meta Cloud API (production) and Twilio WhatsApp sandbox (dev). "
            "Includes interactive button messages for appointment confirmations."
        ),
    },
    {
        "name": "SMS",
        "description": (
            "Twilio Programmable SMS channel. Inbound SMS is processed by the same AI agent. "
            "Appointment confirmations and reminders can be sent via SMS."
        ),
    },
    {
        "name": "Analytics",
        "description": (
            "Business-level metrics: call volumes, outcomes, escalation rates, appointment conversion, "
            "language and emotion distribution. Includes CSV export for calls and appointments."
        ),
    },
    {
        "name": "Outbound",
        "description": "Initiate outbound calls and schedule customer callbacks with custom scripts.",
    },
    {
        "name": "Webhook Configs",
        "description": (
            "Subscribe external CRM endpoints (HubSpot, Salesforce, Zoho, custom) to Voxa events. "
            "Payloads are signed with HMAC-SHA256 via `X-Voxa-Signature` header."
        ),
    },
    {
        "name": "Webhooks",
        "description": (
            "Twilio voice webhook handlers — called by Twilio, not your app. "
            "Implements: inbound call → IVR (optional) → AI speech loop → status callback with summary generation."
        ),
    },
    {
        "name": "Utilities",
        "description": "Knowledge base management, language detection, and TTS audio preview.",
    },
]


limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging(settings.debug)
    yield


app = FastAPI(
    title=settings.app_name,
    description=DESCRIPTION,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=TAGS_METADATA,
    contact={
        "name": "SIC Rwanda",
        "email": "info@sicrwanda.com",
    },
    license_info={
        "name": "MIT",
    },
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(VoxaException, voxa_exception_handler)
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.get(
    "/health",
    tags=["Health"],
    summary="Liveness check",
    description="Quick liveness probe. See `/api/v1/health/detailed` for dependency status.",
    response_description="Service is up and running",
)
async def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "environment": settings.app_env,
        "detailed_health": f"{settings.api_v1_prefix}/health/detailed",
    }

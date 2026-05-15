from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi

from app.config import get_settings
from app.core.exceptions import VoxaException, voxa_exception_handler
from app.core.logging import configure_logging
from app.api.v1.router import api_router

settings = get_settings()

DESCRIPTION = """
## Voxa — AI Voice Agent for African Businesses

Voxa is a **24/7 multilingual AI phone receptionist** that handles inbound calls,
books appointments, speaks local languages, and integrates with WhatsApp.

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
              AI Greeting (TwiML)
                      ↓
              Caller speaks → Deepgram STT
                      ↓
              LangGraph AI Agent (RAG + Memory)
                      ↓
              ElevenLabs TTS → TwiML response
                      ↓
              Loop until resolved or escalated
```

### WhatsApp Integration
Incoming WhatsApp messages from customers are processed by the same AI agent
and replies are sent back automatically. Appointment confirmations and
24-hour reminders are delivered via WhatsApp.

### Business Categories
`clinic` · `salon` · `hotel` · `logistics` · `sacco` · `agriculture` · `restaurant` · `other`

---
> Base URL: `{base_url}/api/v1`
> Auth: API Key via `X-API-Key` header *(coming in v1.1)*
"""

TAGS_METADATA = [
    {
        "name": "Health",
        "description": "Service liveness and dependency status checks.",
    },
    {
        "name": "Businesses",
        "description": (
            "Register and manage businesses. Each business gets its own AI persona, "
            "knowledge base, language settings, and booking calendar."
        ),
    },
    {
        "name": "Customers",
        "description": (
            "Customer records are created automatically on first call or WhatsApp message. "
            "The AI builds a memory of each customer's history, preferences, and complaints."
        ),
    },
    {
        "name": "Appointments",
        "description": (
            "Full booking lifecycle: create, check availability, update, cancel. "
            "WhatsApp confirmations and reminders are sent automatically."
        ),
    },
    {
        "name": "Calls",
        "description": (
            "Read-only access to call records and full transcripts with speaker labels, "
            "emotion detection, and escalation details."
        ),
    },
    {
        "name": "WhatsApp",
        "description": (
            "WhatsApp Business API webhook handler and direct chat API. "
            "Supports Meta Cloud API and Twilio WhatsApp sandbox."
        ),
    },
    {
        "name": "Analytics",
        "description": (
            "Business-level metrics: call volumes, outcomes, escalation rates, "
            "appointment conversion, and language distribution."
        ),
    },
    {
        "name": "Outbound",
        "description": "Initiate outbound calls and schedule customer callbacks.",
    },
    {
        "name": "Webhooks",
        "description": (
            "Twilio voice webhook handlers — called directly by Twilio, not by your app. "
            "Implements the full voice turn loop: inbound → speech → status."
        ),
    },
]


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
    response_description="Service is up and running",
    responses={
        200: {
            "content": {
                "application/json": {
                    "example": {
                        "status": "ok",
                        "service": "Voxa AI Voice Agent",
                        "version": "1.0.0",
                        "timestamp": "2026-05-15T10:00:00Z",
                    }
                }
            }
        }
    },
)
async def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "environment": settings.app_env,
    }

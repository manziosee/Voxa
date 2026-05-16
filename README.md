<div align="center">

# 🎙️ Voxa — AI Voice Agent for African Businesses

**24/7 multilingual AI phone receptionist that answers calls, books appointments,
speaks local languages, and integrates with WhatsApp and SMS.**

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

</div>

---

## Why Voxa?

| Problem | Voxa Solution |
|---|---|
| Businesses miss calls after hours | 24/7 AI answers every call |
| Can't afford a full-time receptionist | AI costs a fraction of a salary |
| Customers speak Kinyarwanda, Swahili, French | Native multilingual support built-in |
| Appointments lost in phone calls | Auto-booking + WhatsApp/SMS confirmation |
| No record of customer history | AI memory per customer + CRM integration |
| Difficult clients escalate needlessly | Emotion detection → smart human handoff |

---

## Tech Stack

### 🖥️ Backend & Infrastructure

| Technology | Role | Version |
|---|---|---|
| [![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://python.org) **Python** | Primary language | 3.12+ |
| [![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com) **FastAPI** | Async REST API framework | 0.115 |
| [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org) **PostgreSQL** | Primary database | 16 |
| [![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis&logoColor=white)](https://redis.io) **Redis** | Task queue broker | 7 |
| [![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com) **Docker** | Containerization | 24+ |
| [![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=flat&logo=sqlalchemy&logoColor=white)](https://sqlalchemy.org) **SQLAlchemy** | Async ORM | 2.0 |
| **Celery** | Async task queue (reminders, callbacks) | 5.4 |
| **Alembic** | Database migrations | 1.14 |

### 🤖 AI & Language Models

| Technology | Role |
|---|---|
| [![OpenAI](https://img.shields.io/badge/OpenAI_GPT--4o-412991?style=flat&logo=openai&logoColor=white)](https://openai.com) **OpenAI GPT-4o** | Primary LLM for reasoning & responses |
| [![Anthropic](https://img.shields.io/badge/Anthropic_Claude-191919?style=flat&logo=anthropic&logoColor=white)](https://anthropic.com) **Anthropic Claude** | Optional LLM alternative |
| [![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=flat&logo=langchain&logoColor=white)](https://langchain.com) **LangChain + LangGraph** | ReAct agent orchestration & tool use |
| **ChromaDB** | Per-customer vector memory + per-business RAG |
| **Pinecone** | Production vector store for knowledge base |

### 🎙️ Voice & Speech

| Technology | Role |
|---|---|
| [![Deepgram](https://img.shields.io/badge/Deepgram_Nova--2-101010?style=flat&logo=deepgram&logoColor=white)](https://deepgram.com) **Deepgram Nova-2** | Primary speech-to-text (STT) with language detection |
| **OpenAI Whisper** | Fallback STT engine |
| [![ElevenLabs](https://img.shields.io/badge/ElevenLabs-000000?style=flat&logo=elevenlabs&logoColor=white)](https://elevenlabs.io) **ElevenLabs Multilingual v2** | Primary text-to-speech (TTS) |
| **OpenAI TTS** | Fallback TTS engine |

### 📞 Communication

| Technology | Role |
|---|---|
| [![Twilio](https://img.shields.io/badge/Twilio-F22F46?style=flat&logo=twilio&logoColor=white)](https://twilio.com) **Twilio Voice** | Inbound/outbound phone calls, TwiML, IVR |
| [![Twilio](https://img.shields.io/badge/Twilio_SMS-F22F46?style=flat&logo=twilio&logoColor=white)](https://twilio.com) **Twilio SMS** | Programmable SMS channel |
| [![WhatsApp](https://img.shields.io/badge/WhatsApp_Business_API-25D366?style=flat&logo=whatsapp&logoColor=white)](https://business.whatsapp.com) **Meta WhatsApp** | Production WhatsApp + interactive buttons |
| **Twilio WhatsApp Sandbox** | Development/testing WhatsApp |

---

## 🗺️ Architecture

### System Overview

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         VOXA AI VOICE PLATFORM                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    ║
║  │   INBOUND   │   │  WHATSAPP   │   │     SMS     │   │  OUTBOUND   │    ║
║  │    CALL     │   │   MESSAGE   │   │   MESSAGE   │   │    CALL     │    ║
║  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘    ║
║         │                 │                  │                  │            ║
║         ▼                 ▼                  ▼                  ▼            ║
║  ┌─────────────────────────────────────────────────────────────────────┐   ║
║  │                    FastAPI  (async, multi-tenant)                    │   ║
║  │              POST /webhooks/twilio/* · /whatsapp/* · /sms/*         │   ║
║  └───────────────────────────┬─────────────────────────────────────────┘   ║
║                              │                                              ║
║              ┌───────────────▼───────────────┐                             ║
║              │         VOICE PIPELINE         │                             ║
║              │                                │                             ║
║              │  ┌───────┐  ┌────────────┐    │                             ║
║              │  │Deepgram│  │  LangGraph  │    │                             ║
║              │  │  STT  │─►│  ReAct AI  │    │                             ║
║              │  └───────┘  │   Agent    │    │                             ║
║              │             └─────┬──────┘    │                             ║
║              │    ┌──────────────┤            │                             ║
║              │    │   AI Tools   │            │                             ║
║              │    │ • book_appt  │            │                             ║
║              │    │ • check_slot │            │                             ║
║              │    │ • lookup_cust│            │                             ║
║              │    │ • send_wa    │            │                             ║
║              │    │ • escalate   │            │                             ║
║              │    └──────────────┘            │                             ║
║              │             ┌──────────┐       │                             ║
║              │             │ElevenLabs│       │                             ║
║              │             │   TTS    │       │                             ║
║              │             └──────────┘       │                             ║
║              └───────────────────────────────┘                             ║
║                                                                              ║
║  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               ║
║  │   PostgreSQL   │  │    ChromaDB    │  │     Redis      │               ║
║  │                │  │                │  │                │               ║
║  │ • businesses   │  │ • RAG per biz  │  │ • Celery tasks │               ║
║  │ • customers    │  │ • memory/cust  │  │ • reminders    │               ║
║  │ • calls        │  │                │  │ • callbacks    │               ║
║  │ • appointments │  └────────────────┘  └────────────────┘               ║
║  │ • tickets      │                                                         ║
║  │ • api_keys     │  ┌────────────────────────────────────────┐            ║
║  │ • webhooks     │  │       External CRM Forwarding          │            ║
║  └────────────────┘  │  HubSpot · Salesforce · Zoho · Custom │            ║
║                       │  HMAC-signed webhook events           │            ║
║                       └────────────────────────────────────────┘            ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### Voice Call Flow

```
Customer dials business number
        │
        ▼
   Twilio receives call
        │
        ▼
  POST /webhooks/twilio/inbound
        │
        ├─── IVR enabled? ──YES──► Play menu (Press 1: Appointment, Press 2: AI, Press 0: Human)
        │                               │
        │                     Digit received → route
        │
        ▼ (direct or after IVR)
  AI Greeting plays (ElevenLabs TTS)
        │
        ▼
  Twilio Gather → Customer speaks
        │
        ▼
  POST /webhooks/twilio/speech
        │
        ├──► Deepgram STT → detect language (en/fr/sw/rw)
        │
        ├──► Keyword emotion detection (neutral/happy/frustrated/angry/confused)
        │
        ├──► ChromaDB: load customer memory + business RAG context
        │
        ├──► LangGraph ReAct Agent reasons → calls tools
        │         • book_appointment  → PostgreSQL + WhatsApp confirmation
        │         • check_availability → calendar check
        │         • lookup_customer   → CRM history
        │         • send_whatsapp     → Meta API / Twilio
        │         • escalate_to_human → Twilio Dial transfer
        │
        ├──► ElevenLabs TTS → audio response
        │
        ├──► Loop back to Gather
        │
        ▼
  Call ends → POST /webhooks/twilio/status
        │
        ├──► GPT-4o mini generates 2-3 sentence call summary
        ├──► CRM update (last_contact, call_history)
        ├──► Customer memory saved to ChromaDB
        └──► CRM webhook events fired to external endpoints
```

---

## 🌍 Supported Languages

| Code | Language | STT | TTS | WhatsApp | SMS | IVR Menu | Emotion |
|------|----------|:---:|:---:|:--------:|:---:|:--------:|:-------:|
| `en` | 🇬🇧 English | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `fr` | 🇫🇷 French | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `sw` | 🇰🇪 Swahili | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `rw` | 🇷🇼 Kinyarwanda | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

Language is **auto-detected** on every call via Deepgram and confirmed by `langdetect`.
The AI responds in the same language the customer speaks.

---

## ✨ Features

### 🎙️ AI Phone Receptionist
- Answers every call 24/7 with a personalized AI voice
- Custom greeting messages per business
- Optional IVR menu (digit routing) before AI engagement
- Smooth hand-off to human agents when needed

### 🤖 Intelligent AI Agent
- LangGraph ReAct agent with 5 built-in tools
- Per-business RAG knowledge base (FAQ, pricing, services, hours)
- Per-customer conversation memory across multiple calls
- Auto-generated call summaries (GPT-4o mini)

### 😤 Emotion Detection & Escalation
- Real-time keyword-based emotion scoring in all 4 languages
- Automatic escalation when customer is angry + threshold reached
- Manual escalation via AI tool (`escalate_to_human`)
- Configurable escalation phone number per business

### 📅 Appointment Booking
- Create, reschedule, cancel via voice, WhatsApp, or SMS
- Real-time slot availability respecting business hours & timezone
- Conflict detection + duration management
- WhatsApp button confirmations (Confirm / Reschedule / Cancel)
- 24-hour SMS + WhatsApp reminders via Celery

### 💬 Multi-Channel Messaging
- **WhatsApp**: Text messages + interactive quick-reply buttons (Meta Cloud API)
- **SMS**: Full AI agent over Twilio SMS
- **Voice**: Deepgram STT + ElevenLabs TTS pipeline

### 🗂️ Support Tickets
- Auto-created when AI detects a complaint during a call
- Full status workflow: `open` → `in_progress` → `resolved` → `closed`
- Priority levels: `low` / `medium` / `high` / `urgent`
- Linked to the originating call record

### 🔌 CRM Event Forwarding
- Register external webhook endpoints per business
- Events: `call.completed`, `call.escalated`, `appointment.booked`, `ticket.created`, and more
- HMAC-SHA256 signed payloads (`X-Voxa-Signature` header)

### 📊 Analytics & Reporting
- Dashboard: call volume, outcomes, escalation rate, emotion breakdown
- Language distribution across all calls
- Appointment conversion rates
- Day-by-day call volume graph
- **CSV export** for calls and appointments

### 🔒 Security & Multi-tenancy
- API key authentication (`X-API-Key` header)
- SHA-256 hashed key storage — raw key shown only once
- Key expiry and scope support
- Rate limiting: 100 requests/minute per IP (slowapi)

### 🏥 Dependency Health Checks
- `GET /api/v1/health/detailed` checks all 7 external services
- PostgreSQL · Redis · ChromaDB · OpenAI · Deepgram · ElevenLabs · Twilio

---

## 📡 API Reference

All routes are prefixed with `/api/v1`. Interactive docs at **`/docs`** (Swagger UI) and **`/redoc`**.

### 🔑 Auth
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/businesses/{id}/keys` | Create API key (raw key shown once) |
| `GET` | `/auth/businesses/{id}/keys` | List API keys |
| `DELETE` | `/auth/businesses/{id}/keys/{key_id}` | Revoke API key |

### 🏢 Businesses
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/businesses/` | Register a new business |
| `GET` | `/businesses/` | List all active businesses |
| `GET` | `/businesses/{id}` | Get business details |
| `PATCH` | `/businesses/{id}` | Update business settings |
| `POST` | `/businesses/{id}/knowledge` | Index a knowledge document |
| `GET` | `/businesses/{id}/knowledge` | List indexed documents |

### 👥 Customers
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/customers/` | Create a customer |
| `GET` | `/customers/{id}` | Get customer profile |
| `PATCH` | `/customers/{id}` | Update customer |
| `GET` | `/customers/{id}/timeline` | Full call + ticket history |

### 📅 Appointments
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/appointments/` | Create an appointment |
| `GET` | `/appointments/business/{id}` | List appointments |
| `GET` | `/appointments/availability/{id}?date=YYYY-MM-DD` | Get available slots |
| `PATCH` | `/appointments/{id}` | Update / reschedule |
| `DELETE` | `/appointments/{id}` | Cancel appointment |

### 🎫 Tickets
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/tickets/?business_id={id}` | Create support ticket |
| `GET` | `/tickets/businesses/{id}` | List business tickets (filter by status) |
| `GET` | `/tickets/{id}` | Get ticket details |
| `PATCH` | `/tickets/{id}` | Update status, priority, resolution |
| `GET` | `/tickets/customers/{id}` | List customer's tickets |

### 📞 Calls
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/calls/business/{id}` | Call history (paginated) |
| `GET` | `/calls/{id}` | Full call details + AI summary |
| `GET` | `/calls/{id}/transcript` | Transcript with emotion labels |

### 💬 WhatsApp
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/whatsapp/webhook` | Meta webhook verification |
| `POST` | `/whatsapp/webhook` | Receive incoming messages |
| `POST` | `/whatsapp/chat` | Direct chat API for testing |

### 📱 SMS
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/sms/webhook` | Twilio inbound SMS (AI-powered) |
| `POST` | `/sms/send` | Send SMS directly |

### 📊 Analytics
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/analytics/{id}/dashboard` | Full dashboard metrics |
| `GET` | `/analytics/{id}/calls/daily` | Day-by-day call volume |
| `GET` | `/analytics/{id}/export/calls` | Download calls CSV |
| `GET` | `/analytics/{id}/export/appointments` | Download appointments CSV |

### 📤 Outbound
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/outbound/call` | Place an outbound call |
| `POST` | `/outbound/callback` | Schedule a future callback |
| `GET` | `/outbound/callbacks/{id}` | List pending callbacks |

### 🔗 Webhook Configs (CRM Forwarding)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/webhook-configs/businesses/{id}` | Register CRM endpoint |
| `GET` | `/webhook-configs/businesses/{id}` | List registered endpoints |
| `PATCH` | `/webhook-configs/{id}` | Update endpoint |
| `DELETE` | `/webhook-configs/{id}` | Remove endpoint |

### 🛠️ Utilities
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/utils/knowledge/{id}/bulk` | Bulk-index knowledge docs |
| `POST` | `/utils/knowledge/{id}/upload-file` | Upload a `.txt` knowledge file |
| `DELETE` | `/utils/knowledge/{id}/{doc_id}` | Remove a knowledge document |
| `POST` | `/utils/detect-language` | Detect language of text |
| `POST` | `/utils/tts-preview` | Preview TTS audio (returns MP3) |

### 🔔 Health
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness probe |
| `GET` | `/api/v1/health/detailed` | Detailed dependency status (7 services) |

### 📟 Webhooks (Twilio — called by Twilio, not your app)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/webhooks/twilio/inbound` | New inbound call |
| `POST` | `/webhooks/twilio/speech` | Speech input from Gather |
| `POST` | `/webhooks/twilio/status` | Call status + summary generation |

---

## 🌐 CRM Webhook Events

Subscribe to events and receive HMAC-signed POST payloads:

```json
{
  "event": "call.completed",
  "timestamp": "2026-05-16T10:30:00Z",
  "data": {
    "call_id": "...",
    "business_id": "...",
    "customer_phone": "+250788000001",
    "duration_seconds": 142,
    "outcome": "appointment_booked",
    "language": "rw",
    "emotion": "happy",
    "summary": "Customer booked a general consultation for Friday 9am. No complaints.",
    "escalated": false
  }
}
```

**Signature verification** (`X-Voxa-Signature: sha256=<hmac>`):
```python
import hmac, hashlib
expected = hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
assert f"sha256={expected}" == request.headers["X-Voxa-Signature"]
```

Available events: `call.completed` · `call.escalated` · `call.missed` · `appointment.booked` · `appointment.cancelled` · `appointment.reminder` · `ticket.created` · `ticket.resolved` · `customer.created`

---

## ⚙️ Environment Variables

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|:--------:|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL async URL (`postgresql+asyncpg://...`) |
| `REDIS_URL` | ✅ | Redis URL (`redis://localhost:6379/0`) |
| `SECRET_KEY` | ✅ | App secret key for signing |
| `TWILIO_ACCOUNT_SID` | ✅ | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | ✅ | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | ✅ | Twilio voice number (E.164) |
| `TWILIO_WHATSAPP_NUMBER` | WA dev | Twilio WhatsApp sandbox number |
| `WHATSAPP_API_TOKEN` | WA prod | Meta WhatsApp Business API token |
| `WHATSAPP_PHONE_NUMBER_ID` | WA prod | Meta phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | WA prod | Webhook verification token |
| `OPENAI_API_KEY` | ✅ | OpenAI (LLM + TTS fallback + summarization) |
| `ANTHROPIC_API_KEY` | Optional | Use Claude instead of GPT |
| `LLM_PROVIDER` | Optional | `openai` (default) or `anthropic` |
| `LLM_MODEL` | Optional | e.g. `gpt-4o` or `claude-3-5-sonnet-20241022` |
| `DEEPGRAM_API_KEY` | ✅ | Deepgram speech-to-text |
| `STT_PROVIDER` | Optional | `deepgram` (default) or `whisper` |
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs TTS (falls back to OpenAI TTS) |
| `ELEVENLABS_VOICE_ID_EN` | Optional | ElevenLabs voice ID for English |
| `ELEVENLABS_VOICE_ID_FR` | Optional | ElevenLabs voice ID for French |
| `ELEVENLABS_VOICE_ID_SW` | Optional | ElevenLabs voice ID for Swahili |
| `ELEVENLABS_VOICE_ID_RW` | Optional | ElevenLabs voice ID for Kinyarwanda |
| `CHROMA_HOST` | ✅ | ChromaDB host (default: `localhost`) |
| `CHROMA_PORT` | ✅ | ChromaDB port (default: `8001`) |
| `PINECONE_API_KEY` | Prod | Pinecone production vector store |
| `PINECONE_INDEX` | Prod | Pinecone index name |
| `APP_ENV` | Optional | `development` / `staging` / `production` |

---

## 🚀 Quick Start

### Option A — Docker Compose (recommended)

```bash
# 1. Clone & configure
git clone <repo> && cd Voxa
cp .env.example .env
# Fill in your API keys in .env

# 2. Start everything
docker-compose up --build

# Services:
# API + Swagger: http://localhost:8000/docs
# PostgreSQL:    localhost:5432
# Redis:         localhost:6379
# ChromaDB:      localhost:8001
```

### Option B — Local Development

```bash
# 1. Clone & virtualenv
git clone <repo> && cd Voxa
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 2. Configure
cp .env.example .env
# Edit .env with your keys

# 3. Start dependencies only
docker-compose up -d db redis chroma

# 4. Migrate database
alembic revision --autogenerate -m "initial"
alembic upgrade head

# 5. Start API
uvicorn app.main:app --reload --port 8000

# 6. Start Celery worker (in separate terminal)
celery -A app.worker worker --loglevel=info --beat
```

### Expose to Twilio (local dev)

```bash
# Install ngrok then:
ngrok http 8000
```

Configure Twilio Console → Phone Numbers → your number:
- **Voice webhook URL**: `https://<id>.ngrok.io/api/v1/webhooks/twilio/inbound`
- **SMS webhook URL**: `https://<id>.ngrok.io/api/v1/sms/webhook`
- **Method**: `HTTP POST`

### After First Run — Create Your First Business

```bash
# 1. Create a clinic
curl -X POST http://localhost:8000/api/v1/businesses/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kigali Clinic",
    "category": "clinic",
    "phone_number": "+250788000001",
    "preferred_language": "rw",
    "supported_languages": ["rw", "en", "fr"],
    "greeting_message": "Murakaza neza kuri Kigali Clinic! Nigute twabafasha?",
    "escalation_phone": "+250788000002",
    "timezone": "Africa/Kigali",
    "hours": [
      {"day_of_week": 0, "open_time": "08:00:00", "close_time": "18:00:00"},
      {"day_of_week": 1, "open_time": "08:00:00", "close_time": "18:00:00"},
      {"day_of_week": 2, "open_time": "08:00:00", "close_time": "18:00:00"},
      {"day_of_week": 3, "open_time": "08:00:00", "close_time": "18:00:00"},
      {"day_of_week": 4, "open_time": "08:00:00", "close_time": "18:00:00"},
      {"day_of_week": 5, "open_time": "08:00:00", "close_time": "13:00:00"}
    ]
  }'

# 2. Generate an API key (save the raw_key — shown only once!)
curl -X POST http://localhost:8000/api/v1/auth/businesses/<id>/keys \
  -H "Content-Type: application/json" \
  -d '{"name": "Production Key"}'

# 3. Upload knowledge base
curl -X POST http://localhost:8000/api/v1/utils/knowledge/<id>/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {"doc_id": "services", "content": "General Consultation: 30min, 5000 RWF. Specialist: 60min, 15000 RWF."},
      {"doc_id": "hours",    "content": "Open Monday–Friday 8am–6pm, Saturday 8am–1pm, closed Sunday."},
      {"doc_id": "location", "content": "KG 7 Ave, Kigali. Free parking. Near Kigali Heights mall."}
    ]
  }'

# 4. Register a CRM webhook
curl -X POST http://localhost:8000/api/v1/webhook-configs/businesses/<id> \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My CRM",
    "url": "https://my-crm.example.com/voxa",
    "secret": "my-hmac-secret",
    "events": ["call.completed", "appointment.booked", "ticket.created"]
  }'

# 5. View analytics dashboard
curl "http://localhost:8000/api/v1/analytics/<id>/dashboard"

# 6. Export calls to CSV
curl "http://localhost:8000/api/v1/analytics/<id>/export/calls" -o calls.csv
```

---

## 🗂️ Project Structure

```
Voxa/
├── app/
│   ├── main.py                    # FastAPI app, rate limiting, Swagger, CORS
│   ├── config.py                  # pydantic-settings + .env loader
│   ├── database.py                # Async SQLAlchemy engine + session
│   ├── worker.py                  # Celery tasks (reminders, callbacks)
│   │
│   ├── models/                    # SQLAlchemy ORM (PostgreSQL)
│   │   ├── business.py            # Business + BusinessHours
│   │   ├── customer.py            # Customer + CustomerStatus
│   │   ├── appointment.py         # Appointment lifecycle
│   │   ├── call.py                # Call + CallTranscript + emotion enums
│   │   ├── conversation.py        # Conversation + Message (voice / WA / SMS)
│   │   ├── api_key.py             # API key model (SHA-256 hashed)
│   │   ├── ticket.py              # Support tickets (status workflow)
│   │   └── webhook_config.py      # CRM webhook subscriptions
│   │
│   ├── schemas/                   # Pydantic v2 I/O schemas
│   │   ├── business.py, customer.py, appointment.py
│   │   ├── call.py, conversation.py, analytics.py
│   │   ├── outbound.py, auth.py, ticket.py, webhook_config.py
│   │
│   ├── api/v1/
│   │   ├── router.py              # All routers registered here
│   │   ├── auth.py                # API key management
│   │   ├── businesses.py          # Business CRUD + knowledge
│   │   ├── customers.py           # Customer CRUD + timeline
│   │   ├── appointments.py        # Booking lifecycle
│   │   ├── tickets.py             # Support ticket management
│   │   ├── calls.py               # Call history + transcripts
│   │   ├── whatsapp.py            # WA webhook + direct chat
│   │   ├── sms.py                 # SMS webhook + direct send
│   │   ├── webhooks.py            # Twilio voice (inbound/speech/status/ivr)
│   │   ├── analytics.py           # Dashboard + CSV exports
│   │   ├── outbound.py            # Outbound calls + callbacks
│   │   ├── webhook_configs.py     # CRM event forwarding config
│   │   ├── health.py              # Detailed dependency health checks
│   │   └── utilities.py           # Knowledge, lang detect, TTS preview
│   │
│   ├── services/
│   │   ├── voice/
│   │   │   ├── stt.py             # Deepgram (primary) + Whisper (fallback)
│   │   │   ├── tts.py             # ElevenLabs (primary) + OpenAI (fallback)
│   │   │   ├── pipeline.py        # Full turn: audio → STT → AI → TTS
│   │   │   └── ivr.py             # IVR menu builder (multilingual)
│   │   ├── ai/
│   │   │   ├── agent.py           # LangGraph ReAct agent (GPT-4o / Claude)
│   │   │   ├── tools.py           # 5 LangChain tools
│   │   │   ├── memory.py          # Per-customer ChromaDB vector memory
│   │   │   ├── rag.py             # Per-business RAG knowledge base
│   │   │   └── emotion.py         # Multilingual keyword emotion detection
│   │   ├── communication/
│   │   │   ├── twilio_service.py  # TwiML, call init, IVR, escalation
│   │   │   ├── whatsapp.py        # Meta API + Twilio WA + interactive buttons
│   │   │   └── sms.py             # Twilio Programmable SMS
│   │   ├── booking/
│   │   │   └── booking_service.py # Appointment lifecycle + availability
│   │   └── crm/
│   │       ├── crm_service.py     # Post-call CRM updates + timeline
│   │       └── webhook_forwarder.py # HMAC-signed event dispatch
│   │
│   └── core/
│       ├── auth.py                # API key hashing + get_current_business()
│       ├── exceptions.py          # VoxaException + handler
│       └── logging.py             # structlog JSON logging
│
├── alembic/                       # Async DB migrations
│   └── env.py
├── docker-compose.yml             # Postgres + Redis + ChromaDB + API + Worker
├── Dockerfile
├── requirements.txt               # 62 Python packages
└── .env.example                   # Environment template
```

---

## 🏥 Target Use Cases

| Sector | Voxa Use Case |
|--------|--------------|
| 🏥 **Clinics** | Book GP & specialist appointments, answer FAQs, send medication reminders |
| 💇 **Salons** | Take bookings, manage slots, upsell treatments, send day-before reminders |
| 🏨 **Hotels** | Room reservations, check-in info, local recommendations in guest language |
| 🚚 **Logistics** | Delivery status updates, route coordination, driver dispatch |
| 🏦 **SACCOs** | Loan info, account balance, repayment schedules via voice & WhatsApp |
| 🌾 **Agriculture** | Market prices, weather alerts, cooperative meeting reminders for farmers |
| 🍽️ **Restaurants** | Table reservations, menu info, takeaway order tracking |

---

## 🗄️ Database Migration

After adding new features, generate and run migrations:

```bash
# Generate migration for new tables (api_keys, tickets, webhook_configs)
alembic revision --autogenerate -m "add_api_keys_tickets_webhook_configs"

# Apply migration
alembic upgrade head

# Rollback if needed
alembic downgrade -1
```

---

## 📜 License

MIT © 2026 MANZI NIYONGIRA Osee — [SIC Rwanda](mailto:info@sicrwanda.com)

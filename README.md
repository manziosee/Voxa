# Voxa — AI Voice Agent for African Businesses

> 24/7 multilingual AI phone receptionist: answers calls, books appointments, speaks local languages, integrates with WhatsApp.

---

## Why Voxa?

| Problem | Voxa Solution |
|---|---|
| Businesses miss calls after hours | 24/7 AI answers every call |
| Can't afford a full-time receptionist | AI costs a fraction of a salary |
| Customers speak Kinyarwanda, Swahili, French | Native multilingual support |
| Appointments are lost in phone calls | Automatic booking + WhatsApp confirmation |
| No record of customer history | AI memory per customer, CRM integration |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           VOXA BACKEND                                  │
│                                                                         │
│  Twilio ──► POST /webhooks/twilio/inbound                               │
│               │                                                         │
│               ▼                                                         │
│        ┌─────────────┐    ┌──────────────┐    ┌───────────────────┐    │
│        │  Deepgram   │    │  LangGraph   │    │   ElevenLabs      │    │
│        │  STT        │───►│  AI Agent    │───►│   TTS             │    │
│        └─────────────┘    └──────┬───────┘    └───────────────────┘    │
│                                  │                                       │
│                    ┌─────────────┴──────────────┐                       │
│                    │         AI Tools            │                       │
│                    │  • book_appointment         │                       │
│                    │  • check_availability       │                       │
│                    │  • lookup_customer          │                       │
│                    │  • send_whatsapp_message    │                       │
│                    │  • escalate_to_human        │                       │
│                    └────────────────────────────┘                       │
│                                                                         │
│  WhatsApp ──► POST /whatsapp/webhook                                    │
│  Direct Chat ──► POST /whatsapp/chat                                    │
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  PostgreSQL  │  │  ChromaDB    │  │    Redis     │                  │
│  │  (records)   │  │  (RAG +      │  │  (Celery     │                  │
│  │              │  │   Memory)    │  │   broker)    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### Voice Call Flow
```
1. Customer calls business number
2. Twilio receives call → POST /webhooks/twilio/inbound
3. Voxa creates Call + Conversation record in PostgreSQL
4. Twilio plays AI greeting (TwiML)
5. Customer speaks → Twilio Gather → POST /webhooks/twilio/speech
6. Deepgram STT transcribes audio
7. Language detected (en/fr/sw/rw)
8. Emotion detected (neutral/happy/frustrated/angry)
9. LangGraph agent reasons + calls tools (book appointment, check slots, etc.)
10. ElevenLabs TTS converts reply to voice
11. TwiML plays audio → loop to step 5
12. If emotion = angry AND turns ≥ threshold → transfer to human (Twilio Dial)
13. Call ends → POST /webhooks/twilio/status → CRM update + memory saved
```

---

## Supported Languages

| Code | Language | STT | TTS | WhatsApp Templates | Emotion Keywords |
|------|----------|-----|-----|--------------------|-----------------|
| `en` | English | ✅ | ✅ | ✅ | ✅ |
| `fr` | French | ✅ | ✅ | ✅ | ✅ |
| `sw` | Swahili | ✅ | ✅ | ✅ | ✅ |
| `rw` | Kinyarwanda | ✅ | ✅ | ✅ | ✅ |

---

## API Overview

All routes are prefixed with `/api/v1`. Interactive docs at **`/docs`** (Swagger UI) and **`/redoc`**.

### Businesses
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/businesses/` | Register a new business |
| `GET` | `/businesses/` | List all active businesses |
| `GET` | `/businesses/{id}` | Get business details |
| `PATCH` | `/businesses/{id}` | Update business settings |
| `POST` | `/businesses/{id}/knowledge` | Index a knowledge document |
| `GET` | `/businesses/{id}/knowledge` | List indexed documents |

### Customers
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/customers/` | Create a customer |
| `GET` | `/customers/{id}` | Get customer profile |
| `PATCH` | `/customers/{id}` | Update customer |
| `GET` | `/customers/{id}/timeline` | Full call + ticket history |
| `POST` | `/customers/{id}/tickets` | Log a complaint/ticket |

### Appointments
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/appointments/` | Create an appointment |
| `GET` | `/appointments/business/{id}` | List appointments |
| `GET` | `/appointments/availability/{id}?date=YYYY-MM-DD` | Get available slots |
| `PATCH` | `/appointments/{id}` | Update / reschedule |
| `DELETE` | `/appointments/{id}` | Cancel appointment |

### Calls
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/calls/business/{id}` | Call history (paginated) |
| `GET` | `/calls/{id}` | Full call details |
| `GET` | `/calls/{id}/transcript` | Full transcript with emotions |

### WhatsApp
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/whatsapp/webhook` | Meta webhook verification |
| `POST` | `/whatsapp/webhook` | Receive incoming messages |
| `POST` | `/whatsapp/chat` | Direct chat API for testing |

### Analytics
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/analytics/{id}/dashboard` | Full dashboard metrics |
| `GET` | `/analytics/{id}/calls/daily` | Day-by-day call volume |

### Outbound
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/outbound/call` | Place an outbound call |
| `POST` | `/outbound/callback` | Schedule a future callback |
| `GET` | `/outbound/callbacks/{id}` | List pending callbacks |

### Utilities
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/utils/knowledge/{id}/bulk` | Bulk-index knowledge docs |
| `POST` | `/utils/knowledge/{id}/upload-file` | Upload a .txt knowledge file |
| `DELETE` | `/utils/knowledge/{id}/{doc_id}` | Remove a knowledge document |
| `POST` | `/utils/detect-language` | Detect language of text |
| `POST` | `/utils/tts-preview` | Preview TTS audio (returns MP3) |

### Webhooks (Twilio — called by Twilio, not your app)
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/webhooks/twilio/inbound` | New inbound call |
| `POST` | `/webhooks/twilio/speech` | Speech input from Gather |
| `POST` | `/webhooks/twilio/status` | Call status updates |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL async connection string |
| `REDIS_URL` | ✅ | Redis connection for Celery |
| `TWILIO_ACCOUNT_SID` | ✅ | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | ✅ | Twilio auth token |
| `TWILIO_PHONE_NUMBER` | ✅ | Twilio voice number (E.164) |
| `TWILIO_WHATSAPP_NUMBER` | For WA dev | Twilio WhatsApp sandbox number |
| `WHATSAPP_API_TOKEN` | For WA prod | Meta WhatsApp Business API token |
| `WHATSAPP_PHONE_NUMBER_ID` | For WA prod | Meta phone number ID |
| `WHATSAPP_VERIFY_TOKEN` | For WA prod | Webhook verification token |
| `OPENAI_API_KEY` | ✅ | For LLM + TTS fallback |
| `ANTHROPIC_API_KEY` | Optional | Use Claude instead of GPT |
| `LLM_PROVIDER` | Optional | `openai` (default) or `anthropic` |
| `DEEPGRAM_API_KEY` | ✅ | Speech-to-text |
| `ELEVENLABS_API_KEY` | Optional | TTS (falls back to OpenAI TTS) |
| `ELEVENLABS_VOICE_ID_EN` | Optional | ElevenLabs voice for English |
| `ELEVENLABS_VOICE_ID_RW` | Optional | ElevenLabs voice for Kinyarwanda |
| `CHROMA_HOST` | ✅ | ChromaDB host |
| `CHROMA_PORT` | ✅ | ChromaDB port |

---

## Quick Start

### Local development (without Docker)

```bash
# 1. Clone and set up virtualenv
git clone <repo>
cd Voxa
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start dependencies
docker-compose up -d db redis chroma

# 4. Run migrations
alembic revision --autogenerate -m "initial"
alembic upgrade head

# 5. Start API
uvicorn app.main:app --reload --port 8000
```

### Docker Compose (full stack)

```bash
cp .env.example .env
# Edit .env with your API keys

docker-compose up --build
```

Services started:
- **API**: http://localhost:8000 · Swagger: http://localhost:8000/docs
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **ChromaDB**: localhost:8001

### Expose to Twilio (local dev)

Twilio needs a public URL to send webhooks. Use `ngrok`:

```bash
ngrok http 8000
```

Then configure Twilio:
1. Go to Twilio Console → Phone Numbers → your number
2. Set **Voice webhook** to: `https://<ngrok-id>.ngrok.io/api/v1/webhooks/twilio/inbound`
3. Method: `HTTP POST`

---

## Business Setup Example

```bash
# 1. Register a clinic
curl -X POST http://localhost:8000/api/v1/businesses/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Kigali Clinic",
    "category": "clinic",
    "phone_number": "+250788000001",
    "preferred_language": "rw",
    "supported_languages": ["rw", "en", "fr"],
    "greeting_message": "Murakaza neza! Mwakire kuri Kigali Clinic. Nigute twabafasha?",
    "escalation_phone": "+250788000002",
    "hours": [
      {"day_of_week": 0, "open_time": "08:00:00", "close_time": "18:00:00"},
      {"day_of_week": 1, "open_time": "08:00:00", "close_time": "18:00:00"},
      {"day_of_week": 5, "open_time": "08:00:00", "close_time": "13:00:00"}
    ]
  }'

# 2. Upload knowledge base
curl -X POST http://localhost:8000/api/v1/utils/knowledge/<business_id>/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {"doc_id": "hours", "content": "We are open Monday to Friday 8am-6pm, Saturday 8am-1pm.", "metadata": {"category": "hours"}},
      {"doc_id": "services", "content": "Services: General Consultation (30min, 5000 RWF), Specialist (60min, 15000 RWF).", "metadata": {"category": "services"}},
      {"doc_id": "location", "content": "Located on KG 7 Ave, Kigali. Free parking available.", "metadata": {"category": "location"}}
    ]
  }'

# 3. Check availability
curl "http://localhost:8000/api/v1/appointments/availability/<business_id>?date=2026-05-20"

# 4. View dashboard
curl "http://localhost:8000/api/v1/analytics/<business_id>/dashboard"
```

---

## Project Structure

```
Voxa/
├── app/
│   ├── main.py                  # FastAPI app, middleware, OpenAPI config
│   ├── config.py                # Settings (pydantic-settings + .env)
│   ├── database.py              # Async SQLAlchemy engine
│   ├── worker.py                # Celery tasks (reminders, callbacks)
│   │
│   ├── models/                  # SQLAlchemy ORM models
│   │   ├── business.py          # Business + BusinessHours
│   │   ├── customer.py          # Customer + status
│   │   ├── appointment.py       # Appointment lifecycle
│   │   ├── call.py              # Call + CallTranscript + emotion
│   │   └── conversation.py      # Conversation + Message (voice & WA)
│   │
│   ├── schemas/                 # Pydantic v2 I/O schemas with examples
│   │   ├── business.py
│   │   ├── customer.py
│   │   ├── appointment.py
│   │   ├── call.py
│   │   ├── conversation.py
│   │   ├── analytics.py
│   │   └── outbound.py
│   │
│   ├── api/v1/
│   │   ├── router.py            # All routers registered here
│   │   ├── businesses.py
│   │   ├── customers.py
│   │   ├── appointments.py
│   │   ├── calls.py
│   │   ├── whatsapp.py
│   │   ├── webhooks.py          # Twilio voice webhooks
│   │   ├── analytics.py         # Dashboard + daily volume
│   │   ├── outbound.py          # Outbound calls + callbacks
│   │   └── utilities.py         # Knowledge base + lang detect + TTS preview
│   │
│   ├── services/
│   │   ├── voice/
│   │   │   ├── stt.py           # Deepgram (primary) + Whisper (fallback)
│   │   │   ├── tts.py           # ElevenLabs (primary) + OpenAI (fallback)
│   │   │   └── pipeline.py      # Full turn: audio → STT → AI → TTS
│   │   ├── ai/
│   │   │   ├── agent.py         # LangGraph ReAct agent
│   │   │   ├── tools.py         # 5 LangChain tools
│   │   │   ├── memory.py        # Per-customer ChromaDB memory
│   │   │   ├── rag.py           # Per-business knowledge base
│   │   │   └── emotion.py       # Keyword-based emotion detection
│   │   ├── communication/
│   │   │   ├── twilio_service.py
│   │   │   └── whatsapp.py      # Meta API + Twilio WA
│   │   ├── booking/
│   │   │   └── booking_service.py
│   │   └── crm/
│   │       └── crm_service.py
│   │
│   └── core/
│       ├── exceptions.py
│       └── logging.py           # structlog JSON logging
│
├── alembic/                     # Async database migrations
├── docker-compose.yml           # Postgres + Redis + ChromaDB + API + Worker
├── Dockerfile
├── requirements.txt
└── .env.example
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web framework | FastAPI + Uvicorn |
| Database | PostgreSQL 16 + asyncpg + SQLAlchemy 2 |
| Migrations | Alembic (async) |
| Cache / Queue | Redis + Celery |
| Vector store | ChromaDB (local) / Pinecone (production) |
| AI / LLM | LangChain + LangGraph + OpenAI GPT-4o / Claude |
| Speech-to-text | Deepgram Nova-2 (primary) + OpenAI Whisper (fallback) |
| Text-to-speech | ElevenLabs Multilingual v2 (primary) + OpenAI TTS (fallback) |
| Telephony | Twilio Programmable Voice |
| Messaging | WhatsApp Business API (Meta) + Twilio WhatsApp |
| Containerization | Docker + Docker Compose |

---

## Target Use Cases

| Sector | Use Case |
|--------|----------|
| **Clinics** | Book appointments, answer FAQs, send reminders |
| **Salons** | Take bookings, confirm slots, upsell services |
| **Hotels** | Room reservations, check-in info, local recommendations |
| **Logistics** | Delivery status, route coordination, driver dispatch |
| **SACCOs** | Loan information, account balance, repayment schedules |
| **Agriculture** | Market prices, weather alerts, input supply info |

---

## License

MIT © 2026 MANZI NIYONGIRA Osee

"""
Twilio voice webhooks — the core of the AI phone receptionist.

Flow:
  POST /webhooks/twilio/inbound  → Twilio calls this when a call arrives
  POST /webhooks/twilio/speech   → Twilio sends speech input after each Gather
  POST /webhooks/twilio/status   → Twilio sends call status updates
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Form, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps import get_db
from app.models.business import Business
from app.models.customer import Customer
from app.models.call import Call, CallStatus, CallTranscript
from app.models.conversation import Conversation, ConversationChannel, Message, MessageRole
from app.services.voice.pipeline import VoicePipeline
from app.services.communication.twilio_service import TwilioService
from app.services.crm.crm_service import CRMService
from app.services.crm.webhook_forwarder import WebhookForwarder
from app.models.webhook_config import WebhookEvent
from app.services.voice.ivr import get_default_menu, build_ivr_twiml
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/webhooks/twilio", tags=["Webhooks"])


def _base_url(request: Request) -> str:
    return str(request.base_url).rstrip("/")


@router.post("/inbound")
async def inbound_call(
    request: Request,
    CallSid: str = Form(...),
    From: str = Form(...),
    To: str = Form(...),
    db: AsyncSession = Depends(get_db),
):
    """Twilio calls this endpoint when a new inbound call arrives."""
    # Find business by Twilio number
    biz_result = await db.execute(select(Business).where(Business.phone_number == To))
    business = biz_result.scalar_one_or_none()

    if not business:
        twilio = TwilioService()
        return Response(
            content='<Response><Say>Sorry, this number is not configured. Goodbye.</Say><Hangup/></Response>',
            media_type="application/xml",
        )

    # Get or create customer
    cust_result = await db.execute(
        select(Customer).where(and_(Customer.business_id == business.id, Customer.phone_number == From))
    )
    customer = cust_result.scalar_one_or_none()
    if not customer:
        customer = Customer(business_id=business.id, phone_number=From)
        db.add(customer)
        await db.flush()

    # Create call record
    call = Call(
        business_id=business.id,
        customer_id=customer.id,
        twilio_call_sid=CallSid,
        caller_number=From,
        status=CallStatus.in_progress,
    )
    db.add(call)

    # Create conversation record
    conversation = Conversation(
        business_id=business.id,
        customer_id=customer.id,
        call_id=call.id,
        channel=ConversationChannel.voice,
        language=business.preferred_language,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(call)
    await db.refresh(conversation)

    base = _base_url(request)

    # If business has IVR enabled (extra config flag), show menu first
    use_ivr = (business.extra or {}).get("ivr_enabled", False)
    if use_ivr:
        menu = get_default_menu(business.name, business.preferred_language)
        twiml = build_ivr_twiml(menu, base_url=base, call_id=str(call.id))
        return Response(content=twiml, media_type="application/xml")

    # Direct AI greeting
    twilio = TwilioService()
    greeting = business.greeting_message or f"Hello, welcome to {business.name}. How can I help you today?"
    twiml = twilio.build_greeting_twiml(
        call_id=call.id,
        business_name=business.name,
        greeting_message=greeting,
        language=business.preferred_language,
        base_url=base,
    )
    return Response(content=twiml, media_type="application/xml")


@router.post("/speech")
async def speech_input(
    request: Request,
    call_id: uuid.UUID,
    SpeechResult: str = Form(default=""),
    Confidence: float = Form(default=1.0),
    db: AsyncSession = Depends(get_db),
):
    """Twilio sends the speech-to-text result here after each Gather."""
    call = await db.get(Call, call_id)
    if not call:
        return Response(content="<Response><Hangup/></Response>", media_type="application/xml")

    business = await db.get(Business, call.business_id)
    customer = await db.get(Customer, call.customer_id) if call.customer_id else None

    # Get conversation for turn count
    conv_result = await db.execute(
        select(Conversation).where(
            and_(Conversation.call_id == call_id, Conversation.channel == ConversationChannel.voice)
        )
    )
    conversation = conv_result.scalar_one_or_none()
    turn_count = len(conversation.messages) // 2 if conversation else 0

    # Save customer transcript entry
    db.add(CallTranscript(call_id=call_id, speaker="customer", text=SpeechResult, confidence=Confidence))
    if conversation:
        db.add(Message(conversation_id=conversation.id, role=MessageRole.user, content=SpeechResult))

    # Run AI agent
    from app.services.ai.agent import VoxaAgent
    from app.services.ai.emotion import detect_emotion

    language = conversation.language if conversation else business.preferred_language
    agent = VoxaAgent(business_id=call.business_id, conversation_id=conversation.id if conversation else uuid.uuid4())
    agent_result = await agent.respond(
        user_message=SpeechResult,
        language=language,
        customer_id=call.customer_id,
        business_info={
            "name": business.name,
            "category": business.category.value,
            "greeting_message": business.greeting_message,
        },
        db=db,
    )

    emotion = detect_emotion(SpeechResult, language)
    call.emotion_detected = emotion
    call.language_detected = language

    # Save AI transcript entry
    db.add(CallTranscript(call_id=call_id, speaker="ai", text=agent_result.reply))
    if conversation:
        db.add(Message(conversation_id=conversation.id, role=MessageRole.assistant, content=agent_result.reply))

    twilio = TwilioService()

    # Escalate if needed
    if agent_result.escalate:
        call.status = CallStatus.escalated
        call.escalated = True
        call.escalation_reason = agent_result.escalation_reason
        await db.commit()

        if business.escalation_phone:
            twiml = twilio.build_escalation_twiml(
                escalation_phone=business.escalation_phone,
                hold_message="Please hold while I connect you with our team.",
            )
        else:
            twiml = twilio.build_response_twiml(
                call_id=call_id,
                ai_reply="I'm sorry, no agent is available right now. We'll call you back shortly.",
                language=language,
                is_final=True,
            )
        await db.commit()
        return Response(content=twiml, media_type="application/xml")

    await db.commit()
    twiml = twilio.build_response_twiml(
        call_id=call_id,
        ai_reply=agent_result.reply,
        language=language,
        base_url=_base_url(request),
        is_final=False,
    )
    return Response(content=twiml, media_type="application/xml")


@router.post("/status")
async def call_status_callback(
    CallSid: str = Form(...),
    CallStatus: str = Form(...),
    CallDuration: str = Form(default="0"),
    RecordingUrl: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
):
    """Twilio sends call status updates here."""
    from app.models.call import CallStatus as CS
    result = await db.execute(select(Call).where(Call.twilio_call_sid == CallSid))
    call = result.scalar_one_or_none()
    if not call:
        return {"status": "ok"}

    status_map = {
        "completed": CS.completed,
        "failed": CS.failed,
        "busy": CS.missed,
        "no-answer": CS.missed,
    }
    if CallStatus in status_map:
        call.status = status_map[CallStatus]

    call.duration_seconds = int(CallDuration) if CallDuration else None
    call.ended_at = datetime.utcnow()
    if RecordingUrl:
        call.recording_url = RecordingUrl

    # Generate AI summary from transcript
    if CallStatus == "completed":
        from app.models.call import CallTranscript as CT
        transcript_result = await db.execute(
            select(CT).where(CT.call_id == call.id).order_by(CT.timestamp)
        )
        transcripts = transcript_result.scalars().all()
        if transcripts:
            lines = [f"{t.speaker.upper()}: {t.text}" for t in transcripts]
            call.summary = await _generate_call_summary(lines, call.language_detected or "en")

    await db.commit()

    # Post-call CRM update
    crm = CRMService(db)
    await crm.post_call_update(call)

    # Forward call.completed event to registered CRM webhooks
    forwarder = WebhookForwarder(db)
    await forwarder.dispatch(
        business_id=call.business_id,
        event=WebhookEvent.call_completed,
        payload={
            "call_id": str(call.id),
            "caller_number": call.caller_number,
            "duration_seconds": call.duration_seconds,
            "status": call.status.value,
            "outcome": call.outcome.value if call.outcome else None,
            "language": call.language_detected,
            "emotion": call.emotion_detected.value,
            "escalated": call.escalated,
            "summary": call.summary,
        },
    )

    return {"status": "ok"}


@router.post(
    "/ivr",
    summary="IVR digit handler",
    description="Twilio posts here after the caller presses a digit in the IVR menu.",
    include_in_schema=False,
)
async def ivr_digit_handler(
    request: Request,
    call_id: uuid.UUID,
    Digits: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
):
    call = await db.get(Call, call_id)
    if not call:
        return Response(content="<Response><Hangup/></Response>", media_type="application/xml")

    business = await db.get(Business, call.business_id)
    twilio = TwilioService()
    base = _base_url(request)

    if Digits == "0":
        # Escalate to human immediately
        if business and business.escalation_phone:
            twiml = twilio.build_escalation_twiml(
                escalation_phone=business.escalation_phone,
                hold_message="Connecting you to our team. Please hold.",
            )
        else:
            twiml = twilio.build_response_twiml(
                call_id=call_id,
                ai_reply="No human agent is available right now. Our AI will assist you.",
                language=business.preferred_language if business else "en",
                base_url=base,
                is_final=False,
            )
        return Response(content=twiml, media_type="application/xml")

    # All other digits → hand off to AI agent with context hint
    greeting = "Hello! How can I help you today?"
    if business:
        hint_map = {"1": "appointment booking", "2": "general inquiries", "3": "billing"}
        hint = hint_map.get(Digits, "")
        greeting = f"I'll help you with {hint}. " if hint else ""
        greeting += business.greeting_message or f"Welcome to {business.name}. How can I help?"

    twiml = twilio.build_greeting_twiml(
        call_id=call_id,
        business_name=business.name if business else "",
        greeting_message=greeting,
        language=business.preferred_language if business else "en",
        base_url=base,
    )
    return Response(content=twiml, media_type="application/xml")


async def _generate_call_summary(transcript_lines: list[str], language: str) -> str:
    """Use LLM to produce a 2-3 sentence call summary."""
    try:
        from langchain_openai import ChatOpenAI
        from app.config import get_settings
        cfg = get_settings()
        llm = ChatOpenAI(model="gpt-4o-mini", api_key=cfg.openai_api_key, temperature=0)
        transcript = "\n".join(transcript_lines[-40:])  # last 40 turns max
        prompt = (
            f"Summarize this AI receptionist call in 2-3 sentences. "
            f"Focus on the customer's intent, what was resolved, and any follow-up needed. "
            f"Write in English regardless of call language.\n\nTranscript:\n{transcript}"
        )
        response = await llm.ainvoke(prompt)
        return response.content.strip()
    except Exception:
        return ""

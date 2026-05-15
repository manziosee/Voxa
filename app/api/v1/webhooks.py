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

    # Build greeting TwiML
    twilio = TwilioService()
    greeting = business.greeting_message or f"Hello, welcome to {business.name}. How can I help you today?"
    twiml = twilio.build_greeting_twiml(
        call_id=call.id,
        business_name=business.name,
        greeting_message=greeting,
        language=business.preferred_language,
        base_url=_base_url(request),
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
    result = await db.execute(select(Call).where(Call.twilio_call_sid == CallSid))
    call = result.scalar_one_or_none()
    if not call:
        return {"status": "ok"}

    status_map = {
        "completed": CallStatus.completed,
        "failed": CallStatus.failed,
        "busy": CallStatus.missed,
        "no-answer": CallStatus.missed,
    }
    if CallStatus in status_map:
        call.status = status_map[CallStatus]

    call.duration_seconds = int(CallDuration) if CallDuration else None
    call.ended_at = datetime.utcnow()
    if RecordingUrl:
        call.recording_url = RecordingUrl

    await db.commit()

    # Post-call CRM update
    crm = CRMService(db)
    await crm.post_call_update(call)

    return {"status": "ok"}

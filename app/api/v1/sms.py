"""
SMS channel endpoints.

Handles inbound SMS from Twilio and exposes a direct-send API for testing.
Inbound messages are processed by the same AI agent as WhatsApp/voice.
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, Form, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps import get_db
from app.models.business import Business
from app.models.customer import Customer
from app.models.conversation import Conversation, ConversationChannel, Message, MessageRole
from app.services.communication.sms import SMSService
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/sms", tags=["SMS"])


@router.post(
    "/webhook",
    summary="Inbound SMS webhook",
    description=(
        "Twilio calls this endpoint when an SMS arrives on your Twilio number. "
        "The AI agent processes the message and replies via SMS."
    ),
    response_description="TwiML MessagingResponse",
)
async def inbound_sms(
    request: Request,
    From: str = Form(...),
    To: str = Form(...),
    Body: str = Form(default=""),
    db: AsyncSession = Depends(get_db),
):
    from twilio.twiml.messaging_response import MessagingResponse

    biz_result = await db.execute(select(Business).where(Business.phone_number == To))
    business = biz_result.scalar_one_or_none()

    if not business:
        resp = MessagingResponse()
        resp.message("Sorry, this number is not configured.")
        return Response(content=str(resp), media_type="application/xml")

    # Get or create customer
    cust_result = await db.execute(
        select(Customer).where(and_(Customer.business_id == business.id, Customer.phone_number == From))
    )
    customer = cust_result.scalar_one_or_none()
    if not customer:
        customer = Customer(business_id=business.id, phone_number=From)
        db.add(customer)
        await db.flush()

    # Get or create conversation
    conv_result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.business_id == business.id,
                Conversation.customer_id == customer.id,
                Conversation.channel == ConversationChannel.sms,
                Conversation.is_active == True,
            )
        )
    )
    conversation = conv_result.scalar_one_or_none()
    if not conversation:
        conversation = Conversation(
            business_id=business.id,
            customer_id=customer.id,
            channel=ConversationChannel.sms,
            language=business.preferred_language,
        )
        db.add(conversation)
        await db.flush()

    db.add(Message(conversation_id=conversation.id, role=MessageRole.user, content=Body))

    # AI agent response
    from app.services.ai.agent import VoxaAgent
    agent = VoxaAgent(business_id=business.id, conversation_id=conversation.id)
    agent_result = await agent.respond(
        user_message=Body,
        language=conversation.language,
        customer_id=customer.id,
        business_info={
            "name": business.name,
            "category": business.category.value,
            "greeting_message": business.greeting_message,
        },
    )

    db.add(Message(conversation_id=conversation.id, role=MessageRole.assistant, content=agent_result.reply))
    customer.last_contact_at = datetime.utcnow()
    await db.commit()

    resp = MessagingResponse()
    resp.message(agent_result.reply)
    return Response(content=str(resp), media_type="application/xml")


@router.post(
    "/send",
    summary="Send SMS",
    description="Send an SMS message directly to a phone number (useful for testing or manual outreach).",
)
async def send_sms(
    to: str,
    body: str,
    business_id: uuid.UUID | None = None,
):
    sms = SMSService()
    success = await sms.send_message(to=to, body=body)
    return {"sent": success, "to": to}

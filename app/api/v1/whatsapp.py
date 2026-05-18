"""
WhatsApp chatbot endpoint.
Accepts incoming WhatsApp messages and runs them through the AI agent.
"""
import uuid
from fastapi import APIRouter, Depends, Request, Response, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps import get_db
from app.schemas.conversation import ChatRequest, ChatResponse
from app.models.business import Business
from app.models.customer import Customer
from app.models.conversation import Conversation, Message, ConversationChannel, MessageRole
from app.services.ai.agent import VoxaAgent
from app.services.communication.whatsapp import WhatsAppService
from app.config import get_settings
from app.core.rate_limit import limiter

settings = get_settings()
router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])


@router.get("/webhook")
async def verify_webhook(request: Request):
    """WhatsApp Business API webhook verification."""
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")
    if mode == "subscribe" and token == settings.whatsapp_verify_token:
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def receive_whatsapp(request: Request, db: AsyncSession = Depends(get_db)):
    """Receive and process incoming WhatsApp messages from Meta."""
    body = await request.json()
    try:
        entry = body["entry"][0]["changes"][0]["value"]
        message_data = entry["messages"][0]
        from_number = message_data["from"]
        text = message_data["text"]["body"]
        business_phone = entry["metadata"]["display_phone_number"]
    except (KeyError, IndexError):
        return {"status": "no_message"}

    # Find business by phone
    biz_result = await db.execute(
        select(Business).where(Business.phone_number == business_phone)
    )
    business = biz_result.scalar_one_or_none()
    if not business:
        return {"status": "unknown_business"}

    # Get or create customer
    cust_result = await db.execute(
        select(Customer).where(
            and_(Customer.business_id == business.id, Customer.phone_number == from_number)
        )
    )
    customer = cust_result.scalar_one_or_none()
    if not customer:
        customer = Customer(business_id=business.id, phone_number=from_number, whatsapp_number=from_number)
        db.add(customer)
        await db.flush()

    # Get or create active conversation
    conv_result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.customer_id == customer.id,
                Conversation.channel == ConversationChannel.whatsapp,
                Conversation.is_active == True,
            )
        )
    )
    conversation = conv_result.scalar_one_or_none()
    if not conversation:
        conversation = Conversation(
            business_id=business.id,
            customer_id=customer.id,
            channel=ConversationChannel.whatsapp,
            language=customer.preferred_language,
        )
        db.add(conversation)
        await db.flush()

    # Save user message
    db.add(Message(conversation_id=conversation.id, role=MessageRole.user, content=text))

    # Run AI agent (pass db so it loads conversation history)
    agent = VoxaAgent(business_id=business.id, conversation_id=conversation.id)
    agent_result = await agent.respond(
        user_message=text,
        language=conversation.language,
        customer_id=customer.id,
        business_info={
            "name": business.name,
            "category": business.category.value,
            "greeting_message": business.greeting_message,
        },
        db=db,
    )

    # Save assistant reply
    db.add(Message(conversation_id=conversation.id, role=MessageRole.assistant, content=agent_result.reply))
    await db.commit()

    # Send reply via WhatsApp
    wa = WhatsAppService()
    await wa.send_message(to=from_number, body=agent_result.reply)

    return {"status": "ok"}


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("30/minute")
async def chat(request: Request, payload: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Direct API chat endpoint for testing and integrations."""
    biz_result = await db.execute(select(Business).where(Business.id == payload.business_id))
    business = biz_result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    cust_result = await db.execute(
        select(Customer).where(
            and_(Customer.business_id == payload.business_id, Customer.phone_number == payload.customer_phone)
        )
    )
    customer = cust_result.scalar_one_or_none()
    if not customer:
        customer = Customer(
            business_id=payload.business_id,
            phone_number=payload.customer_phone,
            preferred_language=payload.language,
        )
        db.add(customer)
        await db.flush()

    if payload.conversation_id:
        conversation = await db.get(Conversation, payload.conversation_id)
    else:
        conversation = Conversation(
            business_id=payload.business_id,
            customer_id=customer.id,
            channel=payload.channel,
            language=payload.language,
        )
        db.add(conversation)
        await db.flush()

    db.add(Message(conversation_id=conversation.id, role=MessageRole.user, content=payload.message))

    agent = VoxaAgent(business_id=payload.business_id, conversation_id=conversation.id)
    result = await agent.respond(
        user_message=payload.message,
        language=payload.language,
        customer_id=customer.id,
        business_info={"name": business.name, "category": business.category.value},
    )

    db.add(Message(conversation_id=conversation.id, role=MessageRole.assistant, content=result.reply))
    await db.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        reply=result.reply,
        language=payload.language,
        suggested_actions=result.suggested_actions,
    )

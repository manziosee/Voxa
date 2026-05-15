"""
Outbound call initiation and callback scheduling.
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps import get_db
from app.models.business import Business
from app.models.customer import Customer
from app.models.call import Call, CallDirection, CallStatus
from app.schemas.outbound import (
    OutboundCallRequest,
    OutboundCallResponse,
    CallbackRequest,
    CallbackResponse,
)
from app.services.communication.twilio_service import TwilioService

router = APIRouter(prefix="/outbound", tags=["Outbound"])


@router.post(
    "/call",
    response_model=OutboundCallResponse,
    status_code=202,
    summary="Initiate an outbound call",
    description=(
        "Places an outbound call from the business phone number to the customer. "
        "The AI agent answers with the configured script_hint as its opening context."
    ),
)
async def initiate_call(
    payload: OutboundCallRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, payload.business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    if not business.phone_number:
        raise HTTPException(status_code=422, detail="Business has no configured phone number")

    # Get or create customer record
    cust_q = await db.execute(
        select(Customer).where(
            and_(Customer.business_id == payload.business_id, Customer.phone_number == payload.to_number)
        )
    )
    customer = cust_q.scalar_one_or_none()
    if not customer:
        customer = Customer(
            business_id=payload.business_id,
            phone_number=payload.to_number,
            preferred_language=payload.language,
        )
        db.add(customer)
        await db.flush()

    call = Call(
        business_id=payload.business_id,
        customer_id=customer.id,
        caller_number=payload.to_number,
        direction=CallDirection.outbound,
        status=CallStatus.initiated,
        language_detected=payload.language,
    )
    db.add(call)
    await db.flush()

    base_url = str(request.base_url).rstrip("/")
    twiml_url = (
        f"{base_url}/api/v1/webhooks/twilio/outbound"
        f"?call_id={call.id}"
        f"&language={payload.language}"
        f"&script_hint={payload.script_hint or ''}"
    )
    status_callback = f"{base_url}/api/v1/webhooks/twilio/status"

    twilio = TwilioService()
    try:
        call_sid = await twilio.initiate_outbound_call(
            to=payload.to_number,
            twiml_url=twiml_url,
            status_callback_url=status_callback,
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=502, detail=f"Twilio error: {str(e)}")

    call.twilio_call_sid = call_sid
    call.status = CallStatus.ringing
    await db.commit()

    return OutboundCallResponse(
        call_sid=call_sid,
        call_id=call.id,
        status="ringing",
        to_number=payload.to_number,
        message=f"Outbound call initiated to {payload.to_number}",
    )


@router.post(
    "/callback",
    response_model=CallbackResponse,
    status_code=201,
    summary="Schedule a customer callback",
    description=(
        "Schedules a future outbound call to the customer at the specified time. "
        "A Celery task fires the call at the scheduled datetime."
    ),
)
async def schedule_callback(
    payload: CallbackRequest,
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, payload.business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    callback_id = uuid.uuid4()

    # Store callback details in the customer metadata
    cust_q = await db.execute(
        select(Customer).where(
            and_(Customer.business_id == payload.business_id, Customer.phone_number == payload.customer_phone)
        )
    )
    customer = cust_q.scalar_one_or_none()
    if not customer:
        customer = Customer(
            business_id=payload.business_id,
            phone_number=payload.customer_phone,
            preferred_language=payload.language,
        )
        db.add(customer)
        await db.flush()

    metadata = customer.metadata or {}
    callbacks = metadata.get("scheduled_callbacks", [])
    callbacks.append({
        "callback_id": str(callback_id),
        "scheduled_at": payload.scheduled_at.isoformat(),
        "reason": payload.reason,
        "language": payload.language,
        "status": "pending",
    })
    metadata["scheduled_callbacks"] = callbacks
    customer.metadata = metadata
    await db.commit()

    # Enqueue Celery task
    try:
        from app.worker import celery_app
        celery_app.send_task(
            "app.worker.fire_callback",
            args=[str(payload.business_id), str(customer.id), payload.customer_phone, payload.reason, payload.language],
            eta=payload.scheduled_at,
        )
    except Exception:
        pass  # Celery not available in dev; callback stored in DB

    return CallbackResponse(
        callback_id=callback_id,
        customer_phone=payload.customer_phone,
        scheduled_at=payload.scheduled_at,
        status="scheduled",
    )


@router.get(
    "/callbacks/{business_id}",
    summary="List pending callbacks",
    description="Returns all scheduled callbacks for a business that are still pending.",
)
async def list_callbacks(business_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    cust_q = await db.execute(
        select(Customer).where(Customer.business_id == business_id)
    )
    customers = cust_q.scalars().all()

    pending = []
    for c in customers:
        for cb in (c.metadata or {}).get("scheduled_callbacks", []):
            if cb.get("status") == "pending":
                pending.append({
                    "callback_id": cb["callback_id"],
                    "customer_phone": c.phone_number,
                    "customer_name": c.name,
                    "scheduled_at": cb["scheduled_at"],
                    "reason": cb["reason"],
                    "language": cb["language"],
                })
    return {"callbacks": pending}

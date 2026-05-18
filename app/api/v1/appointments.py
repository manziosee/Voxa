import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.schemas.appointment import AppointmentCreate, AppointmentUpdate, AppointmentOut
from app.services.booking.booking_service import BookingService
from app.services.crm.webhook_forwarder import WebhookForwarder
from app.models.webhook_config import WebhookEvent

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("/", response_model=AppointmentOut, status_code=201)
async def create_appointment(payload: AppointmentCreate, db: AsyncSession = Depends(get_db)):
    service = BookingService(db)
    msg = await service.create_appointment_by_phone(
        business_id=payload.business_id,
        customer_phone="",  # Direct creation; customer_id already known
        service_name=payload.service_name,
        scheduled_at=payload.scheduled_at,
        duration_minutes=payload.duration_minutes,
        notes=payload.notes or "",
        call_id=payload.call_id,
    )
    # For direct API creation, bypass phone lookup and create directly
    appointment = Appointment(
        business_id=payload.business_id,
        customer_id=payload.customer_id,
        service_name=payload.service_name,
        scheduled_at=payload.scheduled_at,
        duration_minutes=payload.duration_minutes,
        notes=payload.notes,
        call_id=payload.call_id,
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)

    # Forward appointment.created event to registered CRM webhooks
    forwarder = WebhookForwarder(db)
    await forwarder.dispatch(
        business_id=appointment.business_id,
        event=WebhookEvent.appointment_booked,
        payload={
            "appointment_id": str(appointment.id),
            "customer_id": str(appointment.customer_id),
            "service_name": appointment.service_name,
            "scheduled_at": appointment.scheduled_at.isoformat(),
            "duration_minutes": appointment.duration_minutes,
            "status": appointment.status.value,
        },
    )
    return appointment


@router.get("/business/{business_id}", response_model=list[AppointmentOut])
async def list_business_appointments(
    business_id: uuid.UUID,
    status: AppointmentStatus | None = None,
    db: AsyncSession = Depends(get_db),
):
    filters = [Appointment.business_id == business_id]
    if status:
        filters.append(Appointment.status == status)
    result = await db.execute(select(Appointment).where(and_(*filters)))
    return result.scalars().all()


@router.get("/availability/{business_id}")
async def get_availability(
    business_id: uuid.UUID,
    date: str,
    db: AsyncSession = Depends(get_db),
):
    service = BookingService(db)
    slots = await service.get_available_slots(business_id=business_id, date_str=date)
    return {"date": date, "available_slots": slots}


@router.patch("/{appointment_id}", response_model=AppointmentOut)
async def update_appointment(
    appointment_id: uuid.UUID,
    payload: AppointmentUpdate,
    db: AsyncSession = Depends(get_db),
):
    appointment = await db.get(Appointment, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(appointment, field, value)
    await db.commit()
    await db.refresh(appointment)
    return appointment


@router.delete("/{appointment_id}", status_code=204)
async def cancel_appointment(appointment_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = BookingService(db)
    result = await service.update_appointment_status(appointment_id, AppointmentStatus.cancelled)
    if not result:
        raise HTTPException(status_code=404, detail="Appointment not found")

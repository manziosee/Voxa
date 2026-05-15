"""
Booking service: appointment CRUD, slot availability, reminders.
"""
import uuid
from datetime import datetime, timedelta, date, time
from zoneinfo import ZoneInfo

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.appointment import Appointment, AppointmentStatus
from app.models.business import Business, BusinessHours
from app.models.customer import Customer
from app.config import get_settings

settings = get_settings()


class BookingService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_appointment_by_phone(
        self,
        business_id: uuid.UUID,
        customer_phone: str,
        service_name: str,
        scheduled_at: datetime,
        duration_minutes: int = 30,
        notes: str = "",
        call_id: uuid.UUID | None = None,
    ) -> str:
        customer = await self._get_or_create_customer(business_id, customer_phone)
        conflict = await self._check_conflict(business_id, scheduled_at, duration_minutes)
        if conflict:
            return f"Sorry, that slot is already booked. The next available slot is different — please ask for availability."

        appointment = Appointment(
            business_id=business_id,
            customer_id=customer.id,
            service_name=service_name,
            scheduled_at=scheduled_at,
            duration_minutes=duration_minutes,
            notes=notes,
            call_id=call_id,
        )
        self.db.add(appointment)
        await self.db.commit()
        await self.db.refresh(appointment)

        # Send WhatsApp confirmation
        if customer.whatsapp_number or customer.phone_number:
            from app.services.communication.whatsapp import WhatsAppService
            wa = WhatsAppService()
            business = await self.db.get(Business, business_id)
            await wa.send_appointment_confirmation(
                to=customer.whatsapp_number or customer.phone_number,
                customer_name=customer.name or "Customer",
                service=service_name,
                scheduled_at=scheduled_at.strftime("%A %d %B %Y at %H:%M"),
                business_name=business.name if business else "us",
                language=customer.preferred_language,
            )
            appointment.reminder_sent = True
            await self.db.commit()

        return f"Appointment booked for {service_name} on {scheduled_at.strftime('%A %d %B at %H:%M')}. Confirmation sent to your WhatsApp."

    async def get_available_slots(
        self,
        business_id: uuid.UUID,
        date_str: str,
        duration_minutes: int | None = None,
    ) -> list[str]:
        target_date = date.fromisoformat(date_str)
        business = await self.db.get(Business, business_id)
        if not business:
            return []

        tz = ZoneInfo(business.timezone)
        duration = duration_minutes or settings.default_appointment_duration_minutes
        day_of_week = target_date.weekday()

        hours_result = await self.db.execute(
            select(BusinessHours).where(
                and_(BusinessHours.business_id == business_id, BusinessHours.day_of_week == day_of_week)
            )
        )
        hours = hours_result.scalar_one_or_none()
        if not hours or hours.is_closed:
            return []

        slots = []
        current = datetime.combine(target_date, hours.open_time, tzinfo=tz)
        close = datetime.combine(target_date, hours.close_time, tzinfo=tz)

        while current + timedelta(minutes=duration) <= close:
            conflict = await self._check_conflict(business_id, current, duration)
            if not conflict:
                slots.append(current.strftime("%H:%M"))
            current += timedelta(minutes=duration)

        return slots

    async def update_appointment_status(
        self,
        appointment_id: uuid.UUID,
        status: AppointmentStatus,
    ) -> Appointment | None:
        appointment = await self.db.get(Appointment, appointment_id)
        if not appointment:
            return None
        appointment.status = status
        appointment.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(appointment)
        return appointment

    async def get_upcoming_appointments(
        self,
        business_id: uuid.UUID,
        hours_ahead: int = 24,
    ) -> list[Appointment]:
        now = datetime.utcnow()
        result = await self.db.execute(
            select(Appointment).where(
                and_(
                    Appointment.business_id == business_id,
                    Appointment.status == AppointmentStatus.confirmed,
                    Appointment.scheduled_at >= now,
                    Appointment.scheduled_at <= now + timedelta(hours=hours_ahead),
                    Appointment.reminder_sent == False,
                )
            )
        )
        return result.scalars().all()

    async def _get_or_create_customer(self, business_id: uuid.UUID, phone: str) -> Customer:
        result = await self.db.execute(
            select(Customer).where(
                and_(Customer.business_id == business_id, Customer.phone_number == phone)
            )
        )
        customer = result.scalar_one_or_none()
        if not customer:
            customer = Customer(business_id=business_id, phone_number=phone)
            self.db.add(customer)
            await self.db.commit()
            await self.db.refresh(customer)
        return customer

    async def _check_conflict(
        self, business_id: uuid.UUID, scheduled_at: datetime, duration_minutes: int
    ) -> bool:
        end_at = scheduled_at + timedelta(minutes=duration_minutes)
        result = await self.db.execute(
            select(Appointment).where(
                and_(
                    Appointment.business_id == business_id,
                    Appointment.status.not_in([AppointmentStatus.cancelled]),
                    Appointment.scheduled_at < end_at,
                    (Appointment.scheduled_at + timedelta(minutes=Appointment.duration_minutes)) > scheduled_at,
                )
            )
        )
        return result.scalar_one_or_none() is not None

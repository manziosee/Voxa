"""
Celery worker — handles async tasks:
  - send_appointment_reminders: runs hourly to send WhatsApp reminders
  - fire_callback: places an outbound call at a scheduled time
"""
from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery("voxa", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.task_serializer = "json"
celery_app.conf.beat_schedule = {
    "send-appointment-reminders": {
        "task": "app.worker.send_appointment_reminders",
        "schedule": 3600.0,  # every hour
    },
}


@celery_app.task(name="app.worker.send_appointment_reminders")
def send_appointment_reminders():
    import asyncio

    async def _run():
        from app.database import AsyncSessionLocal
        from app.services.booking.booking_service import BookingService
        from app.services.communication.whatsapp import WhatsAppService
        from app.models.appointment import AppointmentStatus

        async with AsyncSessionLocal() as db:
            # Iterate over all active businesses would go here
            # For now get all upcoming appointments system-wide
            from sqlalchemy import select
            from app.models.appointment import Appointment
            from app.models.customer import Customer
            from app.models.business import Business
            from sqlalchemy import and_
            from datetime import datetime, timedelta

            now = datetime.utcnow()
            result = await db.execute(
                select(Appointment).where(
                    and_(
                        Appointment.status == AppointmentStatus.confirmed,
                        Appointment.scheduled_at >= now,
                        Appointment.scheduled_at <= now + timedelta(hours=25),
                        Appointment.reminder_sent == False,
                    )
                )
            )
            appointments = result.scalars().all()
            wa = WhatsAppService()

            for appt in appointments:
                customer = await db.get(Customer, appt.customer_id)
                business = await db.get(Business, appt.business_id)
                if customer and business:
                    to = customer.whatsapp_number or customer.phone_number
                    await wa.send_appointment_reminder(
                        to=to,
                        customer_name=customer.name or "Customer",
                        service=appt.service_name,
                        scheduled_at=appt.scheduled_at.strftime("%H:%M"),
                        business_name=business.name,
                        language=customer.preferred_language,
                    )
                    appt.reminder_sent = True

            await db.commit()

    asyncio.run(_run())


@celery_app.task(name="app.worker.fire_callback")
def fire_callback(
    business_id: str,
    customer_id: str,
    customer_phone: str,
    reason: str,
    language: str = "en",
):
    """Place an outbound call to a customer for a scheduled callback."""
    import asyncio

    async def _run():
        import uuid
        from app.database import AsyncSessionLocal
        from app.models.business import Business
        from app.models.customer import Customer
        from app.services.communication.twilio_service import TwilioService

        async with AsyncSessionLocal() as db:
            business = await db.get(Business, uuid.UUID(business_id))
            customer = await db.get(Customer, uuid.UUID(customer_id))
            if not business or not customer:
                return

            lang_map = {"en": "en-US", "fr": "fr-FR", "sw": "sw-KE", "rw": "rw-RW"}
            twiml_lang = lang_map.get(language, "en-US")
            greetings = {
                "en": f"Hello, this is a callback from {business.name}. {reason}",
                "fr": f"Bonjour, c'est un rappel de {business.name}. {reason}",
                "sw": f"Habari, hii ni simu ya kurudisha kutoka {business.name}. {reason}",
                "rw": f"Muraho, uyu ni callback uturuka {business.name}. {reason}",
            }
            greeting_text = greetings.get(language, greetings["en"])
            # Pass TwiML inline — no public URL required
            twiml_body = (
                f'<?xml version="1.0" encoding="UTF-8"?>'
                f"<Response>"
                f'<Say language="{twiml_lang}">{greeting_text}</Say>'
                f"<Hangup/>"
                f"</Response>"
            )
            twilio = TwilioService()
            try:
                await twilio.initiate_outbound_call(to=customer_phone, twiml=twiml_body)
            except Exception:
                pass

            # Mark callback as completed in customer metadata
            metadata = customer.metadata or {}
            for cb in metadata.get("scheduled_callbacks", []):
                if cb.get("reason") == reason and cb.get("status") == "pending":
                    cb["status"] = "completed"
                    break
            customer.metadata = metadata
            await db.commit()

    asyncio.run(_run())

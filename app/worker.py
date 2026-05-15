"""
Celery worker — handles async tasks:
  - send_appointment_reminders: runs hourly to send WhatsApp reminders
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

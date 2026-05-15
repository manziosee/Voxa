"""
LangChain tools available to the VoxaAgent:
  - book_appointment
  - check_availability
  - lookup_customer
  - send_whatsapp_message
  - escalate_to_human
"""
import uuid
from datetime import datetime
from langchain_core.tools import tool


@tool
async def book_appointment(
    business_id: str,
    customer_phone: str,
    service_name: str,
    scheduled_at: str,
    duration_minutes: int = 30,
    notes: str = "",
) -> str:
    """
    Book an appointment for a customer. scheduled_at must be ISO 8601 format.
    Returns confirmation message.
    """
    from app.database import AsyncSessionLocal
    from app.services.booking.booking_service import BookingService

    async with AsyncSessionLocal() as db:
        service = BookingService(db)
        result = await service.create_appointment_by_phone(
            business_id=uuid.UUID(business_id),
            customer_phone=customer_phone,
            service_name=service_name,
            scheduled_at=datetime.fromisoformat(scheduled_at),
            duration_minutes=duration_minutes,
            notes=notes,
        )
    return result


@tool
async def check_availability(
    business_id: str,
    date: str,
) -> str:
    """
    Check available appointment slots for a business on a given date (YYYY-MM-DD).
    Returns a list of available time slots.
    """
    from app.database import AsyncSessionLocal
    from app.services.booking.booking_service import BookingService

    async with AsyncSessionLocal() as db:
        service = BookingService(db)
        slots = await service.get_available_slots(
            business_id=uuid.UUID(business_id),
            date_str=date,
        )
    return "\n".join(slots) if slots else "No slots available on that date."


@tool
async def lookup_customer(business_id: str, phone_number: str) -> str:
    """
    Look up a customer by phone number. Returns name, last visit, and notes.
    """
    from app.database import AsyncSessionLocal
    from sqlalchemy import select
    from app.models.customer import Customer

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Customer).where(
                Customer.business_id == uuid.UUID(business_id),
                Customer.phone_number == phone_number,
            )
        )
        customer = result.scalar_one_or_none()
    if not customer:
        return "Customer not found. New customer."
    return (
        f"Name: {customer.name or 'Unknown'}, "
        f"Last contact: {customer.last_contact_at.date()}, "
        f"Notes: {customer.notes or 'None'}, "
        f"Status: {customer.status}"
    )


@tool
async def send_whatsapp_confirmation(
    to_number: str,
    message: str,
) -> str:
    """Send a WhatsApp message to a customer — use for confirmations and reminders."""
    from app.services.communication.whatsapp import WhatsAppService

    wa = WhatsAppService()
    success = await wa.send_message(to=to_number, body=message)
    return "Message sent." if success else "Failed to send message."


@tool
def escalate_to_human(reason: str) -> str:
    """
    Signal that the call should be escalated to a human agent.
    Use when the customer is very upset, has a complex issue, or explicitly asks for a human.
    """
    return f"ESCALATE:{reason}"


VOXA_TOOLS = [
    book_appointment,
    check_availability,
    lookup_customer,
    send_whatsapp_confirmation,
    escalate_to_human,
]

"""
Unit tests for BookingService.

All DB calls go through a mock AsyncSession so no live database is required.
"""
import uuid
import pytest
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock

from app.services.booking.booking_service import BookingService
from app.models.appointment import Appointment, AppointmentStatus
from app.models.customer import Customer


def _mock_customer(business_id=None, phone="+250780000001"):
    customer = MagicMock(spec=Customer)
    customer.id = uuid.uuid4()
    customer.business_id = business_id or uuid.uuid4()
    customer.phone_number = phone
    customer.whatsapp_number = None
    customer.name = "Test User"
    customer.notes = None
    customer.status = "active"
    customer.last_contact_at = datetime.utcnow()
    return customer


def _mock_db_with_customer(customer):
    db = AsyncMock()
    result = MagicMock()
    result.scalar_one_or_none.return_value = customer
    db.execute = AsyncMock(return_value=result)
    db.commit = AsyncMock()
    db.flush = AsyncMock()
    db.refresh = AsyncMock()
    db.add = MagicMock()
    db.get = AsyncMock(return_value=None)
    return db


@pytest.mark.asyncio
async def test_check_conflict_returns_false_when_no_existing_appointments():
    """No appointments in DB → no conflict."""
    db = AsyncMock()
    empty_result = MagicMock()
    empty_result.scalars.return_value.all.return_value = []
    db.execute = AsyncMock(return_value=empty_result)

    service = BookingService(db)
    business_id = uuid.uuid4()
    scheduled_at = datetime.utcnow() + timedelta(days=1)

    conflict = await service._check_conflict(business_id, scheduled_at, 30)
    assert conflict is False


@pytest.mark.asyncio
async def test_check_conflict_returns_true_when_slot_overlaps():
    """Existing appointment overlapping the requested time → conflict."""
    db = AsyncMock()
    existing = MagicMock(spec=Appointment)
    existing.scheduled_at = datetime(2026, 6, 1, 10, 0)
    existing.duration_minutes = 60

    result = MagicMock()
    result.scalars.return_value.all.return_value = [existing]
    db.execute = AsyncMock(return_value=result)

    service = BookingService(db)
    business_id = uuid.uuid4()
    # Request overlaps: starts 20 minutes into the existing appointment
    scheduled_at = datetime(2026, 6, 1, 10, 20)

    conflict = await service._check_conflict(business_id, scheduled_at, 30)
    assert conflict is True


@pytest.mark.asyncio
async def test_create_appointment_by_phone_no_conflict():
    """Happy path: new customer, open slot → appointment created and confirmation message returned."""
    business_id = uuid.uuid4()
    customer = _mock_customer(business_id=business_id)
    db = _mock_db_with_customer(customer)

    # _check_conflict must read appointments — return empty
    no_conflicts = MagicMock()
    no_conflicts.scalars.return_value.all.return_value = []

    call_count = 0
    original_execute = db.execute

    async def side_effect_execute(stmt, *args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count == 1:
            # customer lookup
            r = MagicMock()
            r.scalar_one_or_none.return_value = customer
            return r
        # conflict check
        return no_conflicts

    db.execute = side_effect_execute

    with patch("app.services.communication.whatsapp.WhatsAppService.send_appointment_confirmation", new_callable=AsyncMock) as mock_wa:
        mock_wa.return_value = True
        service = BookingService(db)
        result = await service.create_appointment_by_phone(
            business_id=business_id,
            customer_phone=customer.phone_number,
            service_name="Haircut",
            scheduled_at=datetime(2026, 6, 10, 9, 0),
            duration_minutes=30,
        )

    assert "Haircut" in result or "booked" in result.lower() or "confirmed" in result.lower()


@pytest.mark.asyncio
async def test_create_appointment_returns_error_on_conflict():
    """Slot already booked → returns a 'sorry' message, does not persist."""
    business_id = uuid.uuid4()
    customer = _mock_customer(business_id=business_id)

    existing = MagicMock(spec=Appointment)
    existing.scheduled_at = datetime(2026, 6, 10, 9, 0)
    existing.duration_minutes = 60

    call_count = 0

    async def side_effect_execute(stmt, *args, **kwargs):
        nonlocal call_count
        call_count += 1
        r = MagicMock()
        if call_count == 1:
            r.scalar_one_or_none.return_value = customer
        else:
            r.scalars.return_value.all.return_value = [existing]
        return r

    db = AsyncMock()
    db.execute = side_effect_execute
    db.commit = AsyncMock()
    db.add = MagicMock()
    db.flush = AsyncMock()

    service = BookingService(db)
    result = await service.create_appointment_by_phone(
        business_id=business_id,
        customer_phone=customer.phone_number,
        service_name="Haircut",
        scheduled_at=datetime(2026, 6, 10, 9, 20),
        duration_minutes=30,
    )

    assert "sorry" in result.lower() or "booked" in result.lower()
    db.commit.assert_not_called()

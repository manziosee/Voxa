"""
Unit tests for VoxaAgent LangChain tools.

Focuses on pure-logic tools and verifiable contracts of DB-dependent tools.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import uuid

from app.services.ai.tools import VOXA_TOOLS, escalate_to_human


class TestEscalateToHuman:
    def test_returns_escalate_prefix(self):
        result = escalate_to_human.invoke({"reason": "Customer is very upset"})
        assert result.startswith("ESCALATE:")

    def test_reason_embedded_in_output(self):
        reason = "Requested human agent"
        result = escalate_to_human.invoke({"reason": reason})
        assert reason in result

    def test_empty_reason_still_returns_prefix(self):
        result = escalate_to_human.invoke({"reason": ""})
        assert result.startswith("ESCALATE:")


class TestToolRegistry:
    def test_five_tools_registered(self):
        assert len(VOXA_TOOLS) == 5

    def test_tool_names(self):
        names = {t.name for t in VOXA_TOOLS}
        expected = {
            "book_appointment",
            "check_availability",
            "lookup_customer",
            "send_whatsapp_confirmation",
            "escalate_to_human",
        }
        assert names == expected

    def test_all_tools_have_description(self):
        for tool in VOXA_TOOLS:
            assert tool.description, f"Tool '{tool.name}' is missing a description"

    def test_book_appointment_required_args(self):
        book = next(t for t in VOXA_TOOLS if t.name == "book_appointment")
        schema = book.args_schema.model_json_schema()
        required = set(schema.get("required", []))
        assert "business_id" in required
        assert "customer_phone" in required
        assert "service_name" in required
        assert "scheduled_at" in required

    def test_check_availability_required_args(self):
        check = next(t for t in VOXA_TOOLS if t.name == "check_availability")
        schema = check.args_schema.model_json_schema()
        required = set(schema.get("required", []))
        assert "business_id" in required
        assert "date" in required


@pytest.mark.asyncio
async def test_lookup_customer_not_found():
    """When no customer row exists, lookup_customer should return 'not found' message."""
    with patch("app.database.AsyncSessionLocal") as mock_session_class:
        mock_session = AsyncMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)
        mock_session_class.return_value = mock_session

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = None
        mock_session.execute = AsyncMock(return_value=result_mock)

        from app.services.ai.tools import lookup_customer
        output = await lookup_customer.ainvoke({
            "business_id": str(uuid.uuid4()),
            "phone_number": "+250780000099",
        })

    assert "not found" in output.lower() or "new customer" in output.lower()


@pytest.mark.asyncio
async def test_lookup_customer_found():
    """When a customer row exists, lookup_customer should surface name and status."""
    from app.models.customer import Customer, CustomerStatus
    from datetime import datetime

    customer = MagicMock(spec=Customer)
    customer.name = "Alice"
    customer.last_contact_at = datetime(2026, 5, 1)
    customer.notes = "Prefers morning slots"
    customer.status = CustomerStatus.active

    with patch("app.database.AsyncSessionLocal") as mock_session_class:
        mock_session = AsyncMock()
        mock_session.__aenter__ = AsyncMock(return_value=mock_session)
        mock_session.__aexit__ = AsyncMock(return_value=False)
        mock_session_class.return_value = mock_session

        result_mock = MagicMock()
        result_mock.scalar_one_or_none.return_value = customer
        mock_session.execute = AsyncMock(return_value=result_mock)

        from app.services.ai.tools import lookup_customer
        output = await lookup_customer.ainvoke({
            "business_id": str(uuid.uuid4()),
            "phone_number": "+250780000001",
        })

    assert "Alice" in output
    assert "active" in output.lower()

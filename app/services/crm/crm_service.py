"""
CRM service: auto-creates/updates customer records and tickets after each call.
Designed to work standalone; plugs into external CRMs via adapters in future iterations.
"""
import uuid
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.models.customer import Customer
from app.models.call import Call, CallOutcome
from app.services.ai.memory import CustomerMemoryService


class CRMService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.memory = CustomerMemoryService()

    async def post_call_update(self, call: Call) -> None:
        """Run after a call ends to update CRM records and save memory."""
        if not call.customer_id:
            return

        customer = await self.db.get(Customer, call.customer_id)
        if not customer:
            return

        # Update last contact
        customer.last_contact_at = datetime.utcnow()

        # Append call outcome to customer metadata
        history = customer.metadata or {}
        call_log = history.get("call_history", [])
        call_log.append({
            "call_id": str(call.id),
            "date": call.started_at.isoformat(),
            "outcome": call.outcome.value if call.outcome else None,
            "duration": call.duration_seconds,
            "emotion": call.emotion_detected.value,
            "escalated": call.escalated,
        })
        history["call_history"] = call_log[-20:]  # Keep last 20 calls
        customer.metadata = history
        await self.db.commit()

        # Save to vector memory for AI recall
        if call.summary:
            await self.memory.save_interaction(
                customer_id=customer.id,
                business_id=call.business_id,
                interaction_type="call",
                content=call.summary,
                metadata={
                    "outcome": call.outcome.value if call.outcome else None,
                    "emotion": call.emotion_detected.value,
                    "language": call.language_detected,
                },
            )

    async def create_ticket(
        self,
        business_id: uuid.UUID,
        customer_id: uuid.UUID,
        subject: str,
        description: str,
        priority: str = "normal",
    ) -> dict:
        """Create a support ticket (stored in customer metadata for now)."""
        customer = await self.db.get(Customer, customer_id)
        if not customer:
            return {}

        metadata = customer.metadata or {}
        tickets = metadata.get("tickets", [])
        ticket = {
            "id": str(uuid.uuid4()),
            "subject": subject,
            "description": description,
            "priority": priority,
            "status": "open",
            "created_at": datetime.utcnow().isoformat(),
        }
        tickets.append(ticket)
        metadata["tickets"] = tickets
        customer.metadata = metadata
        await self.db.commit()

        await self.memory.save_interaction(
            customer_id=customer_id,
            business_id=business_id,
            interaction_type="complaint",
            content=f"{subject}: {description}",
            metadata={"priority": priority},
        )
        return ticket

    async def get_customer_timeline(self, customer_id: uuid.UUID) -> list[dict]:
        """Return a merged timeline of calls and tickets for a customer."""
        customer = await self.db.get(Customer, customer_id)
        if not customer:
            return []

        metadata = customer.metadata or {}
        timeline = []
        for call in metadata.get("call_history", []):
            timeline.append({"type": "call", **call})
        for ticket in metadata.get("tickets", []):
            timeline.append({"type": "ticket", **ticket})
        timeline.sort(key=lambda x: x.get("date") or x.get("created_at", ""), reverse=True)
        return timeline

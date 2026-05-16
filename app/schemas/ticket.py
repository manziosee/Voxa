import uuid
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.ticket import TicketStatus, TicketPriority


class CreateTicketRequest(BaseModel):
    customer_id: uuid.UUID
    call_id: uuid.UUID | None = None
    subject: str = Field(..., min_length=1, max_length=200, examples=["Missed appointment notification"])
    description: str = Field(..., min_length=1, examples=["Customer called to report they never received a reminder."])
    priority: TicketPriority = TicketPriority.medium


class UpdateTicketRequest(BaseModel):
    status: TicketStatus | None = None
    priority: TicketPriority | None = None
    resolution: str | None = None


class TicketResponse(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    customer_id: uuid.UUID
    call_id: uuid.UUID | None
    subject: str
    description: str
    status: TicketStatus
    priority: TicketPriority
    resolution: str | None
    created_at: datetime
    updated_at: datetime
    resolved_at: datetime | None

    model_config = {"from_attributes": True}

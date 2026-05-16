import uuid
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl
from app.models.webhook_config import WebhookEvent


class CreateWebhookConfigRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["HubSpot CRM"])
    url: str = Field(..., examples=["https://crm.example.com/voxa-events"])
    secret: str | None = Field(None, description="HMAC secret used to sign payloads (X-Voxa-Signature header)")
    events: list[WebhookEvent] = Field(
        ...,
        description="List of events to subscribe to",
        examples=[["call.completed", "appointment.booked"]],
    )


class UpdateWebhookConfigRequest(BaseModel):
    name: str | None = None
    url: str | None = None
    secret: str | None = None
    events: list[WebhookEvent] | None = None
    is_active: bool | None = None


class WebhookConfigResponse(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    name: str
    url: str
    events: list[str]
    is_active: bool
    last_triggered_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}

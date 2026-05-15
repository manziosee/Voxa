from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class OutboundCallRequest(BaseModel):
    business_id: uuid.UUID
    to_number: str = Field(..., examples=["+250788111222"])
    purpose: str = Field(
        ...,
        examples=["appointment_reminder"],
        description="One of: appointment_reminder, follow_up, marketing, general",
    )
    script_hint: str | None = Field(
        None,
        examples=["Remind customer about their appointment tomorrow at 10am for General Consultation"],
        description="Optional hint for the AI agent's opening line",
    )
    language: str = Field("en", examples=["rw"])

    model_config = {
        "json_schema_extra": {
            "example": {
                "business_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "to_number": "+250788111222",
                "purpose": "appointment_reminder",
                "script_hint": "Remind Ange about her consultation tomorrow at 10am",
                "language": "rw",
            }
        }
    }


class OutboundCallResponse(BaseModel):
    call_sid: str
    call_id: uuid.UUID
    status: str
    to_number: str
    message: str


class CallbackRequest(BaseModel):
    business_id: uuid.UUID
    customer_phone: str = Field(..., examples=["+250788111222"])
    scheduled_at: datetime = Field(..., examples=["2026-05-15T14:30:00"])
    reason: str = Field(..., examples=["Customer requested callback about invoice query"])
    language: str = Field("en", examples=["en"])

    model_config = {
        "json_schema_extra": {
            "example": {
                "business_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "customer_phone": "+250788111222",
                "scheduled_at": "2026-05-15T14:30:00",
                "reason": "Customer has questions about their invoice",
                "language": "en",
            }
        }
    }


class CallbackResponse(BaseModel):
    callback_id: uuid.UUID
    customer_phone: str
    scheduled_at: datetime
    status: str

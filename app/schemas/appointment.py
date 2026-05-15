from pydantic import BaseModel, Field
from datetime import datetime
import uuid
from app.models.appointment import AppointmentStatus


class AppointmentCreate(BaseModel):
    business_id: uuid.UUID
    customer_id: uuid.UUID
    service_name: str = Field(..., examples=["General Consultation"])
    scheduled_at: datetime = Field(..., examples=["2026-05-20T10:00:00"])
    duration_minutes: int = Field(30, ge=5, le=480, examples=[30])
    notes: str | None = Field(None, examples=["First visit, bring medical records"])
    call_id: uuid.UUID | None = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "business_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "customer_id": "7ba85f64-5717-4562-b3fc-2c963f66afa6",
                "service_name": "General Consultation",
                "scheduled_at": "2026-05-20T10:00:00",
                "duration_minutes": 30,
                "notes": "First visit",
            }
        }
    }


class AppointmentUpdate(BaseModel):
    service_name: str | None = None
    scheduled_at: datetime | None = None
    duration_minutes: int | None = None
    status: AppointmentStatus | None = None
    notes: str | None = None


class AppointmentOut(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    customer_id: uuid.UUID
    service_name: str
    scheduled_at: datetime
    duration_minutes: int
    status: AppointmentStatus
    notes: str | None
    reminder_sent: bool
    created_at: datetime

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "aab85f64-5717-4562-b3fc-2c963f66afa6",
                "business_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "customer_id": "7ba85f64-5717-4562-b3fc-2c963f66afa6",
                "service_name": "General Consultation",
                "scheduled_at": "2026-05-20T10:00:00",
                "duration_minutes": 30,
                "status": "confirmed",
                "notes": "First visit",
                "reminder_sent": False,
                "created_at": "2026-05-15T09:00:00",
            }
        },
    }

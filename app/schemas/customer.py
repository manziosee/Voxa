from pydantic import BaseModel, EmailStr, Field
import uuid
from app.models.customer import CustomerStatus


class CustomerCreate(BaseModel):
    business_id: uuid.UUID
    phone_number: str = Field(..., examples=["+250788111222"])
    name: str | None = Field(None, examples=["Ange Uwimana"])
    email: EmailStr | None = Field(None, examples=["ange@example.com"])
    whatsapp_number: str | None = Field(None, examples=["+250788111222"])
    preferred_language: str = Field("en", examples=["rw"])
    notes: str | None = Field(None, examples=["VIP client, prefers morning appointments"])

    model_config = {
        "json_schema_extra": {
            "example": {
                "business_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "phone_number": "+250788111222",
                "name": "Ange Uwimana",
                "email": "ange@example.com",
                "whatsapp_number": "+250788111222",
                "preferred_language": "rw",
                "notes": "Prefers morning appointments",
            }
        }
    }


class CustomerUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    preferred_language: str | None = None
    status: CustomerStatus | None = None
    notes: str | None = None
    metadata: dict | None = None


class CustomerOut(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    phone_number: str
    name: str | None
    email: str | None
    whatsapp_number: str | None
    preferred_language: str
    status: CustomerStatus
    notes: str | None
    metadata: dict

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "7ba85f64-5717-4562-b3fc-2c963f66afa6",
                "business_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "phone_number": "+250788111222",
                "name": "Ange Uwimana",
                "email": "ange@example.com",
                "whatsapp_number": "+250788111222",
                "preferred_language": "rw",
                "status": "active",
                "notes": "Prefers morning appointments",
                "metadata": {"call_history": [], "tickets": []},
            }
        },
    }

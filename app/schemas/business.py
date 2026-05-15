from pydantic import BaseModel, EmailStr, Field
from datetime import time
import uuid
from app.models.business import BusinessCategory


class BusinessHoursCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0=Monday, 6=Sunday")
    open_time: time = Field(..., examples=["08:00:00"])
    close_time: time = Field(..., examples=["18:00:00"])
    is_closed: bool = False

    model_config = {
        "json_schema_extra": {
            "example": {"day_of_week": 0, "open_time": "08:00:00", "close_time": "18:00:00", "is_closed": False}
        }
    }


class BusinessHoursOut(BusinessHoursCreate):
    id: int

    model_config = {"from_attributes": True}


class BusinessCreate(BaseModel):
    name: str = Field(..., examples=["Kigali Clinic"])
    category: BusinessCategory = Field(..., examples=["clinic"])
    phone_number: str = Field(..., examples=["+250788000001"])
    whatsapp_number: str | None = Field(None, examples=["+250788000001"])
    email: EmailStr | None = Field(None, examples=["info@kigaliclinic.rw"])
    address: str | None = Field(None, examples=["KG 7 Ave, Kigali"])
    country: str = Field("RW", examples=["RW"])
    timezone: str = Field("Africa/Kigali", examples=["Africa/Kigali"])
    preferred_language: str = Field("en", examples=["rw"])
    supported_languages: list[str] = Field(["en"], examples=[["en", "rw", "fr"]])
    greeting_message: str | None = Field(
        None,
        examples=["Murakaza neza! Mwakire kuri Kigali Clinic. Nigute twabafasha?"],
    )
    escalation_phone: str | None = Field(None, examples=["+250788000002"])
    hours: list[BusinessHoursCreate] = []

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "Kigali Clinic",
                "category": "clinic",
                "phone_number": "+250788000001",
                "whatsapp_number": "+250788000001",
                "email": "info@kigaliclinic.rw",
                "address": "KG 7 Ave, Kigali",
                "country": "RW",
                "timezone": "Africa/Kigali",
                "preferred_language": "rw",
                "supported_languages": ["rw", "en", "fr"],
                "greeting_message": "Murakaza neza! Mwakire kuri Kigali Clinic. Nigute twabafasha?",
                "escalation_phone": "+250788000002",
                "hours": [
                    {"day_of_week": 0, "open_time": "08:00:00", "close_time": "18:00:00", "is_closed": False},
                    {"day_of_week": 6, "open_time": "08:00:00", "close_time": "13:00:00", "is_closed": False},
                ],
            }
        }
    }


class BusinessUpdate(BaseModel):
    name: str | None = None
    greeting_message: str | None = None
    escalation_phone: str | None = None
    supported_languages: list[str] | None = None
    preferred_language: str | None = None
    is_active: bool | None = None


class BusinessOut(BaseModel):
    id: uuid.UUID
    name: str
    category: BusinessCategory
    phone_number: str
    whatsapp_number: str | None
    email: str | None
    country: str
    timezone: str
    preferred_language: str
    supported_languages: list[str]
    greeting_message: str | None
    escalation_phone: str | None
    is_active: bool
    hours: list[BusinessHoursOut] = []

    model_config = {
        "from_attributes": True,
        "json_schema_extra": {
            "example": {
                "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "name": "Kigali Clinic",
                "category": "clinic",
                "phone_number": "+250788000001",
                "whatsapp_number": "+250788000001",
                "email": "info@kigaliclinic.rw",
                "country": "RW",
                "timezone": "Africa/Kigali",
                "preferred_language": "rw",
                "supported_languages": ["rw", "en", "fr"],
                "greeting_message": "Murakaza neza! Mwakire kuri Kigali Clinic.",
                "escalation_phone": "+250788000002",
                "is_active": True,
                "hours": [],
            }
        },
    }

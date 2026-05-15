from pydantic import BaseModel, Field
from datetime import datetime
import uuid
from app.models.conversation import ConversationChannel, MessageRole


class MessageOut(BaseModel):
    id: int
    role: MessageRole
    content: str
    language: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    customer_id: uuid.UUID
    channel: ConversationChannel
    language: str
    is_active: bool
    created_at: datetime
    messages: list[MessageOut] = []

    model_config = {"from_attributes": True}


class ChatRequest(BaseModel):
    business_id: uuid.UUID
    customer_phone: str = Field(..., examples=["+250788111222"])
    message: str = Field(..., examples=["I want to book an appointment for tomorrow morning"])
    language: str = Field("en", examples=["rw"])
    channel: ConversationChannel = Field(ConversationChannel.whatsapp)
    conversation_id: uuid.UUID | None = Field(
        None, description="Pass to continue an existing conversation thread"
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "business_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "customer_phone": "+250788111222",
                "message": "Hello, I'd like to book a consultation for tomorrow at 10am",
                "language": "en",
                "channel": "whatsapp",
            }
        }
    }


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    reply: str = Field(..., examples=["I've booked your appointment for tomorrow at 10:00 AM. You'll receive a WhatsApp confirmation shortly."])
    language: str
    suggested_actions: list[str] = Field(
        [],
        examples=[["book_appointment", "send_whatsapp"]],
        description="Actions the AI performed or recommends",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "conversation_id": "ccb85f64-5717-4562-b3fc-2c963f66afa6",
                "reply": "I've booked your General Consultation for May 20 at 10:00 AM. A WhatsApp confirmation has been sent!",
                "language": "en",
                "suggested_actions": ["book_appointment", "send_whatsapp"],
            }
        }
    }

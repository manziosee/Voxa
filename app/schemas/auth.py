import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class CreateAPIKeyRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Production Key"])
    expires_at: datetime | None = Field(None, description="Leave null for no expiry")
    scopes: str = Field("*", description="Comma-separated scopes or * for all")


class APIKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    key_prefix: str
    is_active: bool
    last_used_at: datetime | None = None
    created_at: datetime
    expires_at: datetime | None = None
    scopes: str

    model_config = {"from_attributes": True}


class APIKeyCreateResponse(APIKeyResponse):
    raw_key: str = Field(..., description="Full API key — shown only once. Store it securely.")

from pydantic import BaseModel
from datetime import datetime
import uuid
from app.models.call import CallDirection, CallStatus, CallOutcome, EmotionDetected


class CallTranscriptOut(BaseModel):
    id: int
    speaker: str
    text: str
    language: str
    confidence: float | None
    emotion: str | None
    timestamp: datetime

    model_config = {"from_attributes": True}


class CallOut(BaseModel):
    id: uuid.UUID
    business_id: uuid.UUID
    customer_id: uuid.UUID | None
    twilio_call_sid: str | None
    caller_number: str
    direction: CallDirection
    status: CallStatus
    outcome: CallOutcome | None
    language_detected: str
    emotion_detected: EmotionDetected
    duration_seconds: int | None
    escalated: bool
    escalation_reason: str | None
    recording_url: str | None
    summary: str | None
    started_at: datetime
    ended_at: datetime | None
    transcripts: list[CallTranscriptOut] = []

    model_config = {"from_attributes": True}


class CallSummaryOut(BaseModel):
    id: uuid.UUID
    caller_number: str
    status: CallStatus
    outcome: CallOutcome | None
    duration_seconds: int | None
    language_detected: str
    escalated: bool
    started_at: datetime

    model_config = {"from_attributes": True}

import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, Float, ForeignKey, Enum as SAEnum, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.database import Base


class CallDirection(str, enum.Enum):
    inbound = "inbound"
    outbound = "outbound"


class CallStatus(str, enum.Enum):
    initiated = "initiated"
    ringing = "ringing"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"
    escalated = "escalated"
    missed = "missed"


class CallOutcome(str, enum.Enum):
    appointment_booked = "appointment_booked"
    information_provided = "information_provided"
    escalated_to_human = "escalated_to_human"
    callback_requested = "callback_requested"
    complaint_logged = "complaint_logged"
    unresolved = "unresolved"


class EmotionDetected(str, enum.Enum):
    neutral = "neutral"
    happy = "happy"
    frustrated = "frustrated"
    angry = "angry"
    confused = "confused"


class Call(Base):
    __tablename__ = "calls"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"))
    customer_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)

    twilio_call_sid: Mapped[str | None] = mapped_column(String(64), unique=True, nullable=True, index=True)
    caller_number: Mapped[str] = mapped_column(String(20), nullable=False)
    direction: Mapped[CallDirection] = mapped_column(SAEnum(CallDirection), default=CallDirection.inbound)
    status: Mapped[CallStatus] = mapped_column(SAEnum(CallStatus), default=CallStatus.initiated)
    outcome: Mapped[CallOutcome | None] = mapped_column(SAEnum(CallOutcome), nullable=True)
    language_detected: Mapped[str] = mapped_column(String(5), default="en")
    emotion_detected: Mapped[EmotionDetected] = mapped_column(SAEnum(EmotionDetected), default=EmotionDetected.neutral)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    escalated: Mapped[bool] = mapped_column(Boolean, default=False)
    escalation_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    # AI turn count before escalation
    turns_before_escalation: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Recording URL from Twilio
    recording_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    extra: Mapped[dict] = mapped_column(JSONB, default={})
    started_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    ended_at: Mapped[datetime | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    business: Mapped["Business"] = relationship("Business", back_populates="calls")
    customer: Mapped["Customer"] = relationship("Customer", back_populates="calls")
    transcripts: Mapped[list["CallTranscript"]] = relationship("CallTranscript", back_populates="call", cascade="all, delete-orphan")


class CallTranscript(Base):
    __tablename__ = "call_transcripts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    call_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("calls.id", ondelete="CASCADE"))
    speaker: Mapped[str] = mapped_column(String(10))  # "ai" or "customer"
    text: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(5), default="en")
    confidence: Mapped[float | None] = mapped_column(Float, nullable=True)
    emotion: Mapped[str | None] = mapped_column(String(20), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    call: Mapped["Call"] = relationship("Call", back_populates="transcripts")

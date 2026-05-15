import uuid
from datetime import datetime
from sqlalchemy import String, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.database import Base


class CustomerStatus(str, enum.Enum):
    active = "active"
    blocked = "blocked"
    vip = "vip"


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"))
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    whatsapp_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(5), default="en")
    status: Mapped[CustomerStatus] = mapped_column(SAEnum(CustomerStatus), default=CustomerStatus.active)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    # Stores preferences, complaints history, payment history
    metadata: Mapped[dict] = mapped_column(JSONB, default={})
    # CRM external reference
    crm_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    # Vector memory ID for AI recall
    memory_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    first_contact_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    last_contact_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    business: Mapped["Business"] = relationship("Business", back_populates="customers")
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="customer")
    calls: Mapped[list["Call"]] = relationship("Call", back_populates="customer")
    conversations: Mapped[list["Conversation"]] = relationship("Conversation", back_populates="customer")

import uuid
from datetime import datetime, time
from sqlalchemy import String, Boolean, Text, Integer, Time, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
import enum

from app.database import Base


class BusinessCategory(str, enum.Enum):
    clinic = "clinic"
    salon = "salon"
    hotel = "hotel"
    logistics = "logistics"
    sacco = "sacco"
    agriculture = "agriculture"
    restaurant = "restaurant"
    other = "other"


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[BusinessCategory] = mapped_column(SAEnum(BusinessCategory), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    whatsapp_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    country: Mapped[str] = mapped_column(String(5), default="RW")
    timezone: Mapped[str] = mapped_column(String(50), default="Africa/Kigali")
    preferred_language: Mapped[str] = mapped_column(String(5), default="en")
    supported_languages: Mapped[list] = mapped_column(JSONB, default=["en"])
    greeting_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    escalation_phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    # RAG knowledge base ID in vector store
    knowledge_base_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)

    hours: Mapped[list["BusinessHours"]] = relationship("BusinessHours", back_populates="business", cascade="all, delete-orphan")
    customers: Mapped[list["Customer"]] = relationship("Customer", back_populates="business")
    appointments: Mapped[list["Appointment"]] = relationship("Appointment", back_populates="business")
    calls: Mapped[list["Call"]] = relationship("Call", back_populates="business")


class BusinessHours(Base):
    __tablename__ = "business_hours"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    business_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"))
    # 0=Monday ... 6=Sunday
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    open_time: Mapped[time] = mapped_column(Time, nullable=False)
    close_time: Mapped[time] = mapped_column(Time, nullable=False)
    is_closed: Mapped[bool] = mapped_column(Boolean, default=False)

    business: Mapped["Business"] = relationship("Business", back_populates="hours")

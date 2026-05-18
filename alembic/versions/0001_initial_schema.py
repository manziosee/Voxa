"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-05-18
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # --- Enum types ---
    businesscategory = sa.Enum(
        "clinic", "salon", "hotel", "logistics", "sacco", "agriculture", "restaurant", "other",
        name="businesscategory",
    )
    customerstatus = sa.Enum("active", "blocked", "vip", name="customerstatus")
    calldirection = sa.Enum("inbound", "outbound", name="calldirection")
    callstatus = sa.Enum(
        "initiated", "ringing", "in_progress", "completed", "failed", "escalated", "missed",
        name="callstatus",
    )
    calloutcome = sa.Enum(
        "appointment_booked", "information_provided", "escalated_to_human",
        "callback_requested", "complaint_logged", "unresolved",
        name="calloutcome",
    )
    emotiondetected = sa.Enum(
        "neutral", "happy", "frustrated", "angry", "confused",
        name="emotiondetected",
    )
    appointmentstatus = sa.Enum(
        "scheduled", "confirmed", "cancelled", "completed", "no_show",
        name="appointmentstatus",
    )
    conversationchannel = sa.Enum("voice", "whatsapp", "sms", name="conversationchannel")
    messagerole = sa.Enum("user", "assistant", "system", name="messagerole")
    ticketstatus = sa.Enum("open", "in_progress", "resolved", "closed", name="ticketstatus")
    ticketpriority = sa.Enum("low", "medium", "high", "urgent", name="ticketpriority")
    webhookevent = sa.Enum(
        "call.completed", "call.escalated", "call.missed",
        "appointment.booked", "appointment.cancelled", "appointment.reminder",
        "ticket.created", "ticket.resolved", "customer.created",
        name="webhookevent",
    )

    # --- businesses ---
    op.create_table(
        "businesses",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("category", businesscategory, nullable=False),
        sa.Column("phone_number", sa.String(20), nullable=False, unique=True),
        sa.Column("whatsapp_number", sa.String(20), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("address", sa.Text, nullable=True),
        sa.Column("country", sa.String(5), nullable=False, server_default="RW"),
        sa.Column("timezone", sa.String(50), nullable=False, server_default="Africa/Kigali"),
        sa.Column("preferred_language", sa.String(5), nullable=False, server_default="en"),
        sa.Column("supported_languages", JSONB, nullable=False, server_default='["en"]'),
        sa.Column("greeting_message", sa.Text, nullable=True),
        sa.Column("escalation_phone", sa.String(20), nullable=True),
        sa.Column("knowledge_base_id", sa.String(255), nullable=True),
        sa.Column("extra", JSONB, nullable=False, server_default="{}"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )

    # --- business_hours ---
    op.create_table(
        "business_hours",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("business_id", UUID(as_uuid=True), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("day_of_week", sa.Integer, nullable=False),
        sa.Column("open_time", sa.Time, nullable=False),
        sa.Column("close_time", sa.Time, nullable=False),
        sa.Column("is_closed", sa.Boolean, nullable=False, server_default="false"),
    )

    # --- customers ---
    op.create_table(
        "customers",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("business_id", UUID(as_uuid=True), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("phone_number", sa.String(20), nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("whatsapp_number", sa.String(20), nullable=True),
        sa.Column("preferred_language", sa.String(5), nullable=False, server_default="en"),
        sa.Column("status", customerstatus, nullable=False, server_default="active"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("metadata", JSONB, nullable=False, server_default="{}"),
        sa.Column("crm_id", sa.String(255), nullable=True),
        sa.Column("memory_id", sa.String(255), nullable=True),
        sa.Column("first_contact_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("last_contact_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_customers_phone_number", "customers", ["phone_number"])

    # --- calls ---
    op.create_table(
        "calls",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("business_id", UUID(as_uuid=True), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_id", UUID(as_uuid=True), sa.ForeignKey("customers.id"), nullable=True),
        sa.Column("twilio_call_sid", sa.String(64), unique=True, nullable=True),
        sa.Column("caller_number", sa.String(20), nullable=False),
        sa.Column("direction", calldirection, nullable=False, server_default="inbound"),
        sa.Column("status", callstatus, nullable=False, server_default="initiated"),
        sa.Column("outcome", calloutcome, nullable=True),
        sa.Column("language_detected", sa.String(5), nullable=False, server_default="en"),
        sa.Column("emotion_detected", emotiondetected, nullable=False, server_default="neutral"),
        sa.Column("duration_seconds", sa.Integer, nullable=True),
        sa.Column("escalated", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("escalation_reason", sa.Text, nullable=True),
        sa.Column("turns_before_escalation", sa.Integer, nullable=True),
        sa.Column("recording_url", sa.Text, nullable=True),
        sa.Column("summary", sa.Text, nullable=True),
        sa.Column("extra", JSONB, nullable=False, server_default="{}"),
        sa.Column("started_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("ended_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_calls_twilio_call_sid", "calls", ["twilio_call_sid"])

    # --- call_transcripts ---
    op.create_table(
        "call_transcripts",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("call_id", UUID(as_uuid=True), sa.ForeignKey("calls.id", ondelete="CASCADE"), nullable=False),
        sa.Column("speaker", sa.String(10), nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("language", sa.String(5), nullable=False, server_default="en"),
        sa.Column("confidence", sa.Float, nullable=True),
        sa.Column("emotion", sa.String(20), nullable=True),
        sa.Column("timestamp", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )

    # --- appointments ---
    op.create_table(
        "appointments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("business_id", UUID(as_uuid=True), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_id", UUID(as_uuid=True), sa.ForeignKey("customers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("call_id", UUID(as_uuid=True), sa.ForeignKey("calls.id"), nullable=True),
        sa.Column("service_name", sa.String(255), nullable=False),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("duration_minutes", sa.Integer, nullable=False, server_default="30"),
        sa.Column("status", appointmentstatus, nullable=False, server_default="scheduled"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("reminder_sent", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("extra", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )

    # --- conversations ---
    op.create_table(
        "conversations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("business_id", UUID(as_uuid=True), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_id", UUID(as_uuid=True), sa.ForeignKey("customers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("call_id", UUID(as_uuid=True), sa.ForeignKey("calls.id"), nullable=True),
        sa.Column("channel", conversationchannel, nullable=False),
        sa.Column("language", sa.String(5), nullable=False, server_default="en"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("context", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )

    # --- messages ---
    op.create_table(
        "messages",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("conversation_id", UUID(as_uuid=True), sa.ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", messagerole, nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("language", sa.String(5), nullable=False, server_default="en"),
        sa.Column("extra", JSONB, nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )

    # --- api_keys ---
    op.create_table(
        "api_keys",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("business_id", UUID(as_uuid=True), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("key_hash", sa.String(64), unique=True, nullable=False),
        sa.Column("key_prefix", sa.String(12), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("last_used_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("expires_at", sa.DateTime, nullable=True),
        sa.Column("scopes", sa.Text, nullable=False, server_default="*"),
    )
    op.create_index("ix_api_keys_key_hash", "api_keys", ["key_hash"])

    # --- tickets ---
    op.create_table(
        "tickets",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("business_id", UUID(as_uuid=True), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("customer_id", UUID(as_uuid=True), sa.ForeignKey("customers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("call_id", UUID(as_uuid=True), sa.ForeignKey("calls.id", ondelete="SET NULL"), nullable=True),
        sa.Column("subject", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("status", ticketstatus, nullable=False, server_default="open"),
        sa.Column("priority", ticketpriority, nullable=False, server_default="medium"),
        sa.Column("resolution", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
        sa.Column("resolved_at", sa.DateTime, nullable=True),
    )

    # --- webhook_configs ---
    op.create_table(
        "webhook_configs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("business_id", UUID(as_uuid=True), sa.ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("url", sa.Text, nullable=False),
        sa.Column("secret", sa.String(255), nullable=True),
        sa.Column("events", JSONB, nullable=False, server_default="[]"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("last_triggered_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("webhook_configs")
    op.drop_table("tickets")
    op.drop_index("ix_api_keys_key_hash", table_name="api_keys")
    op.drop_table("api_keys")
    op.drop_table("messages")
    op.drop_table("conversations")
    op.drop_table("appointments")
    op.drop_table("call_transcripts")
    op.drop_index("ix_calls_twilio_call_sid", table_name="calls")
    op.drop_table("calls")
    op.drop_index("ix_customers_phone_number", table_name="customers")
    op.drop_table("customers")
    op.drop_table("business_hours")
    op.drop_table("businesses")

    for enum_name in [
        "webhookevent", "ticketpriority", "ticketstatus", "messagerole",
        "conversationchannel", "appointmentstatus", "emotiondetected",
        "calloutcome", "callstatus", "calldirection", "customerstatus", "businesscategory",
    ]:
        sa.Enum(name=enum_name).drop(op.get_bind(), checkfirst=True)

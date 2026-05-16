"""
Analytics & dashboard metrics for a business over a date range.
"""
import csv
import io
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, case

from app.api.deps import get_db
from app.models.business import Business
from app.models.call import Call, CallStatus, CallOutcome, EmotionDetected
from app.models.appointment import Appointment, AppointmentStatus
from app.models.customer import Customer
from app.models.conversation import Conversation, ConversationChannel
from app.schemas.analytics import (
    DashboardStats,
    CallStats,
    OutcomeBreakdown,
    LanguageBreakdown,
    EmotionBreakdown,
    AppointmentStats,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get(
    "/{business_id}/dashboard",
    response_model=DashboardStats,
    summary="Business dashboard",
    description=(
        "Returns aggregated metrics for a business over the requested period. "
        "Default period is the last 30 days."
    ),
)
async def get_dashboard(
    business_id: uuid.UUID,
    start: datetime = Query(
        default=None,
        description="Period start (ISO 8601). Defaults to 30 days ago.",
        examples=["2026-05-01T00:00:00"],
    ),
    end: datetime = Query(
        default=None,
        description="Period end (ISO 8601). Defaults to now.",
        examples=["2026-05-15T23:59:59"],
    ),
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    period_end = end or now
    period_start = start or (now - timedelta(days=30))

    # ── Calls ──────────────────────────────────────────────────────────────
    calls_q = await db.execute(
        select(Call).where(
            and_(
                Call.business_id == business_id,
                Call.started_at >= period_start,
                Call.started_at <= period_end,
            )
        )
    )
    calls = calls_q.scalars().all()

    total_calls = len(calls)
    completed = sum(1 for c in calls if c.status == CallStatus.completed)
    escalated = sum(1 for c in calls if c.escalated)
    missed = sum(1 for c in calls if c.status == CallStatus.missed)
    durations = [c.duration_seconds for c in calls if c.duration_seconds]
    total_dur = sum(durations)
    avg_dur = round(total_dur / len(durations), 1) if durations else 0.0
    escalation_rate = round((escalated / total_calls * 100), 2) if total_calls else 0.0

    call_stats = CallStats(
        total_calls=total_calls,
        completed=completed,
        escalated=escalated,
        missed=missed,
        escalation_rate_pct=escalation_rate,
        avg_duration_seconds=avg_dur,
        total_duration_seconds=total_dur,
    )

    # ── Outcomes ────────────────────────────────────────────────────────────
    outcomes = OutcomeBreakdown(
        appointment_booked=sum(1 for c in calls if c.outcome == CallOutcome.appointment_booked),
        information_provided=sum(1 for c in calls if c.outcome == CallOutcome.information_provided),
        escalated_to_human=sum(1 for c in calls if c.outcome == CallOutcome.escalated_to_human),
        callback_requested=sum(1 for c in calls if c.outcome == CallOutcome.callback_requested),
        complaint_logged=sum(1 for c in calls if c.outcome == CallOutcome.complaint_logged),
        unresolved=sum(1 for c in calls if c.outcome == CallOutcome.unresolved),
    )

    # ── Language breakdown ──────────────────────────────────────────────────
    lang_counts: dict[str, int] = {}
    for c in calls:
        lang_counts[c.language_detected] = lang_counts.get(c.language_detected, 0) + 1

    languages = LanguageBreakdown(
        en=lang_counts.get("en", 0),
        fr=lang_counts.get("fr", 0),
        sw=lang_counts.get("sw", 0),
        rw=lang_counts.get("rw", 0),
        other=sum(v for k, v in lang_counts.items() if k not in ("en", "fr", "sw", "rw")),
    )

    # ── Emotion breakdown ───────────────────────────────────────────────────
    emotions = EmotionBreakdown(
        neutral=sum(1 for c in calls if c.emotion_detected == EmotionDetected.neutral),
        happy=sum(1 for c in calls if c.emotion_detected == EmotionDetected.happy),
        frustrated=sum(1 for c in calls if c.emotion_detected == EmotionDetected.frustrated),
        angry=sum(1 for c in calls if c.emotion_detected == EmotionDetected.angry),
        confused=sum(1 for c in calls if c.emotion_detected == EmotionDetected.confused),
    )

    # ── Appointments ────────────────────────────────────────────────────────
    appts_q = await db.execute(
        select(Appointment).where(
            and_(
                Appointment.business_id == business_id,
                Appointment.created_at >= period_start,
                Appointment.created_at <= period_end,
            )
        )
    )
    appts = appts_q.scalars().all()

    total_booked = len(appts)
    appt_completed = sum(1 for a in appts if a.status == AppointmentStatus.completed)
    conversion = round((appt_completed / total_booked * 100), 2) if total_booked else 0.0

    appt_stats = AppointmentStats(
        total_booked=total_booked,
        confirmed=sum(1 for a in appts if a.status == AppointmentStatus.confirmed),
        cancelled=sum(1 for a in appts if a.status == AppointmentStatus.cancelled),
        no_show=sum(1 for a in appts if a.status == AppointmentStatus.no_show),
        completed=appt_completed,
        conversion_rate_pct=conversion,
        reminders_sent=sum(1 for a in appts if a.reminder_sent),
    )

    # ── WhatsApp conversations ──────────────────────────────────────────────
    wa_q = await db.execute(
        select(func.count(Conversation.id)).where(
            and_(
                Conversation.business_id == business_id,
                Conversation.channel == ConversationChannel.whatsapp,
                Conversation.created_at >= period_start,
                Conversation.created_at <= period_end,
            )
        )
    )
    wa_count = wa_q.scalar_one() or 0

    # ── Customer split ──────────────────────────────────────────────────────
    custs_q = await db.execute(
        select(Customer).where(
            and_(
                Customer.business_id == business_id,
                Customer.first_contact_at >= period_start,
                Customer.first_contact_at <= period_end,
            )
        )
    )
    new_customers = len(custs_q.scalars().all())

    returning_customers = max(0, total_calls - new_customers)

    return DashboardStats(
        business_id=str(business_id),
        period_start=period_start,
        period_end=period_end,
        calls=call_stats,
        outcomes=outcomes,
        languages=languages,
        emotions=emotions,
        appointments=appt_stats,
        whatsapp_conversations=wa_count,
        new_customers=new_customers,
        returning_customers=returning_customers,
    )


@router.get(
    "/{business_id}/calls/daily",
    summary="Daily call volume",
    description="Returns day-by-day call counts for the given period (max 90 days).",
    response_description="List of {date, count} objects",
)
async def daily_call_volume(
    business_id: uuid.UUID,
    start: datetime = Query(default=None),
    end: datetime = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    now = datetime.utcnow()
    period_end = end or now
    period_start = start or (now - timedelta(days=30))

    calls_q = await db.execute(
        select(Call.started_at).where(
            and_(
                Call.business_id == business_id,
                Call.started_at >= period_start,
                Call.started_at <= period_end,
            )
        )
    )
    timestamps = [row[0] for row in calls_q.all()]

    daily: dict[str, int] = {}
    for ts in timestamps:
        day = ts.strftime("%Y-%m-%d")
        daily[day] = daily.get(day, 0) + 1

    return {
        "business_id": str(business_id),
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
        "data": [{"date": d, "calls": c} for d, c in sorted(daily.items())],
    }


@router.get(
    "/{business_id}/export/calls",
    summary="Export calls CSV",
    description=(
        "Download a CSV file of all call records for the business in the given period. "
        "Includes call ID, date, caller, duration, outcome, emotion, language, escalated, and summary."
    ),
    response_class=StreamingResponse,
)
async def export_calls_csv(
    business_id: uuid.UUID,
    start: datetime = Query(default=None, description="Period start. Defaults to 30 days ago."),
    end: datetime = Query(default=None, description="Period end. Defaults to now."),
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    period_end = end or now
    period_start = start or (now - timedelta(days=30))

    calls_q = await db.execute(
        select(Call).where(
            and_(
                Call.business_id == business_id,
                Call.started_at >= period_start,
                Call.started_at <= period_end,
            )
        ).order_by(Call.started_at)
    )
    calls = calls_q.scalars().all()

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "id", "started_at", "ended_at", "caller_number", "direction",
        "status", "outcome", "duration_seconds", "language_detected",
        "emotion_detected", "escalated", "escalation_reason", "summary",
    ])
    writer.writeheader()
    for c in calls:
        writer.writerow({
            "id": str(c.id),
            "started_at": c.started_at.isoformat() if c.started_at else "",
            "ended_at": c.ended_at.isoformat() if c.ended_at else "",
            "caller_number": c.caller_number,
            "direction": c.direction.value if c.direction else "",
            "status": c.status.value if c.status else "",
            "outcome": c.outcome.value if c.outcome else "",
            "duration_seconds": c.duration_seconds or "",
            "language_detected": c.language_detected or "",
            "emotion_detected": c.emotion_detected.value if c.emotion_detected else "",
            "escalated": c.escalated,
            "escalation_reason": c.escalation_reason or "",
            "summary": (c.summary or "").replace("\n", " "),
        })

    output.seek(0)
    filename = f"voxa_calls_{business_id}_{period_start.date()}_{period_end.date()}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get(
    "/{business_id}/export/appointments",
    summary="Export appointments CSV",
    description="Download a CSV of all appointments in the given period.",
    response_class=StreamingResponse,
)
async def export_appointments_csv(
    business_id: uuid.UUID,
    start: datetime = Query(default=None),
    end: datetime = Query(default=None),
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    period_end = end or now
    period_start = start or (now - timedelta(days=30))

    appts_q = await db.execute(
        select(Appointment).where(
            and_(
                Appointment.business_id == business_id,
                Appointment.created_at >= period_start,
                Appointment.created_at <= period_end,
            )
        ).order_by(Appointment.scheduled_at)
    )
    appts = appts_q.scalars().all()

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "id", "customer_id", "service_name", "scheduled_at",
        "duration_minutes", "status", "reminder_sent", "notes",
    ])
    writer.writeheader()
    for a in appts:
        writer.writerow({
            "id": str(a.id),
            "customer_id": str(a.customer_id),
            "service_name": a.service_name,
            "scheduled_at": a.scheduled_at.isoformat() if a.scheduled_at else "",
            "duration_minutes": a.duration_minutes,
            "status": a.status.value if a.status else "",
            "reminder_sent": a.reminder_sent,
            "notes": (a.notes or "").replace("\n", " "),
        })

    output.seek(0)
    filename = f"voxa_appointments_{business_id}_{period_start.date()}_{period_end.date()}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

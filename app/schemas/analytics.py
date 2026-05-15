from pydantic import BaseModel, Field
from datetime import datetime


class CallStats(BaseModel):
    total_calls: int
    completed: int
    escalated: int
    missed: int
    escalation_rate_pct: float
    avg_duration_seconds: float
    total_duration_seconds: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_calls": 142,
                "completed": 128,
                "escalated": 9,
                "missed": 5,
                "escalation_rate_pct": 6.34,
                "avg_duration_seconds": 87.4,
                "total_duration_seconds": 12409,
            }
        }
    }


class OutcomeBreakdown(BaseModel):
    appointment_booked: int
    information_provided: int
    escalated_to_human: int
    callback_requested: int
    complaint_logged: int
    unresolved: int


class LanguageBreakdown(BaseModel):
    en: int = 0
    fr: int = 0
    sw: int = 0
    rw: int = 0
    other: int = 0


class EmotionBreakdown(BaseModel):
    neutral: int = 0
    happy: int = 0
    frustrated: int = 0
    angry: int = 0
    confused: int = 0


class AppointmentStats(BaseModel):
    total_booked: int
    confirmed: int
    cancelled: int
    no_show: int
    completed: int
    conversion_rate_pct: float
    reminders_sent: int


class DashboardStats(BaseModel):
    business_id: str
    period_start: datetime
    period_end: datetime
    calls: CallStats
    outcomes: OutcomeBreakdown
    languages: LanguageBreakdown
    emotions: EmotionBreakdown
    appointments: AppointmentStats
    whatsapp_conversations: int
    new_customers: int
    returning_customers: int

    model_config = {
        "json_schema_extra": {
            "example": {
                "business_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
                "period_start": "2026-05-01T00:00:00",
                "period_end": "2026-05-15T23:59:59",
                "calls": {
                    "total_calls": 142,
                    "completed": 128,
                    "escalated": 9,
                    "missed": 5,
                    "escalation_rate_pct": 6.34,
                    "avg_duration_seconds": 87.4,
                    "total_duration_seconds": 12409,
                },
                "outcomes": {
                    "appointment_booked": 67,
                    "information_provided": 44,
                    "escalated_to_human": 9,
                    "callback_requested": 12,
                    "complaint_logged": 4,
                    "unresolved": 6,
                },
                "languages": {"en": 78, "rw": 45, "fr": 15, "sw": 4, "other": 0},
                "emotions": {"neutral": 101, "happy": 23, "frustrated": 13, "angry": 5, "confused": 0},
                "appointments": {
                    "total_booked": 67,
                    "confirmed": 61,
                    "cancelled": 4,
                    "no_show": 2,
                    "completed": 55,
                    "conversion_rate_pct": 82.09,
                    "reminders_sent": 61,
                },
                "whatsapp_conversations": 89,
                "new_customers": 31,
                "returning_customers": 111,
            }
        }
    }

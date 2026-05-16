from fastapi import APIRouter
from app.api.v1 import (
    businesses, customers, appointments, calls,
    whatsapp, webhooks, analytics, outbound, utilities,
    auth, tickets, sms, webhook_configs, health,
)

api_router = APIRouter()

# Core business & customer management
api_router.include_router(businesses.router)
api_router.include_router(customers.router)
api_router.include_router(appointments.router)
api_router.include_router(calls.router)

# Communication channels
api_router.include_router(whatsapp.router)
api_router.include_router(sms.router)
api_router.include_router(webhooks.router)

# Support & CRM
api_router.include_router(tickets.router)
api_router.include_router(webhook_configs.router)

# Analytics & reporting
api_router.include_router(analytics.router)

# Outbound & utilities
api_router.include_router(outbound.router)
api_router.include_router(utilities.router)

# Auth & health
api_router.include_router(auth.router)
api_router.include_router(health.router)

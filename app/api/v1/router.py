from fastapi import APIRouter
from app.api.v1 import businesses, customers, appointments, calls, whatsapp, webhooks, analytics, outbound, utilities

api_router = APIRouter()

api_router.include_router(businesses.router)
api_router.include_router(customers.router)
api_router.include_router(appointments.router)
api_router.include_router(calls.router)
api_router.include_router(whatsapp.router)
api_router.include_router(webhooks.router)
api_router.include_router(analytics.router)
api_router.include_router(outbound.router)
api_router.include_router(utilities.router)

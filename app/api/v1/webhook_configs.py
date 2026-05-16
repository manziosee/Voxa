"""
Business webhook configuration — subscribe to Voxa events and forward them to
external CRMs (HubSpot, Salesforce, Zoho, custom endpoints).

Payloads are signed with HMAC-SHA256 when a secret is configured.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.models.business import Business
from app.models.webhook_config import WebhookConfig, WebhookEvent
from app.schemas.webhook_config import (
    CreateWebhookConfigRequest,
    UpdateWebhookConfigRequest,
    WebhookConfigResponse,
)

router = APIRouter(prefix="/webhook-configs", tags=["Webhook Configs"])


@router.post(
    "/businesses/{business_id}",
    response_model=WebhookConfigResponse,
    status_code=201,
    summary="Register webhook endpoint",
    description=(
        "Subscribe an external URL to Voxa events. Payloads are signed with "
        "`X-Voxa-Signature: sha256=<hmac>` when a secret is provided. "
        "Available events: " + ", ".join(f"`{e.value}`" for e in WebhookEvent)
    ),
)
async def create_webhook_config(
    business_id: uuid.UUID,
    payload: CreateWebhookConfigRequest,
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    config = WebhookConfig(
        business_id=business_id,
        name=payload.name,
        url=str(payload.url),
        secret=payload.secret,
        events=[e.value for e in payload.events],
    )
    db.add(config)
    await db.commit()
    await db.refresh(config)
    return config


@router.get(
    "/businesses/{business_id}",
    response_model=list[WebhookConfigResponse],
    summary="List webhook endpoints",
)
async def list_webhook_configs(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    result = await db.execute(select(WebhookConfig).where(WebhookConfig.business_id == business_id))
    return result.scalars().all()


@router.patch(
    "/{config_id}",
    response_model=WebhookConfigResponse,
    summary="Update webhook endpoint",
)
async def update_webhook_config(
    config_id: uuid.UUID,
    payload: UpdateWebhookConfigRequest,
    db: AsyncSession = Depends(get_db),
):
    config = await db.get(WebhookConfig, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Webhook config not found")

    if payload.name is not None:
        config.name = payload.name
    if payload.url is not None:
        config.url = str(payload.url)
    if payload.secret is not None:
        config.secret = payload.secret
    if payload.events is not None:
        config.events = [e.value for e in payload.events]
    if payload.is_active is not None:
        config.is_active = payload.is_active

    await db.commit()
    await db.refresh(config)
    return config


@router.delete(
    "/{config_id}",
    status_code=204,
    summary="Delete webhook endpoint",
)
async def delete_webhook_config(
    config_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    config = await db.get(WebhookConfig, config_id)
    if not config:
        raise HTTPException(status_code=404, detail="Webhook config not found")

    await db.delete(config)
    await db.commit()

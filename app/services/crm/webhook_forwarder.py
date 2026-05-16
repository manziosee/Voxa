"""
Forwards Voxa events to external CRM/webhook endpoints registered by the business.

Each event delivery is signed with HMAC-SHA256 if the config has a secret,
allowing the receiver to verify the payload originated from Voxa.
"""
import hashlib
import hmac
import json
from datetime import datetime

import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.webhook_config import WebhookConfig, WebhookEvent


class WebhookForwarder:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def dispatch(self, business_id, event: WebhookEvent, payload: dict) -> None:
        """Fire-and-forget delivery to all active endpoint subscriptions for this event."""
        result = await self.db.execute(
            select(WebhookConfig).where(
                WebhookConfig.business_id == business_id,
                WebhookConfig.is_active == True,
            )
        )
        configs = result.scalars().all()

        body = json.dumps({
            "event": event.value,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": payload,
        })

        for config in configs:
            if event.value not in config.events:
                continue
            headers = {"Content-Type": "application/json", "X-Voxa-Event": event.value}
            if config.secret:
                sig = hmac.new(config.secret.encode(), body.encode(), hashlib.sha256).hexdigest()
                headers["X-Voxa-Signature"] = f"sha256={sig}"

            try:
                async with httpx.AsyncClient(timeout=10) as client:
                    await client.post(config.url, content=body, headers=headers)
                config.last_triggered_at = datetime.utcnow()
            except Exception:
                pass

        await self.db.commit()

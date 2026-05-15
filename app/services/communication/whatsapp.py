"""
WhatsApp integration supporting:
  - WhatsApp Business API (Meta) for sending messages
  - Twilio WhatsApp sandbox for development
"""
import httpx
from app.config import get_settings

settings = get_settings()


class WhatsAppService:

    async def send_message(self, to: str, body: str) -> bool:
        """Send a plain-text WhatsApp message."""
        if settings.whatsapp_api_token and settings.whatsapp_phone_number_id:
            return await self._send_via_meta(to, body)
        return await self._send_via_twilio(to, body)

    async def send_appointment_confirmation(
        self,
        to: str,
        customer_name: str,
        service: str,
        scheduled_at: str,
        business_name: str,
        language: str = "en",
    ) -> bool:
        message = self._build_confirmation_message(
            customer_name, service, scheduled_at, business_name, language
        )
        return await self.send_message(to, message)

    async def send_appointment_reminder(
        self,
        to: str,
        customer_name: str,
        service: str,
        scheduled_at: str,
        business_name: str,
        language: str = "en",
    ) -> bool:
        message = self._build_reminder_message(
            customer_name, service, scheduled_at, business_name, language
        )
        return await self.send_message(to, message)

    async def _send_via_meta(self, to: str, body: str) -> bool:
        url = f"https://graph.facebook.com/v20.0/{settings.whatsapp_phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {settings.whatsapp_api_token}",
            "Content-Type": "application/json",
        }
        payload = {
            "messaging_product": "whatsapp",
            "to": to.replace("whatsapp:", "").replace("+", ""),
            "type": "text",
            "text": {"body": body},
        }
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, headers=headers, json=payload)
            return resp.status_code == 200

    async def _send_via_twilio(self, to: str, body: str) -> bool:
        from twilio.rest import Client

        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        to_wa = to if to.startswith("whatsapp:") else f"whatsapp:{to}"
        try:
            client.messages.create(
                from_=settings.twilio_whatsapp_number,
                to=to_wa,
                body=body,
            )
            return True
        except Exception:
            return False

    def _build_confirmation_message(
        self, name: str, service: str, at: str, business: str, lang: str
    ) -> str:
        templates = {
            "en": f"Hi {name}! Your appointment for *{service}* at *{business}* is confirmed for {at}. Reply CANCEL to cancel.",
            "fr": f"Bonjour {name}! Votre rendez-vous pour *{service}* chez *{business}* est confirmé pour le {at}. Répondez ANNULER pour annuler.",
            "sw": f"Habari {name}! Miadi yako ya *{service}* kwa *{business}* imethibitishwa kwa {at}. Jibu GHAIRI kuondoa.",
            "rw": f"Muraho {name}! Rendez-vous yawe ya *{service}* kuri *{business}* yemejwe ku {at}. Subiza GUHAGARIKA kuyihagarika.",
        }
        return templates.get(lang, templates["en"])

    def _build_reminder_message(
        self, name: str, service: str, at: str, business: str, lang: str
    ) -> str:
        templates = {
            "en": f"Reminder: Hi {name}, your appointment for *{service}* at *{business}* is tomorrow at {at}. See you soon!",
            "fr": f"Rappel: Bonjour {name}, votre rendez-vous pour *{service}* chez *{business}* est demain à {at}.",
            "sw": f"Ukumbusho: Habari {name}, miadi yako ya *{service}* kwa *{business}* ni kesho saa {at}.",
            "rw": f"Ibutso: Muraho {name}, rendez-vous yawe ya *{service}* kuri *{business}* ni ejo saa {at}.",
        }
        return templates.get(lang, templates["en"])

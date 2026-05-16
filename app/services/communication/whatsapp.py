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

    async def send_interactive_buttons(
        self,
        to: str,
        body_text: str,
        buttons: list[dict],
        header: str | None = None,
        footer: str | None = None,
    ) -> bool:
        """
        Send a WhatsApp interactive message with up to 3 quick-reply buttons.

        buttons format: [{"id": "confirm", "title": "Confirm"}, ...]
        Only supported via Meta Cloud API (not Twilio sandbox).
        """
        if not settings.whatsapp_api_token or not settings.whatsapp_phone_number_id:
            return False

        payload: dict = {
            "messaging_product": "whatsapp",
            "to": to.replace("whatsapp:", "").replace("+", ""),
            "type": "interactive",
            "interactive": {
                "type": "button",
                "body": {"text": body_text},
                "action": {
                    "buttons": [
                        {"type": "reply", "reply": {"id": b["id"], "title": b["title"][:20]}}
                        for b in buttons[:3]
                    ]
                },
            },
        }
        if header:
            payload["interactive"]["header"] = {"type": "text", "text": header}
        if footer:
            payload["interactive"]["footer"] = {"text": footer}

        url = f"https://graph.facebook.com/v20.0/{settings.whatsapp_phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {settings.whatsapp_api_token}",
            "Content-Type": "application/json",
        }
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(url, headers=headers, json=payload)
            return resp.status_code == 200

    async def send_appointment_buttons(
        self,
        to: str,
        customer_name: str,
        service: str,
        scheduled_at: str,
        business_name: str,
        language: str = "en",
    ) -> bool:
        """Send appointment confirmation with Confirm / Reschedule / Cancel buttons."""
        labels = {
            "en": {
                "body": f"Hi {customer_name}! You have a *{service}* appointment at *{business_name}* on {scheduled_at}.",
                "confirm": "Confirm",
                "reschedule": "Reschedule",
                "cancel": "Cancel",
                "footer": "Reply or tap a button",
            },
            "fr": {
                "body": f"Bonjour {customer_name}! Rendez-vous *{service}* chez *{business_name}* le {scheduled_at}.",
                "confirm": "Confirmer",
                "reschedule": "Reporter",
                "cancel": "Annuler",
                "footer": "Appuyez sur un bouton",
            },
            "sw": {
                "body": f"Habari {customer_name}! Miadi ya *{service}* kwa *{business_name}* tarehe {scheduled_at}.",
                "confirm": "Thibitisha",
                "reschedule": "Badilisha",
                "cancel": "Ghairi",
                "footer": "Bonyeza kitufe",
            },
            "rw": {
                "body": f"Muraho {customer_name}! Rendez-vous ya *{service}* kuri *{business_name}* ku {scheduled_at}.",
                "confirm": "Emeza",
                "reschedule": "Hindura",
                "cancel": "Hagarika",
                "footer": "Kanda buto",
            },
        }
        l = labels.get(language, labels["en"])
        buttons = [
            {"id": "appt_confirm", "title": l["confirm"]},
            {"id": "appt_reschedule", "title": l["reschedule"]},
            {"id": "appt_cancel", "title": l["cancel"]},
        ]
        return await self.send_interactive_buttons(
            to=to,
            body_text=l["body"],
            buttons=buttons,
            footer=l["footer"],
        )

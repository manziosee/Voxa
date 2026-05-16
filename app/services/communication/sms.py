"""
SMS channel via Twilio Programmable SMS.

Supports sending transactional messages (appointment reminders, confirmations)
and receiving inbound SMS processed by the AI agent.
"""
from twilio.rest import Client

from app.config import get_settings

settings = get_settings()


class SMSService:

    def _client(self) -> Client:
        return Client(settings.twilio_account_sid, settings.twilio_auth_token)

    async def send_message(self, to: str, body: str) -> bool:
        try:
            self._client().messages.create(
                from_=settings.twilio_phone_number,
                to=to,
                body=body,
            )
            return True
        except Exception:
            return False

    async def send_appointment_confirmation(
        self,
        to: str,
        customer_name: str,
        service: str,
        scheduled_at: str,
        business_name: str,
        language: str = "en",
    ) -> bool:
        body = self._confirmation_text(customer_name, service, scheduled_at, business_name, language)
        return await self.send_message(to, body)

    async def send_appointment_reminder(
        self,
        to: str,
        customer_name: str,
        service: str,
        scheduled_at: str,
        business_name: str,
        language: str = "en",
    ) -> bool:
        body = self._reminder_text(customer_name, service, scheduled_at, business_name, language)
        return await self.send_message(to, body)

    def _confirmation_text(self, name: str, service: str, at: str, business: str, lang: str) -> str:
        templates = {
            "en": f"Hi {name}, your {service} at {business} is confirmed for {at}. Reply CANCEL to cancel.",
            "fr": f"Bonjour {name}, votre {service} chez {business} est confirme pour le {at}. Repondez ANNULER.",
            "sw": f"Habari {name}, miadi yako ya {service} kwa {business} imethibitishwa kwa {at}. Jibu GHAIRI.",
            "rw": f"Muraho {name}, rendez-vous yawe ya {service} kuri {business} yemejwe ku {at}.",
        }
        return templates.get(lang, templates["en"])

    def _reminder_text(self, name: str, service: str, at: str, business: str, lang: str) -> str:
        templates = {
            "en": f"Reminder: Hi {name}, your {service} at {business} is tomorrow at {at}.",
            "fr": f"Rappel: {name}, votre {service} chez {business} est demain a {at}.",
            "sw": f"Ukumbusho: {name}, miadi yako ya {service} kwa {business} ni kesho saa {at}.",
            "rw": f"Ibutso: {name}, rendez-vous yawe ya {service} kuri {business} ni ejo saa {at}.",
        }
        return templates.get(lang, templates["en"])

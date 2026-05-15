"""
Twilio service: handles inbound call TwiML generation, transfers, recordings,
and outbound call initiation.
"""
import uuid
from twilio.twiml.voice_response import VoiceResponse, Gather, Play, Say
from twilio.rest import Client
from app.config import get_settings

settings = get_settings()


class TwilioService:

    def __init__(self):
        self.client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        self.from_number = settings.twilio_phone_number

    def build_greeting_twiml(
        self,
        call_id: uuid.UUID,
        business_name: str,
        greeting_message: str,
        language: str = "en",
        base_url: str = "",
    ) -> str:
        """Build TwiML for the opening of a call."""
        response = VoiceResponse()
        response.say(greeting_message, language=self._twiml_language(language), voice="Polly.Joanna")
        gather = Gather(
            input="speech",
            action=f"{base_url}/api/v1/webhooks/twilio/speech?call_id={call_id}",
            method="POST",
            speech_timeout="auto",
            language=self._twiml_language(language),
        )
        response.append(gather)
        # If no input received
        response.say("I didn't hear anything. Goodbye!", language=self._twiml_language(language))
        response.hangup()
        return str(response)

    def build_response_twiml(
        self,
        call_id: uuid.UUID,
        ai_reply: str,
        language: str = "en",
        base_url: str = "",
        is_final: bool = False,
    ) -> str:
        """Build TwiML after AI has generated a reply."""
        response = VoiceResponse()
        response.say(ai_reply, language=self._twiml_language(language), voice="Polly.Joanna")
        if not is_final:
            gather = Gather(
                input="speech",
                action=f"{base_url}/api/v1/webhooks/twilio/speech?call_id={call_id}",
                method="POST",
                speech_timeout="auto",
                language=self._twiml_language(language),
            )
            response.append(gather)
        response.hangup()
        return str(response)

    def build_escalation_twiml(self, escalation_phone: str, hold_message: str = "Please hold while I transfer you.") -> str:
        """TwiML to transfer a call to a human agent."""
        response = VoiceResponse()
        response.say(hold_message)
        response.dial(escalation_phone)
        return str(response)

    async def initiate_outbound_call(
        self,
        to: str,
        twiml_url: str,
        status_callback_url: str | None = None,
    ) -> str:
        call = self.client.calls.create(
            to=to,
            from_=self.from_number,
            url=twiml_url,
            status_callback=status_callback_url,
            status_callback_method="POST",
        )
        return call.sid

    def _twiml_language(self, lang: str) -> str:
        mapping = {
            "en": "en-US",
            "fr": "fr-FR",
            "sw": "sw-KE",
            "rw": "rw-RW",
        }
        return mapping.get(lang, "en-US")

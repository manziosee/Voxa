import asyncio
from dataclasses import dataclass
from app.config import get_settings

settings = get_settings()

# Fallback voice IDs per language when ElevenLabs IDs are not configured
_OPENAI_VOICE_MAP = {
    "en": "nova",
    "fr": "nova",
    "sw": "nova",
    "rw": "nova",
}


@dataclass
class SynthesisResult:
    audio_bytes: bytes
    content_type: str
    duration_estimate_ms: int


class TextToSpeechService:
    """Supports ElevenLabs (primary) and OpenAI TTS (fallback)."""

    def __init__(self):
        self.provider = settings.tts_provider

    async def synthesize(self, text: str, language: str = "en") -> SynthesisResult:
        if self.provider == "elevenlabs":
            return await self._synthesize_elevenlabs(text, language)
        return await self._synthesize_openai(text, language)

    async def _synthesize_elevenlabs(self, text: str, language: str) -> SynthesisResult:
        from elevenlabs.client import ElevenLabs
        from elevenlabs import VoiceSettings

        voice_id = settings.elevenlabs_voice_ids.get(language) or settings.elevenlabs_voice_id_en
        if not voice_id:
            # Fallback to OpenAI if ElevenLabs not configured
            return await self._synthesize_openai(text, language)

        client = ElevenLabs(api_key=settings.elevenlabs_api_key)
        audio_generator = await asyncio.to_thread(
            client.generate,
            text=text,
            voice=voice_id,
            voice_settings=VoiceSettings(stability=0.5, similarity_boost=0.75),
            model="eleven_multilingual_v2",
        )
        audio_bytes = b"".join(audio_generator)
        return SynthesisResult(
            audio_bytes=audio_bytes,
            content_type="audio/mpeg",
            duration_estimate_ms=int(len(text) / 15 * 1000),
        )

    async def _synthesize_openai(self, text: str, language: str) -> SynthesisResult:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        voice = _OPENAI_VOICE_MAP.get(language, "nova")
        response = await client.audio.speech.create(
            model="tts-1",
            voice=voice,
            input=text,
            response_format="mp3",
        )
        audio_bytes = response.content
        return SynthesisResult(
            audio_bytes=audio_bytes,
            content_type="audio/mpeg",
            duration_estimate_ms=int(len(text) / 15 * 1000),
        )

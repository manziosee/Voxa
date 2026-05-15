import io
import asyncio
from dataclasses import dataclass
from langdetect import detect
from app.config import get_settings

settings = get_settings()


@dataclass
class TranscriptionResult:
    text: str
    language: str
    confidence: float
    words: list[dict]


class SpeechToTextService:
    """Supports Deepgram (primary) and OpenAI Whisper (fallback)."""

    def __init__(self):
        self.provider = settings.stt_provider

    async def transcribe(self, audio_bytes: bytes, language_hint: str | None = None) -> TranscriptionResult:
        if self.provider == "deepgram":
            return await self._transcribe_deepgram(audio_bytes, language_hint)
        return await self._transcribe_whisper(audio_bytes, language_hint)

    async def _transcribe_deepgram(self, audio_bytes: bytes, language_hint: str | None) -> TranscriptionResult:
        from deepgram import DeepgramClient, PrerecordedOptions

        client = DeepgramClient(settings.deepgram_api_key)
        options = PrerecordedOptions(
            model="nova-2",
            smart_format=True,
            language=language_hint or "en",
            detect_language=True,
            punctuate=True,
            diarize=False,
        )
        source = {"buffer": audio_bytes, "mimetype": "audio/wav"}
        response = await asyncio.to_thread(
            client.listen.prerecorded.v("1").transcribe_file,
            source,
            options,
        )
        result = response.results.channels[0].alternatives[0]
        detected_lang = response.results.channels[0].detected_language or language_hint or "en"
        return TranscriptionResult(
            text=result.transcript,
            language=detected_lang,
            confidence=result.confidence,
            words=[{"word": w.word, "start": w.start, "end": w.end} for w in result.words],
        )

    async def _transcribe_whisper(self, audio_bytes: bytes, language_hint: str | None) -> TranscriptionResult:
        import whisper

        model = await asyncio.to_thread(whisper.load_model, settings.whisper_model)
        audio_file = io.BytesIO(audio_bytes)
        result = await asyncio.to_thread(
            model.transcribe,
            audio_file,
            language=language_hint,
            task="transcribe",
            fp16=False,
        )
        text = result["text"].strip()
        detected_lang = result.get("language") or language_hint or self._detect_language(text)
        return TranscriptionResult(
            text=text,
            language=detected_lang,
            confidence=1.0,
            words=[],
        )

    def _detect_language(self, text: str) -> str:
        try:
            lang = detect(text)
            # Map langdetect codes to our supported codes
            mapping = {"sw": "sw", "rw": "rw", "fr": "fr", "en": "en"}
            return mapping.get(lang, "en")
        except Exception:
            return "en"

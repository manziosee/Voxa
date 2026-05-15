"""
End-to-end voice AI pipeline: audio → STT → AI agent → TTS → audio.
Used by Twilio webhook handlers for real-time call processing.
"""
import uuid
from dataclasses import dataclass

from app.services.voice.stt import SpeechToTextService, TranscriptionResult
from app.services.voice.tts import TextToSpeechService, SynthesisResult
from app.config import get_settings

settings = get_settings()


@dataclass
class PipelineResult:
    transcription: TranscriptionResult
    ai_response: str
    audio: SynthesisResult
    language: str
    emotion: str
    should_escalate: bool
    escalation_reason: str | None
    suggested_actions: list[str]


class VoicePipeline:
    """
    Orchestrates the full voice loop per turn:
      1. STT: convert caller audio to text
      2. AI agent: generate response (with memory + RAG)
      3. Emotion detection: decide escalation
      4. TTS: convert response to audio
    """

    def __init__(self):
        self.stt = SpeechToTextService()
        self.tts = TextToSpeechService()

    async def process_turn(
        self,
        audio_bytes: bytes,
        business_id: uuid.UUID,
        conversation_id: uuid.UUID,
        turn_count: int,
        language_hint: str | None = None,
    ) -> PipelineResult:
        from app.services.ai.agent import VoxaAgent
        from app.services.ai.emotion import detect_emotion

        # Step 1: transcribe caller audio
        transcription = await self.stt.transcribe(audio_bytes, language_hint)
        language = transcription.language

        # Step 2: run AI agent
        agent = VoxaAgent(business_id=business_id, conversation_id=conversation_id)
        agent_result = await agent.respond(
            user_message=transcription.text,
            language=language,
        )

        # Step 3: emotion & escalation check
        emotion = detect_emotion(transcription.text)
        should_escalate = self._should_escalate(emotion, turn_count, agent_result.escalate)

        # Step 4: TTS
        audio = await self.tts.synthesize(agent_result.reply, language)

        return PipelineResult(
            transcription=transcription,
            ai_response=agent_result.reply,
            audio=audio,
            language=language,
            emotion=emotion,
            should_escalate=should_escalate,
            escalation_reason=agent_result.escalation_reason,
            suggested_actions=agent_result.suggested_actions,
        )

    def _should_escalate(self, emotion: str, turn_count: int, agent_wants_escalation: bool) -> bool:
        if agent_wants_escalation:
            return True
        if emotion in ("angry", "frustrated") and turn_count >= settings.escalation_threshold:
            return True
        return False

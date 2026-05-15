from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache
from typing import Literal


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_name: str = "Voxa AI Voice Agent"
    app_env: Literal["development", "staging", "production"] = "development"
    debug: bool = True
    secret_key: str = "change-me-in-production"
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "postgresql+asyncpg://voxa:voxa_pass@localhost:5432/voxa_db"
    redis_url: str = "redis://localhost:6379/0"

    # Twilio
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""
    twilio_whatsapp_number: str = "whatsapp:+14155238886"

    # WhatsApp Business API
    whatsapp_api_token: str = ""
    whatsapp_phone_number_id: str = ""
    whatsapp_verify_token: str = ""

    # AI / LLM
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    llm_provider: Literal["openai", "anthropic"] = "openai"
    llm_model: str = "gpt-4o"

    # Speech-to-Text
    stt_provider: Literal["deepgram", "whisper"] = "deepgram"
    deepgram_api_key: str = ""
    whisper_model: str = "base"

    # Text-to-Speech
    tts_provider: Literal["elevenlabs", "openai"] = "elevenlabs"
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id_en: str = ""
    elevenlabs_voice_id_fr: str = ""
    elevenlabs_voice_id_sw: str = ""
    elevenlabs_voice_id_rw: str = ""

    # Vector DB
    pinecone_api_key: str = ""
    pinecone_env: str = ""
    pinecone_index: str = "voxa-knowledge"
    chroma_host: str = "localhost"
    chroma_port: int = 8001

    # Supported languages
    supported_languages: str = "en,fr,sw,rw"

    # Call settings
    max_call_duration_seconds: int = 1800
    silence_timeout_seconds: int = 5
    escalation_threshold: int = 3

    # Booking
    default_appointment_duration_minutes: int = 30
    booking_advance_days: int = 30

    @property
    def languages(self) -> list[str]:
        return [lang.strip() for lang in self.supported_languages.split(",")]

    @property
    def elevenlabs_voice_ids(self) -> dict[str, str]:
        return {
            "en": self.elevenlabs_voice_id_en,
            "fr": self.elevenlabs_voice_id_fr,
            "sw": self.elevenlabs_voice_id_sw,
            "rw": self.elevenlabs_voice_id_rw,
        }


@lru_cache
def get_settings() -> Settings:
    return Settings()

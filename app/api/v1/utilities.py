"""
Utility endpoints:
  - Knowledge base management (bulk upload, delete)
  - Language detection
  - TTS preview
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.models.business import Business
from app.services.ai.rag import RAGService
from app.services.voice.tts import TextToSpeechService
from fastapi.responses import Response

router = APIRouter(prefix="/utils", tags=["Utilities"])


# ── Schemas ────────────────────────────────────────────────────────────────


class KnowledgeDocIn(BaseModel):
    doc_id: str = Field(..., examples=["faq-001"])
    content: str = Field(
        ...,
        examples=["We are open Monday to Saturday from 8am to 6pm. Closed on public holidays."],
    )
    metadata: dict = Field(default={}, examples=[{"category": "hours", "language": "en"}])


class KnowledgeBulkIn(BaseModel):
    documents: list[KnowledgeDocIn]

    model_config = {
        "json_schema_extra": {
            "example": {
                "documents": [
                    {
                        "doc_id": "faq-001",
                        "content": "We are open Monday to Saturday from 8am to 6pm.",
                        "metadata": {"category": "hours"},
                    },
                    {
                        "doc_id": "faq-002",
                        "content": "We accept cash, MoMo, and bank transfers.",
                        "metadata": {"category": "payments"},
                    },
                ]
            }
        }
    }


class LanguageDetectIn(BaseModel):
    text: str = Field(..., examples=["Muraho, ndashaka gufata nimero yo kwa muganga"])

    model_config = {
        "json_schema_extra": {
            "example": {"text": "Muraho, ndashaka gufata nimero yo kwa muganga"}
        }
    }


class LanguageDetectOut(BaseModel):
    text: str
    detected_language: str
    language_name: str
    confidence: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "text": "Muraho, ndashaka gufata nimero yo kwa muganga",
                "detected_language": "rw",
                "language_name": "Kinyarwanda",
                "confidence": "high",
            }
        }
    }


_LANG_NAMES = {"en": "English", "fr": "French", "sw": "Swahili", "rw": "Kinyarwanda"}

# Simple keyword hints for Kinyarwanda and Swahili that langdetect often misses
_LANG_HINTS = {
    "rw": ["muraho", "amakuru", "ndashaka", "murakoze", "nimero", "muganga", "isoko", "neza"],
    "sw": ["habari", "asante", "karibu", "nataka", "rafiki", "sawa", "duka"],
}


def _detect_with_hints(text: str) -> tuple[str, str]:
    text_lower = text.lower()
    for lang, keywords in _LANG_HINTS.items():
        if any(kw in text_lower for kw in keywords):
            return lang, "high"
    try:
        from langdetect import detect, detect_langs
        langs = detect_langs(text)
        top = langs[0]
        code = top.lang[:2]
        confidence = "high" if top.prob > 0.85 else "medium" if top.prob > 0.5 else "low"
        return code, confidence
    except Exception:
        return "en", "low"


# ── Routes ─────────────────────────────────────────────────────────────────


@router.post(
    "/knowledge/{business_id}/bulk",
    status_code=201,
    summary="Bulk-upload knowledge base documents",
    description=(
        "Index multiple documents into the business's knowledge base in a single request. "
        "The AI agent will retrieve relevant documents when answering calls and messages."
    ),
)
async def bulk_upload_knowledge(
    business_id: uuid.UUID,
    payload: KnowledgeBulkIn,
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    rag = RAGService()
    indexed = []
    for doc in payload.documents:
        await rag.index_document(
            business_id=business_id,
            document_id=doc.doc_id,
            content=doc.content,
            metadata=doc.metadata,
        )
        indexed.append(doc.doc_id)

    return {"indexed": indexed, "count": len(indexed)}


@router.post(
    "/knowledge/{business_id}/upload-file",
    status_code=201,
    summary="Upload a .txt knowledge file",
    description="Upload a plain-text file. Each non-empty line becomes a separate document chunk.",
)
async def upload_knowledge_file(
    business_id: uuid.UUID,
    file: UploadFile = File(..., description="Plain text file (.txt)"),
    category: str = Form("general"),
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    if not file.filename.endswith(".txt"):
        raise HTTPException(status_code=422, detail="Only .txt files are supported")

    content = await file.read()
    lines = [ln.strip() for ln in content.decode("utf-8").splitlines() if ln.strip()]

    rag = RAGService()
    indexed = []
    for i, line in enumerate(lines):
        doc_id = f"{file.filename}-chunk-{i}"
        await rag.index_document(
            business_id=business_id,
            document_id=doc_id,
            content=line,
            metadata={"source": file.filename, "category": category, "chunk": i},
        )
        indexed.append(doc_id)

    return {"file": file.filename, "chunks_indexed": len(indexed)}


@router.delete(
    "/knowledge/{business_id}/{doc_id}",
    status_code=204,
    summary="Delete a knowledge document",
)
async def delete_knowledge_doc(
    business_id: uuid.UUID,
    doc_id: str,
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    rag = RAGService()
    await rag.delete_document(business_id, doc_id)


@router.post(
    "/detect-language",
    response_model=LanguageDetectOut,
    summary="Detect language of text",
    description=(
        "Detects the language of the input text. "
        "Uses keyword hinting for Kinyarwanda and Swahili before falling back to langdetect."
    ),
)
async def detect_language(payload: LanguageDetectIn):
    lang, confidence = _detect_with_hints(payload.text)
    return LanguageDetectOut(
        text=payload.text,
        detected_language=lang,
        language_name=_LANG_NAMES.get(lang, lang.upper()),
        confidence=confidence,
    )


@router.post(
    "/tts-preview",
    summary="Preview text-to-speech",
    description=(
        "Synthesize text to audio and return the MP3 bytes. "
        "Use this to preview how the AI will sound in a given language."
    ),
    response_class=Response,
    responses={
        200: {
            "content": {"audio/mpeg": {}},
            "description": "MP3 audio of the synthesized speech",
        }
    },
)
async def tts_preview(
    text: str = Form(..., examples=["Muraho! Mwakire kuri Kigali Clinic."]),
    language: str = Form("en", examples=["rw"]),
):
    tts = TextToSpeechService()
    result = await tts.synthesize(text, language)
    return Response(content=result.audio_bytes, media_type=result.content_type)

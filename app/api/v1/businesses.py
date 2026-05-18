import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.models.business import Business, BusinessHours
from app.schemas.business import BusinessCreate, BusinessUpdate, BusinessOut
from app.services.ai.rag import RAGService
from app.services.voice.ivr import get_default_menu, IVRMenu, IVROption

router = APIRouter(prefix="/businesses", tags=["Businesses"])


@router.post("/", response_model=BusinessOut, status_code=status.HTTP_201_CREATED)
async def create_business(payload: BusinessCreate, db: AsyncSession = Depends(get_db)):
    business = Business(
        name=payload.name,
        category=payload.category,
        phone_number=payload.phone_number,
        whatsapp_number=payload.whatsapp_number,
        email=payload.email,
        address=payload.address,
        country=payload.country,
        timezone=payload.timezone,
        preferred_language=payload.preferred_language,
        supported_languages=payload.supported_languages,
        greeting_message=payload.greeting_message,
        escalation_phone=payload.escalation_phone,
    )
    db.add(business)
    await db.flush()

    for h in payload.hours:
        db.add(BusinessHours(business_id=business.id, **h.model_dump()))

    await db.commit()
    await db.refresh(business)
    return business


@router.get("/", response_model=list[BusinessOut])
async def list_businesses(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Business).where(Business.is_active == True))
    return result.scalars().all()


@router.get("/{business_id}", response_model=BusinessOut)
async def get_business(business_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business


@router.patch("/{business_id}", response_model=BusinessOut)
async def update_business(
    business_id: uuid.UUID,
    payload: BusinessUpdate,
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(business, field, value)
    await db.commit()
    await db.refresh(business)
    return business


@router.post("/{business_id}/knowledge", status_code=status.HTTP_201_CREATED)
async def upload_knowledge(
    business_id: uuid.UUID,
    doc_id: str,
    content: str,
    db: AsyncSession = Depends(get_db),
):
    """Index a document into the business knowledge base (RAG)."""
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    rag = RAGService()
    await rag.index_document(business_id=business_id, document_id=doc_id, content=content)
    return {"message": "Document indexed", "doc_id": doc_id}


@router.get("/{business_id}/knowledge")
async def list_knowledge(business_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    rag = RAGService()
    docs = await rag.list_documents(business_id)
    return {"documents": docs}


# ── IVR configuration ──────────────────────────────────────────────────────


class IVROptionIn(BaseModel):
    digit: str = Field(..., examples=["1"])
    label: str = Field(..., examples=["book an appointment"])
    action: str = Field(..., examples=["ai"])
    action_value: str = Field("", examples=["book_appointment"])


class IVRConfigIn(BaseModel):
    enabled: bool = True
    intro: str | None = Field(None, examples=["Welcome! Press 1 for appointments, 0 for a human agent."])
    options: list[IVROptionIn] | None = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "enabled": True,
                "intro": "Welcome to Kigali Clinic. Press 1 for appointments, 2 for general info, 0 for a human agent.",
                "options": [
                    {"digit": "1", "label": "book an appointment", "action": "ai", "action_value": "book_appointment"},
                    {"digit": "2", "label": "general inquiries", "action": "ai", "action_value": "general"},
                    {"digit": "0", "label": "speak to a human", "action": "escalate", "action_value": ""},
                ],
            }
        }
    }


@router.get(
    "/{business_id}/ivr",
    summary="Get IVR config",
    tags=["Businesses"],
    description="Return the current IVR configuration for the business. If not configured, returns the default menu.",
)
async def get_ivr_config(business_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    extra = business.extra or {}
    if "ivr" not in extra:
        default = get_default_menu(business.name, business.preferred_language)
        return {
            "enabled": False,
            "intro": default.intro,
            "options": [{"digit": o.digit, "label": o.label, "action": o.action, "action_value": o.action_value} for o in default.options],
            "source": "default",
        }
    return {"enabled": extra.get("ivr_enabled", False), **extra["ivr"], "source": "configured"}


@router.put(
    "/{business_id}/ivr",
    summary="Configure IVR menu",
    tags=["Businesses"],
    description=(
        "Enable or disable IVR and customise the menu. "
        "When enabled, callers hear a digit menu before reaching the AI agent. "
        "Leave `options` empty to use the language-appropriate default menu."
    ),
)
async def configure_ivr(
    business_id: uuid.UUID,
    payload: IVRConfigIn,
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    extra = dict(business.extra or {})
    extra["ivr_enabled"] = payload.enabled

    if payload.options is not None:
        extra["ivr"] = {
            "intro": payload.intro or f"Welcome to {business.name}.",
            "options": [o.model_dump() for o in payload.options],
        }
    elif "ivr" not in extra:
        default = get_default_menu(business.name, business.preferred_language)
        extra["ivr"] = {
            "intro": payload.intro or default.intro,
            "options": [{"digit": o.digit, "label": o.label, "action": o.action, "action_value": o.action_value} for o in default.options],
        }

    business.extra = extra
    await db.commit()
    return {"enabled": payload.enabled, **extra["ivr"]}

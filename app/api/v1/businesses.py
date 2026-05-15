import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_db
from app.models.business import Business, BusinessHours
from app.schemas.business import BusinessCreate, BusinessUpdate, BusinessOut
from app.services.ai.rag import RAGService

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

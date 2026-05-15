import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps import get_db
from app.models.call import Call
from app.schemas.call import CallOut, CallSummaryOut

router = APIRouter(prefix="/calls", tags=["Calls"])


@router.get("/business/{business_id}", response_model=list[CallSummaryOut])
async def list_calls(
    business_id: uuid.UUID,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Call)
        .where(Call.business_id == business_id)
        .order_by(Call.started_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.get("/{call_id}", response_model=CallOut)
async def get_call(call_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    call = await db.get(Call, call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call


@router.get("/{call_id}/transcript")
async def get_transcript(call_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    call = await db.get(Call, call_id)
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return {
        "call_id": call_id,
        "language": call.language_detected,
        "transcript": [
            {
                "speaker": t.speaker,
                "text": t.text,
                "timestamp": t.timestamp.isoformat(),
                "emotion": t.emotion,
            }
            for t in call.transcripts
        ],
    }

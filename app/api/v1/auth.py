"""
API key management for business tenants.

Each business gets its own API keys. Keys are hashed (SHA-256) before storage
so the raw value is only visible at creation time.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps import get_db
from app.models.api_key import APIKey
from app.models.business import Business
from app.schemas.auth import CreateAPIKeyRequest, APIKeyResponse, APIKeyCreateResponse
from app.core.auth import generate_api_key

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/businesses/{business_id}/keys",
    response_model=APIKeyCreateResponse,
    status_code=201,
    summary="Create API key",
    description=(
        "Generate a new API key for a business. The full raw key is returned **only once** "
        "in `raw_key` — store it securely. Subsequent requests will only show the prefix."
    ),
)
async def create_api_key(
    business_id: uuid.UUID,
    request: CreateAPIKeyRequest,
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    raw_key, key_hash = generate_api_key()
    prefix = raw_key[:12]

    api_key = APIKey(
        business_id=business_id,
        key_hash=key_hash,
        key_prefix=prefix,
        name=request.name,
        expires_at=request.expires_at,
        scopes=request.scopes,
    )
    db.add(api_key)
    await db.commit()
    await db.refresh(api_key)

    return APIKeyCreateResponse(
        id=api_key.id,
        name=api_key.name,
        key_prefix=api_key.key_prefix,
        is_active=api_key.is_active,
        last_used_at=api_key.last_used_at,
        created_at=api_key.created_at,
        expires_at=api_key.expires_at,
        scopes=api_key.scopes,
        raw_key=raw_key,
    )


@router.get(
    "/businesses/{business_id}/keys",
    response_model=list[APIKeyResponse],
    summary="List API keys",
    description="List all API keys for a business (raw keys are never returned).",
)
async def list_api_keys(
    business_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    result = await db.execute(select(APIKey).where(APIKey.business_id == business_id))
    return result.scalars().all()


@router.delete(
    "/businesses/{business_id}/keys/{key_id}",
    status_code=204,
    summary="Revoke API key",
    description="Deactivate an API key. The key cannot be re-activated.",
)
async def revoke_api_key(
    business_id: uuid.UUID,
    key_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(APIKey).where(and_(APIKey.id == key_id, APIKey.business_id == business_id))
    )
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")

    api_key.is_active = False
    await db.commit()

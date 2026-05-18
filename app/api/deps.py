from typing import AsyncGenerator
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from datetime import datetime

from app.database import AsyncSessionLocal
from app.config import get_settings

settings = get_settings()

_API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


async def require_api_key(
    api_key: str = Security(_API_KEY_HEADER),
    db: AsyncSession = Depends(get_db),
) -> None:
    """Validate that a request carries a live API key. Raises 401 otherwise."""
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-API-Key header required",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    import hashlib
    from app.models.api_key import APIKey

    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    result = await db.execute(
        select(APIKey).where(and_(APIKey.key_hash == key_hash, APIKey.is_active == True))
    )
    key_obj = result.scalar_one_or_none()
    if not key_obj:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or revoked API key")
    if key_obj.expires_at and key_obj.expires_at < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="API key has expired")
    key_obj.last_used_at = datetime.utcnow()
    await db.commit()

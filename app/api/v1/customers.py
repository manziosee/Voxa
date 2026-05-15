import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerOut
from app.services.crm.crm_service import CRMService

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post("/", response_model=CustomerOut, status_code=201)
async def create_customer(payload: CustomerCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(Customer).where(
            and_(Customer.business_id == payload.business_id, Customer.phone_number == payload.phone_number)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Customer with this phone already exists for the business")

    customer = Customer(**payload.model_dump())
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.get("/{customer_id}", response_model=CustomerOut)
async def get_customer(customer_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.patch("/{customer_id}", response_model=CustomerOut)
async def update_customer(
    customer_id: uuid.UUID,
    payload: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
):
    customer = await db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(customer, field, value)
    await db.commit()
    await db.refresh(customer)
    return customer


@router.get("/{customer_id}/timeline")
async def get_customer_timeline(customer_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    crm = CRMService(db)
    timeline = await crm.get_customer_timeline(customer_id)
    return {"timeline": timeline}


@router.post("/{customer_id}/tickets", status_code=201)
async def create_ticket(
    customer_id: uuid.UUID,
    business_id: uuid.UUID,
    subject: str,
    description: str,
    priority: str = "normal",
    db: AsyncSession = Depends(get_db),
):
    crm = CRMService(db)
    ticket = await crm.create_ticket(
        business_id=business_id,
        customer_id=customer_id,
        subject=subject,
        description=description,
        priority=priority,
    )
    return ticket

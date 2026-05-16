"""
Support ticket management.

Tickets are created automatically when the AI detects a complaint during a call,
or manually via this API. Each ticket is linked to a business, customer, and
optionally the call that triggered it.
"""
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.api.deps import get_db
from app.models.ticket import Ticket, TicketStatus
from app.models.business import Business
from app.models.customer import Customer
from app.schemas.ticket import CreateTicketRequest, UpdateTicketRequest, TicketResponse

router = APIRouter(prefix="/tickets", tags=["Tickets"])


@router.post(
    "/",
    response_model=TicketResponse,
    status_code=201,
    summary="Create ticket",
    description="Log a support ticket for a customer. Linked to a call if provided.",
)
async def create_ticket(
    business_id: uuid.UUID,
    payload: CreateTicketRequest,
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    customer = await db.get(Customer, payload.customer_id)
    if not customer or customer.business_id != business_id:
        raise HTTPException(status_code=404, detail="Customer not found")

    ticket = Ticket(
        business_id=business_id,
        customer_id=payload.customer_id,
        call_id=payload.call_id,
        subject=payload.subject,
        description=payload.description,
        priority=payload.priority,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.get(
    "/businesses/{business_id}",
    response_model=list[TicketResponse],
    summary="List business tickets",
    description="List all tickets for a business, optionally filtered by status.",
)
async def list_tickets(
    business_id: uuid.UUID,
    status: TicketStatus | None = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    business = await db.get(Business, business_id)
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    filters = [Ticket.business_id == business_id]
    if status:
        filters.append(Ticket.status == status)

    result = await db.execute(
        select(Ticket)
        .where(and_(*filters))
        .order_by(Ticket.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


@router.get(
    "/{ticket_id}",
    response_model=TicketResponse,
    summary="Get ticket",
)
async def get_ticket(ticket_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.patch(
    "/{ticket_id}",
    response_model=TicketResponse,
    summary="Update ticket",
    description="Update ticket status, priority, or add a resolution note.",
)
async def update_ticket(
    ticket_id: uuid.UUID,
    payload: UpdateTicketRequest,
    db: AsyncSession = Depends(get_db),
):
    ticket = await db.get(Ticket, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if payload.status is not None:
        ticket.status = payload.status
        if payload.status in (TicketStatus.resolved, TicketStatus.closed) and not ticket.resolved_at:
            ticket.resolved_at = datetime.utcnow()
    if payload.priority is not None:
        ticket.priority = payload.priority
    if payload.resolution is not None:
        ticket.resolution = payload.resolution

    await db.commit()
    await db.refresh(ticket)
    return ticket


@router.get(
    "/customers/{customer_id}",
    response_model=list[TicketResponse],
    summary="List customer tickets",
    description="Retrieve all support tickets raised by a specific customer.",
)
async def list_customer_tickets(
    customer_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Ticket)
        .where(Ticket.customer_id == customer_id)
        .order_by(Ticket.created_at.desc())
    )
    return result.scalars().all()

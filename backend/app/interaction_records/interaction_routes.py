# backend/app/interaction_records/interaction_routes.py
from fastapi import Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database.database import get_db
from ..healthcare_professionals.healthcare_professional import HealthcareProfessional
from ..interaction_records.interaction_record import InteractionRecord
from ..healthcare_professionals.healthcare_professional_dto import (
    CreateHealthcareProfessionalRequest,
    HealthcareProfessionalResponse,
    UpdateHealthcareProfessionalRequest,
)
from ..interaction_records.interaction_record_dto import (
    CreateInteractionRecordRequest,
    InteractionRecordResponse,
    UpdateInteractionRecordRequest,
)

router = APIRouter(prefix="/api/v1", tags=["v1"])


# ── Chat ─────────────────────────────────────────────────────────────────────

@router.post("/chat", response_model=dict, tags=["Chat"])
async def send_chat_message(
    message: str,
    db: Session = Depends(get_db),
):
    """Send a message to the AI assistant and receive a reply."""
    from ..services.ai_service import process_ai_message
    return await process_ai_message(message, db)


# ── Interaction Records ──────────────────────────────────────────────────────

@router.post(
    "/interactions",
    response_model=InteractionRecordResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Interaction Records"],
)
async def create_interaction_record(
    payload: CreateInteractionRecordRequest,
    db: Session = Depends(get_db),
):
    """Create a new interaction record for a Healthcare Professional."""
    healthcare_professional = db.query(HealthcareProfessional).filter(HealthcareProfessional.id == payload.healthcare_professional_id).first()
    if not healthcare_professional:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Healthcare Professional not found")

    interaction_record = InteractionRecord(
        healthcare_professional_id=payload.healthcare_professional_id,
        interaction_type=payload.interaction_type,
        date=payload.date,
        time=payload.time,
        attendees=payload.attendees,
        discussion=payload.discussion,
        summary=payload.summary,
        sentiment=payload.sentiment,
        materials=payload.materials,
        samples=payload.samples,
        outcomes=payload.outcomes,
        follow_up=payload.follow_up,
    )

    db.add(interaction_record)
    db.commit()
    db.refresh(interaction_record)
    return interaction_record


@router.get("/interactions", response_model=List[InteractionRecordResponse], tags=["Interaction Records"])
async def list_interaction_records(
    healthcare_professional_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Return all interaction records, optionally filtered by Healthcare Professional or date range."""
    query = db.query(InteractionRecord)

    if healthcare_professional_id:
        query = query.filter(InteractionRecord.healthcare_professional_id == healthcare_professional_id)
    if start_date:
        query = query.filter(
            InteractionRecord.date >= datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        )
    if end_date:
        query = query.filter(
            InteractionRecord.date <= datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        )

    return query.order_by(InteractionRecord.date.desc()).all()


@router.get(
    "/interactions/{interaction_id}",
    response_model=InteractionRecordResponse,
    tags=["Interaction Records"],
)
async def get_interaction_record(interaction_id: int, db: Session = Depends(get_db)):
    """Return a single interaction record by ID."""
    interaction_record = db.query(InteractionRecord).filter(InteractionRecord.id == interaction_id).first()
    if not interaction_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interaction Record not found")
    return interaction_record


@router.put(
    "/interactions/{interaction_id}",
    response_model=InteractionRecordResponse,
    tags=["Interaction Records"],
)
async def update_interaction_record(
    interaction_id: int,
    payload: UpdateInteractionRecordRequest,
    db: Session = Depends(get_db),
):
    """Update an existing interaction record."""
    interaction_record = db.query(InteractionRecord).filter(InteractionRecord.id == interaction_id).first()
    if not interaction_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interaction Record not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(interaction_record, field, value)

    db.commit()
    db.refresh(interaction_record)
    return interaction_record


@router.delete(
    "/interactions/{interaction_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    tags=["Interaction Records"],
)
async def delete_interaction_record(interaction_id: int, db: Session = Depends(get_db)):
    """Delete an interaction record by ID."""
    interaction_record = db.query(InteractionRecord).filter(InteractionRecord.id == interaction_id).first()
    if not interaction_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interaction Record not found")

    db.delete(interaction_record)
    db.commit()


# ── Healthcare Professionals ─────────────────────────────────────────────────

@router.get("/healthcare-professionals", response_model=List[HealthcareProfessionalResponse], tags=["Healthcare Professionals"])
async def list_healthcare_professionals(db: Session = Depends(get_db)):
    """Return all Healthcare Professional records."""
    return db.query(HealthcareProfessional).all()


@router.get("/healthcare-professionals/{professional_id}", response_model=HealthcareProfessionalResponse, tags=["Healthcare Professionals"])
async def get_healthcare_professional_by_id(professional_id: int, db: Session = Depends(get_db)):
    """Return a single Healthcare Professional record by ID."""
    healthcare_professional = db.query(HealthcareProfessional).filter(HealthcareProfessional.id == professional_id).first()
    if not healthcare_professional:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Healthcare Professional not found")
    return healthcare_professional


@router.post("/healthcare-professionals", response_model=HealthcareProfessionalResponse, status_code=status.HTTP_201_CREATED, tags=["Healthcare Professionals"])
async def create_healthcare_professional(payload: CreateHealthcareProfessionalRequest, db: Session = Depends(get_db)):
    """Create a new Healthcare Professional."""
    hp = HealthcareProfessional(**payload.model_dump())
    db.add(hp)
    db.commit()
    db.refresh(hp)
    return hp


@router.put("/healthcare-professionals/{professional_id}", response_model=HealthcareProfessionalResponse, tags=["Healthcare Professionals"])
async def update_healthcare_professional(professional_id: int, payload: UpdateHealthcareProfessionalRequest, db: Session = Depends(get_db)):
    """Update an existing Healthcare Professional."""
    hp = db.query(HealthcareProfessional).filter(HealthcareProfessional.id == professional_id).first()
    if not hp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Healthcare Professional not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(hp, field, value)
    db.commit()
    db.refresh(hp)
    return hp


@router.delete("/healthcare-professionals/{professional_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Healthcare Professionals"])
async def delete_healthcare_professional(professional_id: int, db: Session = Depends(get_db)):
    """Delete a Healthcare Professional by ID."""
    hp = db.query(HealthcareProfessional).filter(HealthcareProfessional.id == professional_id).first()
    if not hp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Healthcare Professional not found")
    db.delete(hp)
    db.commit()

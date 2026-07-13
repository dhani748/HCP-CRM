import logging
from fastapi import Depends, HTTPException, status, APIRouter
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
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

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["v1"])


class ExtractInteractionRequest(BaseModel):
    text: str


@router.post("/ai/extract-interaction", tags=["AI"])
async def extract_interaction(
    payload: ExtractInteractionRequest,
):
    from ..services.ai_service import process_extract_interaction
    return await process_extract_interaction(payload.text)


class ChatRequest(BaseModel):
    message: str
    current_page: str = ""


@router.post("/chat", response_model=dict, tags=["Chat"])
async def send_chat_message(
    payload: ChatRequest,
    db: Session = Depends(get_db),
):
    from ..services.ai_service import process_ai_message
    return await process_ai_message(payload.message, db, current_page=payload.current_page)


class ExtractHCPRequest(BaseModel):
    text: str


@router.post("/ai/extract-hcp", tags=["AI"])
async def extract_hcp(
    payload: ExtractHCPRequest,
):
    from ..services.ai_service import process_extract_hcp
    return await process_extract_hcp(payload.text)


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
    hcp = None
    if payload.healthcare_professional_id:
        hcp = db.query(HealthcareProfessional).filter(HealthcareProfessional.id == payload.healthcare_professional_id).first()

    if payload.hcp_name and not hcp:
        hcp = db.query(HealthcareProfessional).filter(HealthcareProfessional.name == payload.hcp_name).first()

    if payload.hcp_name and not hcp:
        hcp = HealthcareProfessional(name=payload.hcp_name, specialty=payload.specialization or "", hospital=payload.hospital or "")
        db.add(hcp)
        db.flush()

    logger.info(f"create_interaction_record: Creating interaction for HCP '{payload.hcp_name}'")
    interaction_record = InteractionRecord(
        healthcare_professional_id=hcp.id if hcp else None,
        hcp_name=payload.hcp_name or (hcp.name if hcp else ""),
        interaction_date=payload.interaction_date,
        interaction_time=payload.interaction_time or "",
        interaction_type=payload.interaction_type or "visit",
        hospital=payload.hospital or "",
        specialization=payload.specialization or "",
        products_discussed=payload.products_discussed or [],
        discussion_notes=payload.discussion_notes or "",
        objections_raised=payload.objections_raised or [],
        materials_shared=payload.materials_shared or [],
        samples_provided=payload.samples_provided or 0,
        sentiment=payload.sentiment or "neutral",
        priority=payload.priority or "medium",
        follow_up_required=payload.follow_up_required or False,
        follow_up_date=payload.follow_up_date or "",
        reminder_date=payload.reminder_date or "",
        tags=payload.tags or [],
        attachments=payload.attachments or [],
        interaction_summary=payload.interaction_summary or "",
        ai_confidence_score=payload.ai_confidence_score or 0.0,
        created_by=payload.created_by or "AI Assistant",
        tool_used=payload.tool_used or "",
        interaction_status=payload.interaction_status or "draft",
        status=payload.status or "draft",
    )

    try:
        db.add(interaction_record)
        db.commit()
        db.refresh(interaction_record)
        logger.info(f"create_interaction_record: Successfully created interaction id={interaction_record.id}")
    except OperationalError as e:
        db.rollback()
        logger.error(f"create_interaction_record: Database write failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to save interaction because the database is not writable.",
        )
    return interaction_record


@router.get("/interactions", response_model=List[InteractionRecordResponse], tags=["Interaction Records"])
async def list_interaction_records(
    healthcare_professional_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    interaction_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(InteractionRecord)

    if healthcare_professional_id:
        query = query.filter(InteractionRecord.healthcare_professional_id == healthcare_professional_id)
    if start_date:
        query = query.filter(
            InteractionRecord.interaction_date >= datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        )
    if end_date:
        query = query.filter(
            InteractionRecord.interaction_date <= datetime.fromisoformat(end_date.replace("Z", "+00:00"))
        )
    if status:
        query = query.filter(InteractionRecord.interaction_status == status)
    if interaction_type:
        query = query.filter(InteractionRecord.interaction_type == interaction_type)

    return query.order_by(InteractionRecord.interaction_date.desc()).offset(skip).limit(limit).all()


@router.get(
    "/interactions/{interaction_id}",
    response_model=InteractionRecordResponse,
    tags=["Interaction Records"],
)
async def get_interaction_record(interaction_id: int, db: Session = Depends(get_db)):
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
    interaction_record = db.query(InteractionRecord).filter(InteractionRecord.id == interaction_id).first()
    if not interaction_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interaction Record not found")

    db.delete(interaction_record)
    db.commit()


@router.get("/healthcare-professionals", response_model=List[HealthcareProfessionalResponse], tags=["Healthcare Professionals"])
async def list_healthcare_professionals(
    search: Optional[str] = None,
    specialty: Optional[str] = None,
    active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(HealthcareProfessional)

    if search:
        q = f"%{search}%"
        query = query.filter(
            HealthcareProfessional.name.ilike(q)
            | HealthcareProfessional.specialty.ilike(q)
            | HealthcareProfessional.hospital.ilike(q)
            | HealthcareProfessional.city.ilike(q)
            | HealthcareProfessional.email.ilike(q)
        )
    if specialty:
        query = query.filter(HealthcareProfessional.specialty == specialty)
    if active is not None:
        query = query.filter(HealthcareProfessional.active == active)

    return query.order_by(HealthcareProfessional.name).offset(skip).limit(limit).all()


@router.get("/healthcare-professionals/{professional_id}", response_model=HealthcareProfessionalResponse, tags=["Healthcare Professionals"])
async def get_healthcare_professional_by_id(professional_id: int, db: Session = Depends(get_db)):
    healthcare_professional = db.query(HealthcareProfessional).filter(HealthcareProfessional.id == professional_id).first()
    if not healthcare_professional:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Healthcare Professional not found")
    return healthcare_professional


@router.post("/healthcare-professionals", response_model=HealthcareProfessionalResponse, status_code=status.HTTP_201_CREATED, tags=["Healthcare Professionals"])
async def create_healthcare_professional(payload: CreateHealthcareProfessionalRequest, db: Session = Depends(get_db)):
    hp = HealthcareProfessional(**payload.model_dump())
    db.add(hp)
    db.commit()
    db.refresh(hp)
    return hp


@router.put("/healthcare-professionals/{professional_id}", response_model=HealthcareProfessionalResponse, tags=["Healthcare Professionals"])
async def update_healthcare_professional(professional_id: int, payload: UpdateHealthcareProfessionalRequest, db: Session = Depends(get_db)):
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
    hp = db.query(HealthcareProfessional).filter(HealthcareProfessional.id == professional_id).first()
    if not hp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Healthcare Professional not found")
    db.delete(hp)
    db.commit()

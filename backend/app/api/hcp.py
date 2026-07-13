from fastapi import APIRouter, Depends, Query
from typing import Optional
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.healthcare_professionals.healthcare_professional import HealthcareProfessional

router = APIRouter(prefix="/api/v1/hcp", tags=["HCP Search"])


@router.get("/search")
async def search_hcp(
    name: Optional[str] = Query(None, description="HCP name"),
    hospital: Optional[str] = Query(None, description="Hospital or clinic name"),
    specialization: Optional[str] = Query(None, description="Medical specialty"),
    city: Optional[str] = Query(None, description="City"),
    db: Session = Depends(get_db),
):
    query = db.query(HealthcareProfessional)

    if name:
        query = query.filter(HealthcareProfessional.name.ilike(f"%{name}%"))
    if hospital:
        query = query.filter(HealthcareProfessional.hospital.ilike(f"%{hospital}%"))
    if specialization:
        query = query.filter(HealthcareProfessional.specialty.ilike(f"%{specialization}%"))
    if city:
        query = query.filter(HealthcareProfessional.city.ilike(f"%{city}%"))

    results = query.order_by(HealthcareProfessional.name).limit(50).all()

    return [
        {
            "id": h.id,
            "name": h.name,
            "specialty": h.specialty or "",
            "hospital": h.hospital or "",
            "city": h.city or "",
            "email": h.email or "",
            "phone": h.phone or "",
            "active": h.active,
        }
        for h in results
    ]


@router.get("/interaction-history")
async def hcp_interaction_history(
    hcp_name: Optional[str] = Query(None, description="HCP name"),
    hcp_id: Optional[int] = Query(None, description="HCP ID"),
    days: int = Query(30, description="Number of days to look back"),
    db: Session = Depends(get_db),
):
    from app.interaction_records.interaction_record import InteractionRecord
    from datetime import datetime, timedelta

    query = db.query(InteractionRecord)

    if hcp_id:
        query = query.filter(InteractionRecord.healthcare_professional_id == hcp_id)
    if hcp_name:
        query = query.filter(InteractionRecord.hcp_name.ilike(f"%{hcp_name}%"))

    since = datetime.now() - timedelta(days=days)
    query = query.filter(InteractionRecord.interaction_date >= since)

    results = query.order_by(InteractionRecord.interaction_date.desc()).limit(50).all()

    return [
        {
            "id": r.id,
            "hcp_name": r.hcp_name or "",
            "interaction_date": r.interaction_date.isoformat() if r.interaction_date else "",
            "interaction_time": r.interaction_time or "",
            "interaction_type": r.interaction_type or "",
            "sentiment": r.sentiment or "",
            "interaction_summary": r.interaction_summary or "",
            "follow_up_date": r.follow_up_date or "",
            "interaction_status": r.interaction_status or "",
        }
        for r in results
    ]

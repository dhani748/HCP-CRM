import json
import logging
from datetime import date, datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.interaction_records.interaction_record import InteractionRecord
from app.healthcare_professionals.healthcare_professional import HealthcareProfessional
from app.schemas.interaction import InteractionState, ToolOutput

logger = logging.getLogger(__name__)


def log_interaction(
    db: Session,
    hcp_name: str = "",
    interaction_date: str = "",
    interaction_time: str = "",
    interaction_type: str = "visit",
    hospital: str = "",
    specialization: str = "",
    products_discussed: Optional[List[str]] = None,
    discussion_notes: str = "",
    objections_raised: Optional[List[str]] = None,
    materials_shared: Optional[List[str]] = None,
    samples_provided: int = 0,
    sentiment: str = "neutral",
    priority: str = "medium",
    follow_up_required: bool = False,
    follow_up_date: str = "",
    reminder_date: str = "",
    tags: Optional[List[str]] = None,
    interaction_summary: str = "",
) -> ToolOutput:
    if not hcp_name:
        return ToolOutput(
            tool_name="log_interaction",
            success=False,
            message="HCP name is required to log an interaction.",
            interaction_state=InteractionState(),
        )

    today = date.today().isoformat()
    effective_date = interaction_date if interaction_date else today

    logger.info(f"log_interaction: Looking up or creating HCP '{hcp_name}'")
    try:
        hcp = db.query(HealthcareProfessional).filter(HealthcareProfessional.name == hcp_name).first()
        if not hcp:
            hcp = HealthcareProfessional(name=hcp_name, specialty=specialization or "", hospital=hospital or "")
            db.add(hcp)
            db.flush()
            logger.info(f"log_interaction: Created new HCP '{hcp_name}' (id={hcp.id})")
        else:
            logger.info(f"log_interaction: Found existing HCP '{hcp_name}' (id={hcp.id})")
    except OperationalError as e:
        logger.error(f"log_interaction: Database error while finding/creating HCP: {e}")
        return ToolOutput(
            tool_name="log_interaction",
            success=False,
            message="Unable to save interaction because the database is not writable.",
            interaction_state=InteractionState(),
        )

    try:
        parsed_date = datetime.fromisoformat(effective_date)
    except ValueError:
        parsed_date = datetime.now()

    logger.info(f"log_interaction: Creating interaction record for HCP '{hcp_name}'")
    try:
        record = InteractionRecord(
            healthcare_professional_id=hcp.id,
            hcp_name=hcp_name,
            interaction_date=parsed_date,
            interaction_time=interaction_time,
            interaction_type=interaction_type,
            hospital=hospital or hcp.hospital or "",
            specialization=specialization or hcp.specialty or "",
            products_discussed=products_discussed or [],
            discussion_notes=discussion_notes,
            objections_raised=objections_raised or [],
            materials_shared=materials_shared or [],
            samples_provided=samples_provided,
            sentiment=sentiment,
            priority=priority,
            follow_up_required=follow_up_required,
            follow_up_date=follow_up_date,
            reminder_date=reminder_date,
            tags=tags or [],
            interaction_summary=interaction_summary,
            ai_confidence_score=0.85,
            created_by="AI Assistant",
            tool_used="log_interaction",
            interaction_status="completed",
            status="completed",
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        logger.info(f"log_interaction: Successfully saved interaction id={record.id}")
    except OperationalError as e:
        db.rollback()
        logger.error(f"log_interaction: Database write failed: {e}")
        return ToolOutput(
            tool_name="log_interaction",
            success=False,
            message="Unable to save interaction because the database is not writable.",
            interaction_state=InteractionState(),
        )

    state = InteractionState(
        hcp_name=hcp_name,
        interaction_date=effective_date,
        interaction_time=interaction_time,
        interaction_type=interaction_type,
        hospital=hospital or hcp.hospital or "",
        specialization=specialization or hcp.specialty or "",
        products_discussed=products_discussed or [],
        discussion_notes=discussion_notes,
        objections_raised=objections_raised or [],
        materials_shared=materials_shared or [],
        samples_provided=samples_provided,
        sentiment=sentiment,
        priority=priority,
        follow_up_required=follow_up_required,
        follow_up_date=follow_up_date,
        reminder_date=reminder_date,
        tags=tags or [],
        interaction_summary=interaction_summary or f"Interaction logged with {hcp_name}",
        ai_confidence_score=0.85,
        created_by="AI Assistant",
        tool_used="log_interaction",
        interaction_status="completed",
    )

    return ToolOutput(
        tool_name="log_interaction",
        success=True,
        message=f"Interaction logged successfully for {hcp_name}.",
        interaction_state=state,
        updated_fields=[k for k, v in state.model_dump().items() if v],
    )


def edit_interaction(
    db: Session,
    interaction_id: Optional[int] = None,
    hcp_name: str = "",
    **kwargs,
) -> ToolOutput:
    logger.info(f"edit_interaction: Searching for interaction (id={interaction_id}, hcp={hcp_name})")
    try:
        record = None
        if interaction_id:
            record = db.query(InteractionRecord).filter(InteractionRecord.id == interaction_id).first()
        elif hcp_name:
            record = (
                db.query(InteractionRecord)
                .filter(InteractionRecord.hcp_name == hcp_name)
                .order_by(InteractionRecord.interaction_date.desc())
                .first()
            )
    except OperationalError as e:
        logger.error(f"edit_interaction: Database read error: {e}")
        return ToolOutput(
            tool_name="edit_interaction",
            success=False,
            message="Unable to edit interaction because the database is not readable.",
            interaction_state=InteractionState(),
        )

    if not record:
        return ToolOutput(
            tool_name="edit_interaction",
            success=False,
            message="No interaction found to edit.",
            interaction_state=InteractionState(),
        )

    allowed_fields = {
        "interaction_type", "hospital", "specialization", "products_discussed",
        "discussion_notes", "objections_raised", "materials_shared",
        "samples_provided", "sentiment", "priority", "follow_up_required",
        "follow_up_date", "reminder_date", "tags", "interaction_summary",
        "interaction_status", "hcp_name", "interaction_time",
    }

    updated_fields = []
    for field, value in kwargs.items():
        if field in allowed_fields and value is not None:
            setattr(record, field, value)
            updated_fields.append(field)

    if updated_fields:
        record.tool_used = "edit_interaction"
        record.last_updated = datetime.now()
        try:
            db.commit()
            db.refresh(record)
            logger.info(f"edit_interaction: Updated {len(updated_fields)} field(s) on interaction id={record.id}")
        except OperationalError as e:
            db.rollback()
            logger.error(f"edit_interaction: Database write failed: {e}")
            return ToolOutput(
                tool_name="edit_interaction",
                success=False,
                message="Unable to save changes because the database is not writable.",
                interaction_state=InteractionState(),
            )

    state = InteractionState(
        hcp_name=record.hcp_name or "",
        interaction_date=record.interaction_date.isoformat() if record.interaction_date else "",
        interaction_time=record.interaction_time or "",
        interaction_type=record.interaction_type or "visit",
        hospital=record.hospital or "",
        specialization=record.specialization or "",
        products_discussed=record.products_discussed or [],
        discussion_notes=record.discussion_notes or "",
        objections_raised=record.objections_raised or [],
        materials_shared=record.materials_shared or [],
        samples_provided=record.samples_provided or 0,
        sentiment=record.sentiment or "neutral",
        priority=record.priority or "medium",
        follow_up_required=record.follow_up_required or False,
        follow_up_date=record.follow_up_date or "",
        reminder_date=record.reminder_date or "",
        tags=record.tags or [],
        interaction_summary=record.interaction_summary or "",
        ai_confidence_score=0.9,
        created_by=record.created_by or "AI Assistant",
        tool_used="edit_interaction",
        interaction_status=record.interaction_status or "draft",
    )

    msg = f"Updated {len(updated_fields)} field(s): {', '.join(updated_fields)}." if updated_fields else "No changes made."
    return ToolOutput(
        tool_name="edit_interaction",
        success=True,
        message=msg,
        interaction_state=state,
        updated_fields=updated_fields,
    )


def search_hcp(
    db: Session,
    name: str = "",
    hospital: str = "",
    specialization: str = "",
    city: str = "",
) -> dict:
    query = db.query(HealthcareProfessional)

    if name:
        query = query.filter(HealthcareProfessional.name.ilike(f"%{name}%"))
    if hospital:
        query = query.filter(HealthcareProfessional.hospital.ilike(f"%{hospital}%"))
    if specialization:
        query = query.filter(HealthcareProfessional.specialty.ilike(f"%{specialization}%"))
    if city:
        query = query.filter(HealthcareProfessional.city.ilike(f"%{city}%"))

    results = query.all()

    if not results:
        return {
            "tool_name": "search_hcp",
            "success": True,
            "message": "No HCPs found matching the criteria.",
            "hcps": [],
        }

    hcp_list = [
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

    return {
        "tool_name": "search_hcp",
        "success": True,
        "message": f"Found {len(results)} HCP(s).",
        "hcps": hcp_list,
    }


def interaction_history(
    db: Session,
    hcp_name: str = "",
    days: int = 30,
) -> dict:
    query = db.query(InteractionRecord)

    if hcp_name:
        query = query.filter(InteractionRecord.hcp_name.ilike(f"%{hcp_name}%"))

    from datetime import timedelta
    since = datetime.now() - timedelta(days=days)
    query = query.filter(InteractionRecord.interaction_date >= since)

    results = query.order_by(InteractionRecord.interaction_date.desc()).all()

    if not results:
        return {
            "tool_name": "interaction_history",
            "success": True,
            "message": "No interactions found.",
            "interactions": [],
        }

    history = []
    for r in results:
        history.append({
            "id": r.id,
            "hcp_name": r.hcp_name or "",
            "interaction_date": r.interaction_date.isoformat() if r.interaction_date else "",
            "interaction_type": r.interaction_type or "",
            "sentiment": r.sentiment or "",
            "interaction_summary": r.interaction_summary or "",
            "follow_up_date": r.follow_up_date or "",
        })

    return {
        "tool_name": "interaction_history",
        "success": True,
        "message": f"Found {len(results)} interaction(s).",
        "interactions": history,
    }


def schedule_follow_up(
    db: Session,
    hcp_name: str = "",
    follow_up_date: str = "",
    reminder_date: str = "",
    priority: str = "medium",
    notes: str = "",
) -> ToolOutput:
    if not hcp_name:
        return ToolOutput(
            tool_name="schedule_follow_up",
            success=False,
            message="HCP name is required.",
            interaction_state=InteractionState(),
        )

    logger.info(f"schedule_follow_up: Scheduling follow-up for '{hcp_name}'")
    try:
        record = (
            db.query(InteractionRecord)
            .filter(InteractionRecord.hcp_name == hcp_name)
            .order_by(InteractionRecord.interaction_date.desc())
            .first()
        )
    except OperationalError as e:
        logger.error(f"schedule_follow_up: Database read error: {e}")
        return ToolOutput(
            tool_name="schedule_follow_up",
            success=False,
            message="Unable to schedule follow-up because the database is not readable.",
            interaction_state=InteractionState(),
        )

    if not record:
        return ToolOutput(
            tool_name="schedule_follow_up",
            success=False,
            message=f"No interaction found for {hcp_name}.",
            interaction_state=InteractionState(),
        )

    record.follow_up_required = True
    record.follow_up_date = follow_up_date or record.follow_up_date
    record.reminder_date = reminder_date or record.reminder_date
    record.priority = priority
    record.tool_used = "schedule_follow_up"
    record.last_updated = datetime.now()

    if notes:
        record.discussion_notes = (record.discussion_notes or "") + f"\n[Follow-up note]: {notes}"

    try:
        db.commit()
        db.refresh(record)
        logger.info(f"schedule_follow_up: Successfully updated interaction id={record.id}")
    except OperationalError as e:
        db.rollback()
        logger.error(f"schedule_follow_up: Database write failed: {e}")
        return ToolOutput(
            tool_name="schedule_follow_up",
            success=False,
            message="Unable to save follow-up because the database is not writable.",
            interaction_state=InteractionState(),
        )

    state = InteractionState(
        hcp_name=record.hcp_name or "",
        interaction_date=record.interaction_date.isoformat() if record.interaction_date else "",
        interaction_time=record.interaction_time or "",
        interaction_type=record.interaction_type or "visit",
        hospital=record.hospital or "",
        specialization=record.specialization or "",
        products_discussed=record.products_discussed or [],
        discussion_notes=record.discussion_notes or "",
        objections_raised=record.objections_raised or [],
        materials_shared=record.materials_shared or [],
        samples_provided=record.samples_provided or 0,
        sentiment=record.sentiment or "neutral",
        priority=priority,
        follow_up_required=True,
        follow_up_date=record.follow_up_date or "",
        reminder_date=record.reminder_date or "",
        tags=record.tags or [],
        interaction_summary=record.interaction_summary or "",
        ai_confidence_score=0.9,
        created_by=record.created_by or "AI Assistant",
        tool_used="schedule_follow_up",
        interaction_status=record.interaction_status or "draft",
    )

    return ToolOutput(
        tool_name="schedule_follow_up",
        success=True,
        message=f"Follow-up scheduled for {hcp_name} on {follow_up_date}.",
        interaction_state=state,
        updated_fields=["follow_up_required", "follow_up_date", "reminder_date", "priority"],
    )

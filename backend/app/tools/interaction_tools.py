import json
import logging
from datetime import date, datetime, timedelta
from typing import Optional, List, Any
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError

from app.interaction_records.interaction_record import InteractionRecord
from app.healthcare_professionals.healthcare_professional import HealthcareProfessional
from app.schemas.interaction import InteractionState, ToolOutput

logger = logging.getLogger(__name__)


def _normalize_list(value: Any) -> list:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        value = value.strip()
        if not value:
            return []
        return [value]
    return []


def _log_tool_execution(tool_name: str, params: dict, result: Any):
    logger.info(f"[TOOL:{tool_name}] params={json.dumps(params, default=str)}")
    if isinstance(result, ToolOutput):
        logger.info(f"[TOOL:{tool_name}] success={result.success} message={result.message}")
    elif isinstance(result, dict):
        logger.info(f"[TOOL:{tool_name}] success={result.get('success')} message={result.get('message')}")


def log_interaction(
    db: Session,
    hcp_name: str = "",
    interaction_date: str = "",
    interaction_time: str = "",
    interaction_type: str = "visit",
    hospital: str = "",
    specialization: str = "",
    discussion_notes: str = "",
    products_discussed: Optional[Any] = None,
    materials_shared: Optional[Any] = None,
    samples_provided: int = 0,
    sentiment: str = "neutral",
    priority: str = "medium",
    follow_up_required: bool = False,
    follow_up_date: str = "",
    tags: Optional[Any] = None,
    interaction_summary: str = "",
    attendees: Optional[Any] = None,
) -> ToolOutput:
    products_discussed = _normalize_list(products_discussed)
    materials_shared = _normalize_list(materials_shared)
    tags = _normalize_list(tags)
    attendees = _normalize_list(attendees)

    _log_tool_execution("log_interaction", locals(), None)

    if not hcp_name:
        return ToolOutput(
            tool_name="log_interaction",
            success=False,
            message="The doctor could not be found.",
            interaction_state=InteractionState(),
        )

    today = date.today().isoformat()
    effective_date = interaction_date if interaction_date else today

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
        db.rollback()
        logger.error(f"log_interaction: Database error: {e}")
        return ToolOutput(
            tool_name="log_interaction",
            success=False,
            message="Unable to save interaction.",
            interaction_state=InteractionState(),
        )

    try:
        parsed_date = datetime.fromisoformat(effective_date) if effective_date else datetime.now()
    except (ValueError, TypeError):
        parsed_date = datetime.now()

    try:
        record = InteractionRecord(
            healthcare_professional_id=hcp.id,
            hcp_name=hcp_name,
            interaction_date=parsed_date,
            interaction_time=interaction_time or "",
            interaction_type=interaction_type or "visit",
            hospital=hospital or hcp.hospital or "",
            specialization=specialization or hcp.specialty or "",
            products_discussed=products_discussed,
            discussion_notes=discussion_notes or "",
            materials_shared=materials_shared,
            samples_provided=samples_provided or 0,
            sentiment=sentiment or "neutral",
            priority=priority or "medium",
            follow_up_required=follow_up_required or False,
            follow_up_date=follow_up_date or "",
            tags=tags,
            attendees=attendees,
            interaction_summary=interaction_summary or "",
            created_by="AI Assistant",
            tool_used="log_interaction",
            interaction_status="completed",
            status="completed",
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        logger.info(f"log_interaction: Created interaction id={record.id}")
    except OperationalError as e:
        db.rollback()
        logger.error(f"log_interaction: Database write failed: {e}")
        return ToolOutput(
            tool_name="log_interaction",
            success=False,
            message="Unable to save interaction.",
            interaction_state=InteractionState(),
        )

    state = InteractionState(
        hcp_name=hcp_name,
        interaction_date=effective_date,
        interaction_time=interaction_time or "",
        interaction_type=interaction_type or "visit",
        hospital=hospital or hcp.hospital or "",
        specialization=specialization or hcp.specialty or "",
        products_discussed=products_discussed,
        discussion_notes=discussion_notes or "",
        materials_shared=materials_shared,
        samples_provided=samples_provided or 0,
        sentiment=sentiment or "neutral",
        priority=priority or "medium",
        follow_up_required=follow_up_required or False,
        follow_up_date=follow_up_date or "",
        tags=tags,
        interaction_summary=interaction_summary or f"Interaction logged with {hcp_name}",
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
    _log_tool_execution("edit_interaction", {"interaction_id": interaction_id, "hcp_name": hcp_name, **kwargs}, None)

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
            message="The interaction could not be updated.",
            interaction_state=InteractionState(),
        )

    if not record:
        return ToolOutput(
            tool_name="edit_interaction",
            success=False,
            message="The interaction could not be updated.",
            interaction_state=InteractionState(),
        )

    allowed_fields = {
        "interaction_type", "hospital", "specialization", "products_discussed",
        "discussion_notes", "materials_shared", "samples_provided",
        "sentiment", "priority", "follow_up_required", "follow_up_date",
        "tags", "interaction_summary", "interaction_status", "hcp_name",
        "interaction_time", "attendees",
    }

    updated_fields = []
    for field, value in kwargs.items():
        if field in allowed_fields and value is not None:
            if field in ("products_discussed", "materials_shared", "tags", "attendees"):
                value = _normalize_list(value)
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
                message="The interaction could not be updated.",
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
        materials_shared=record.materials_shared or [],
        samples_provided=record.samples_provided or 0,
        sentiment=record.sentiment or "neutral",
        priority=record.priority or "medium",
        follow_up_required=record.follow_up_required or False,
        follow_up_date=record.follow_up_date or "",
        tags=record.tags or [],
        interaction_summary=record.interaction_summary or "",
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
    id: Optional[int] = None,
    name: str = "",
    hospital: str = "",
    specialization: str = "",
    city: str = "",
    email: str = "",
    phone: str = "",
) -> dict:
    _log_tool_execution("search_hcp", {"id": id, "name": name, "hospital": hospital, "specialization": specialization, "city": city, "email": email, "phone": phone}, None)

    query = db.query(HealthcareProfessional)

    if id is not None:
        query = query.filter(HealthcareProfessional.id == id)
    if name:
        query = query.filter(HealthcareProfessional.name.ilike(f"%{name}%"))
    if hospital:
        query = query.filter(HealthcareProfessional.hospital.ilike(f"%{hospital}%"))
    if specialization:
        query = query.filter(HealthcareProfessional.specialty.ilike(f"%{specialization}%"))
    if city:
        query = query.filter(HealthcareProfessional.city.ilike(f"%{city}%"))
    if email:
        query = query.filter(HealthcareProfessional.email.ilike(f"%{email}%"))
    if phone:
        query = query.filter(HealthcareProfessional.phone.ilike(f"%{phone}%"))

    results = query.order_by(HealthcareProfessional.name).all()

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


def delete_interaction(
    db: Session,
    interaction_id: int,
) -> dict:
    _log_tool_execution("delete_interaction", {"interaction_id": interaction_id}, None)

    try:
        record = db.query(InteractionRecord).filter(InteractionRecord.id == interaction_id).first()
        if not record:
            return {
                "tool_name": "delete_interaction",
                "success": False,
                "message": "The interaction could not be found.",
            }

        db.delete(record)
        db.commit()
        logger.info(f"delete_interaction: Deleted interaction id={interaction_id}")
        return {
            "tool_name": "delete_interaction",
            "success": True,
            "message": f"Interaction {interaction_id} deleted successfully.",
        }
    except OperationalError as e:
        db.rollback()
        logger.error(f"delete_interaction: Database error: {e}")
        return {
            "tool_name": "delete_interaction",
            "success": False,
            "message": "The interaction could not be deleted.",
        }


def interaction_history(
    db: Session,
    hcp_name: str = "",
    days: int = 30,
) -> dict:
    _log_tool_execution("interaction_history", {"hcp_name": hcp_name, "days": days}, None)

    query = db.query(InteractionRecord)

    if hcp_name:
        query = query.filter(InteractionRecord.hcp_name.ilike(f"%{hcp_name}%"))

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

    history = [
        {
            "id": r.id,
            "hcp_name": r.hcp_name or "",
            "interaction_date": r.interaction_date.isoformat() if r.interaction_date else "",
            "interaction_type": r.interaction_type or "",
            "sentiment": r.sentiment or "",
            "interaction_summary": r.interaction_summary or "",
            "follow_up_date": r.follow_up_date or "",
        }
        for r in results
    ]

    return {
        "tool_name": "interaction_history",
        "success": True,
        "message": f"Found {len(results)} interaction(s).",
        "interactions": history,
    }


def dashboard_summary(db: Session) -> dict:
    _log_tool_execution("dashboard_summary", {}, None)

    try:
        total_hcps = db.query(HealthcareProfessional).count()
        total_interactions = db.query(InteractionRecord).count()
        today_count = db.query(InteractionRecord).filter(
            InteractionRecord.interaction_date >= date.today()
        ).count()
        pending_followups = db.query(InteractionRecord).filter(
            InteractionRecord.follow_up_date.isnot(None),
            InteractionRecord.follow_up_date != "",
        ).count()
        return {
            "tool_name": "dashboard_summary",
            "success": True,
            "message": f"Total HCPs: {total_hcps}, Total Interactions: {total_interactions}, Today: {today_count}, Pending Follow-ups: {pending_followups}",
            "data": {
                "total_hcps": total_hcps,
                "total_interactions": total_interactions,
                "today_interactions": today_count,
                "pending_followups": pending_followups,
            },
        }
    except OperationalError as e:
        logger.error(f"dashboard_summary: Database error: {e}")
        return {
            "tool_name": "dashboard_summary",
            "success": False,
            "message": "Unable to load dashboard data.",
            "data": {},
        }


def todays_followups(db: Session) -> dict:
    _log_tool_execution("todays_followups", {}, None)

    try:
        today_str = date.today().isoformat()
        records = db.query(InteractionRecord).filter(
            InteractionRecord.follow_up_date == today_str,
        ).order_by(InteractionRecord.interaction_date.desc()).all()

        if not records:
            return {
                "tool_name": "todays_followups",
                "success": True,
                "message": "No follow-ups scheduled for today.",
                "interactions": [],
            }

        followups = [
            {
                "id": r.id,
                "hcp_name": r.hcp_name or "",
                "interaction_date": r.interaction_date.isoformat() if r.interaction_date else "",
                "interaction_type": r.interaction_type or "",
                "interaction_summary": r.interaction_summary or "",
                "priority": r.priority or "medium",
            }
            for r in records
        ]
        return {
            "tool_name": "todays_followups",
            "success": True,
            "message": f"Found {len(records)} follow-up(s) for today.",
            "interactions": followups,
        }
    except OperationalError as e:
        logger.error(f"todays_followups: Database error: {e}")
        return {
            "tool_name": "todays_followups",
            "success": False,
            "message": "Unable to load follow-ups.",
            "interactions": [],
        }


def next_best_action(db: Session) -> dict:
    _log_tool_execution("next_best_action", {}, None)

    try:
        oldest = db.query(InteractionRecord).order_by(InteractionRecord.interaction_date.asc()).first()
        if not oldest:
            return {
                "tool_name": "next_best_action",
                "success": True,
                "message": "No interactions found. Start by logging your first interaction!",
                "action": "Log your first interaction",
            }

        overdue = db.query(InteractionRecord).filter(
            InteractionRecord.follow_up_required == True,
            InteractionRecord.follow_up_date < date.today().isoformat(),
        ).order_by(InteractionRecord.follow_up_date.asc()).first()

        if overdue:
            return {
                "tool_name": "next_best_action",
                "success": True,
                "message": f"Follow-up overdue for {overdue.hcp_name}. Schedule a follow-up.",
                "action": f"Follow-up with {overdue.hcp_name}",
                "hcp_name": overdue.hcp_name,
            }

        return {
            "tool_name": "next_best_action",
            "success": True,
            "message": "No urgent actions needed. Your CRM is up to date.",
            "action": "No action needed",
        }
    except OperationalError as e:
        logger.error(f"next_best_action: Database error: {e}")
        return {
            "tool_name": "next_best_action",
            "success": False,
            "message": "Unable to determine next action.",
            "action": "",
        }

from pydantic import BaseModel, field_validator
from typing import List, Any


def _ensure_list(value: Any) -> list:
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


class InteractionState(BaseModel):
    hcp_name: str = ""
    interaction_date: str = ""
    interaction_time: str = ""
    interaction_type: str = "visit"
    hospital: str = ""
    specialization: str = ""
    products_discussed: List[str] = []
    discussion_notes: str = ""
    objections_raised: List[str] = []
    materials_shared: List[str] = []
    samples_provided: int = 0
    sentiment: str = "neutral"
    priority: str = "medium"
    follow_up_required: bool = False
    follow_up_date: str = ""
    reminder_date: str = ""
    tags: List[str] = []
    attachments: List[str] = []
    attendees: List[str] = []
    interaction_summary: str = ""
    ai_confidence_score: float = 0.0
    created_by: str = "AI Assistant"
    tool_used: str = ""
    interaction_status: str = "draft"

    @field_validator(
        "products_discussed", "objections_raised", "materials_shared",
        "tags", "attachments", "attendees", mode="before"
    )
    @classmethod
    def _normalize_lists(cls, value: Any) -> list:
        return _ensure_list(value)


class ToolOutput(BaseModel):
    tool_name: str
    success: bool
    message: str
    interaction_state: InteractionState
    updated_fields: List[str] = []

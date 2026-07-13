from pydantic import BaseModel, ConfigDict, field_validator
from typing import List, Optional
from datetime import datetime
import json


class InteractionRecordBase(BaseModel):
    healthcare_professional_id: Optional[int] = None
    hcp_name: Optional[str] = ""
    interaction_date: Optional[datetime] = None
    interaction_time: Optional[str] = ""
    interaction_type: Optional[str] = "visit"
    hospital: Optional[str] = ""
    specialization: Optional[str] = ""
    products_discussed: Optional[List[str]] = None
    discussion_notes: Optional[str] = ""
    objections_raised: Optional[List[str]] = None
    materials_shared: Optional[List[str]] = None
    samples_provided: Optional[int] = 0
    sentiment: Optional[str] = "neutral"
    priority: Optional[str] = "medium"
    follow_up_required: Optional[bool] = False
    follow_up_date: Optional[str] = ""
    reminder_date: Optional[str] = ""
    tags: Optional[List[str]] = None
    attachments: Optional[List[str]] = None
    interaction_summary: Optional[str] = ""
    ai_confidence_score: Optional[float] = 0.0
    created_by: Optional[str] = "AI Assistant"
    tool_used: Optional[str] = ""
    interaction_status: Optional[str] = "draft"
    status: Optional[str] = "draft"

    @field_validator("products_discussed", "objections_raised", "materials_shared", "tags", "attachments", mode="before")
    @classmethod
    def _parse_json_fields(cls, value: object) -> object:
        if value is not None and isinstance(value, str):
            return json.loads(value)
        return value


class CreateInteractionRecordRequest(InteractionRecordBase):
    pass


class UpdateInteractionRecordRequest(BaseModel):
    healthcare_professional_id: Optional[int] = None
    hcp_name: Optional[str] = None
    interaction_date: Optional[datetime] = None
    interaction_time: Optional[str] = None
    interaction_type: Optional[str] = None
    hospital: Optional[str] = None
    specialization: Optional[str] = None
    products_discussed: Optional[List[str]] = None
    discussion_notes: Optional[str] = None
    objections_raised: Optional[List[str]] = None
    materials_shared: Optional[List[str]] = None
    samples_provided: Optional[int] = None
    sentiment: Optional[str] = None
    priority: Optional[str] = None
    follow_up_required: Optional[bool] = None
    follow_up_date: Optional[str] = None
    reminder_date: Optional[str] = None
    tags: Optional[List[str]] = None
    attachments: Optional[List[str]] = None
    interaction_summary: Optional[str] = None
    ai_confidence_score: Optional[float] = None
    created_by: Optional[str] = None
    tool_used: Optional[str] = None
    interaction_status: Optional[str] = None
    status: Optional[str] = None


class InteractionRecordResponse(InteractionRecordBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

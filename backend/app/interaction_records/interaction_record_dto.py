# backend/app/interaction_records/interaction_record_dto.py
from pydantic import BaseModel, ConfigDict, field_validator
from typing import List, Optional
from datetime import datetime
import json


class InteractionRecordBase(BaseModel):
    healthcare_professional_id: int
    interaction_type: Optional[str] = None
    date: Optional[datetime] = None
    time: Optional[str] = None
    attendees: Optional[List[str]] = None
    discussion: Optional[List[str]] = None
    summary: Optional[str] = None
    sentiment: Optional[str] = None
    materials: Optional[List[str]] = None
    samples: Optional[int] = None
    outcomes: Optional[List[str]] = None
    follow_up: Optional[str] = None

    @field_validator("attendees", "discussion", "materials", "outcomes", mode="before")
    @classmethod
    def _parse_json_fields(cls, value: object) -> object:
        """Deserialise JSON strings to lists when the client sends raw JSON."""
        if value is not None and isinstance(value, str):
            return json.loads(value)
        return value


class CreateInteractionRecordRequest(InteractionRecordBase):
    """Payload for creating a new interaction record."""
    pass


class UpdateInteractionRecordRequest(BaseModel):
    """Payload for partially updating an interaction record."""
    interaction_type: Optional[str] = None
    date: Optional[datetime] = None
    time: Optional[str] = None
    attendees: Optional[List[str]] = None
    discussion: Optional[List[str]] = None
    summary: Optional[str] = None
    sentiment: Optional[str] = None
    materials: Optional[List[str]] = None
    samples: Optional[int] = None
    outcomes: Optional[List[str]] = None
    follow_up: Optional[str] = None


class InteractionRecordResponse(InteractionRecordBase):
    """Interaction data returned from the API."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

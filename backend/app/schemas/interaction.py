from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


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
    interaction_summary: str = ""
    ai_confidence_score: float = 0.0
    created_by: str = "AI Assistant"
    tool_used: str = ""
    interaction_status: str = "draft"


class ToolOutput(BaseModel):
    tool_name: str
    success: bool
    message: str
    interaction_state: InteractionState
    updated_fields: List[str] = []

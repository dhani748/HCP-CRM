from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.graph.agent_graph import run_agent

router = APIRouter(prefix="/api/v1/ai", tags=["AI Agent"])


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str
    tool_executed: str
    tool_output: dict | None = None
    updated_fields: list[str] = []
    interaction_state: dict = {}
    search_results: list = []
    history_results: list = []
    execution_status: str = "completed"


@router.post("/agent/chat", response_model=ChatResponse)
async def agent_chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
):
    if not payload.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    result = await run_agent(db, payload.message.strip())
    return ChatResponse(
        reply=result.get("reply", ""),
        tool_executed=result.get("tool_executed", "none"),
        tool_output=result.get("tool_output"),
        updated_fields=result.get("updated_fields", []),
        interaction_state=result.get("interaction_state", {}),
        search_results=result.get("search_results", []),
        history_results=result.get("history_results", []),
        execution_status=result.get("execution_status", "completed"),
    )


@router.post("/agent/log-interaction", response_model=ChatResponse)
async def agent_log_interaction(
    payload: ChatRequest,
    db: Session = Depends(get_db),
):
    wrapped = f"Log interaction: {payload.message}"
    result = await run_agent(db, wrapped)
    return ChatResponse(
        reply=result.get("reply", ""),
        tool_executed=result.get("tool_executed", "none"),
        tool_output=result.get("tool_output"),
        updated_fields=result.get("updated_fields", []),
        interaction_state=result.get("interaction_state", {}),
        search_results=result.get("search_results", []),
        history_results=result.get("history_results", []),
        execution_status=result.get("execution_status", "completed"),
    )

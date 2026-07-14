import json
import os
from typing import Literal, Optional
from datetime import date, datetime, timedelta

from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.tools.interaction_tools import (
    log_interaction as _log_interaction,
    edit_interaction as _edit_interaction,
    search_hcp as _search_hcp,
    delete_interaction as _delete_interaction,
    interaction_history as _interaction_history,
    dashboard_summary as _dashboard_summary,
    todays_followups as _todays_followups,
    next_best_action as _next_best_action,
)
from app.schemas.interaction import InteractionState, ToolOutput

import logging
logger = logging.getLogger(__name__)


class AgentState(BaseModel):
    user_input: str = ""
    intent: str = ""
    tool_name: str = ""
    tool_params: dict = {}
    tool_output: Optional[ToolOutput] = None
    search_result: Optional[dict] = None
    history_result: Optional[dict] = None
    delete_result: Optional[dict] = None
    dashboard_result: Optional[dict] = None
    execution_status: str = "pending"
    reply: str = ""
    editing_interaction_id: Optional[int] = None
    conversation_history: list[dict] = []
    draft_mode: bool = False
    current_state: Optional[dict] = None


INTENT_SYSTEM_PROMPT = f"""You are an AI CRM assistant for Healthcare Professional interactions.

Today's date is {date.today().isoformat()}.

Your job is to analyze the user's message and determine their intent.
Choose ONE of the following intents:

1. LOG_INTERACTION - User wants to record a new interaction with an HCP
   - Tool: log_interaction
   - Extract ALL available fields from the conversation
   - Fields: hcp_name, interaction_date, interaction_time, interaction_type, hospital, specialization, discussion_notes, products_discussed, materials_shared, samples_provided, sentiment, priority, follow_up_required, follow_up_date, tags, interaction_summary, attendees

2. EDIT_INTERACTION - User wants to change specific fields of an existing interaction
   - Tool: edit_interaction
   - Extract ONLY the fields the user mentions. Do NOT include fields the user didn't ask about.
   - If the user says "change sentiment to negative", ONLY include sentiment.
   - If the user says "add Rahul as attendee", include attendees as an array.

3. SEARCH_HCP - User wants to find an HCP
   - Tool: search_hcp
   - Extract: id, name, hospital, specialization, city, email, phone
   - Support queries like "Find Dr Smith", "Find id 100", "Search Apollo Hospital"

4. DELETE_INTERACTION - User wants to delete an interaction
   - Tool: delete_interaction
   - Extract: interaction_id

5. INTERACTION_HISTORY - User wants to see past interactions
   - Tool: interaction_history
   - Extract: hcp_name, days (default 30)

6. DASHBOARD_SUMMARY - User wants an overview or summary of data
   - Tool: dashboard_summary
   - Params: none

7. TODAYS_FOLLOWUPS - User wants to see follow-ups scheduled for today
   - Tool: todays_followups
   - Params: none

8. NEXT_BEST_ACTION - User asks what to do next or for suggestions
   - Tool: next_best_action
   - Params: none

9. GENERAL_QUERY - User is asking a general question, greeting, or chit-chat
   - Tool: none
   - Params: none

Return ONLY valid JSON with fields: intent, tool_name, explanation, params
The params should be a flat JSON object with the extracted values.

IMPORTANT:
- For EDIT_INTERACTION, only include fields the user explicitly wants to change.
- For LOG_INTERACTION, extract as many fields as possible from context, using sensible defaults.
- If hcp_name is not provided but is available from conversation history, use that.
- Normalize lists: "Product X" should become ["Product X"] not "Product X".
- Calculate relative dates (tomorrow, next week, after 7 days) into actual ISO dates.
- "Today" is {date.today().isoformat()}.

Examples:
User: "Log today's interaction with Dr Sharma. We discussed the new cardiac drug. He was positive."
Response: {{"intent": "LOG_INTERACTION", "tool_name": "log_interaction", "explanation": "Logging interaction with Dr Sharma", "params": {{"hcp_name": "Dr Sharma", "interaction_date": "{date.today().isoformat()}", "interaction_type": "visit", "discussion_notes": "Discussed the new cardiac drug", "products_discussed": ["new cardiac drug"], "sentiment": "positive"}}}}

User: "Change sentiment to negative"
Response: {{"intent": "EDIT_INTERACTION", "tool_name": "edit_interaction", "explanation": "Changing sentiment to negative", "params": {{"sentiment": "negative"}}}}

User: "Find Dr Amit Gupta"
Response: {{"intent": "SEARCH_HCP", "tool_name": "search_hcp", "explanation": "Searching for Dr Amit Gupta", "params": {{"name": "Dr Amit Gupta"}}}}

User: "Delete interaction 5"
Response: {{"intent": "DELETE_INTERACTION", "tool_name": "delete_interaction", "explanation": "Deleting interaction 5", "params": {{"interaction_id": 5}}}}

User: "Show me the dashboard"
Response: {{"intent": "DASHBOARD_SUMMARY", "tool_name": "dashboard_summary", "explanation": "Showing dashboard summary", "params": {{}}}}

User: "What follow-ups are due today?"
Response: {{"intent": "TODAYS_FOLLOWUPS", "tool_name": "todays_followups", "explanation": "Showing today's follow-ups", "params": {{}}}}

User: "Hello"
Response: {{"intent": "GENERAL_QUERY", "tool_name": "none", "explanation": "General greeting", "params": {{}}}}

Return ONLY the JSON, no other text."""


FORMAT_SYSTEM_PROMPT = """You are an AI CRM assistant. Given the tool execution result, generate a friendly, professional response for the user.

Rules:
- Be concise and professional (2-3 sentences max)
- Mention what was done
- Include relevant details
- Use natural language
- Do NOT add markdown formatting
- If successful, confirm what changed
- If failed, apologize and suggest next steps"""


def create_agent(db: Session, editing_interaction_id: Optional[int] = None, draft_mode: bool = False, current_state: Optional[dict] = None):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable not set")

    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=api_key)

    workflow = StateGraph(AgentState)

    async def detect_intent(state: AgentState) -> AgentState:
        context = state.user_input
        if state.editing_interaction_id:
            context = f"[Editing interaction {state.editing_interaction_id}] {context}"

        messages = [
            SystemMessage(content=INTENT_SYSTEM_PROMPT),
            HumanMessage(content=context),
        ]
        result = await llm.ainvoke(messages)
        content = result.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[-1]
            content = content.rsplit("\n", 1)[0]
            if content.endswith("```"):
                content = content[:-3]
            if content.startswith("json"):
                content = content[4:]

        try:
            parsed = json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"detect_intent: Failed to parse LLM response: {content[:200]}")
            state.intent = "GENERAL_QUERY"
            state.tool_name = "none"
            state.tool_params = {}
            state.execution_status = "intent_detected"
            return state

        state.intent = parsed.get("intent", "GENERAL_QUERY")
        state.tool_name = parsed.get("tool_name", "none")
        state.tool_params = parsed.get("params", {})

        if state.intent == "EDIT_INTERACTION" and editing_interaction_id:
            state.tool_params["interaction_id"] = editing_interaction_id

        state.execution_status = "intent_detected"
        return state

    def _build_draft_log_state(params: dict) -> InteractionState:
        """Build InteractionState from extracted params without touching DB."""
        today = date.today().isoformat()
        products = params.get("products_discussed", [])
        if isinstance(products, str):
            products = [p.strip() for p in products.split(",") if p.strip()]
        materials = params.get("materials_shared", [])
        if isinstance(materials, str):
            materials = [m.strip() for m in materials.split(",") if m.strip()]
        tags = params.get("tags", [])
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(",") if t.strip()]
        attendees = params.get("attendees", [])
        if isinstance(attendees, str):
            attendees = [a.strip() for a in attendees.split(",") if a.strip()]

        return InteractionState(
            hcp_name=params.get("hcp_name", ""),
            interaction_date=params.get("interaction_date", today),
            interaction_time=params.get("interaction_time", ""),
            interaction_type=params.get("interaction_type", "visit"),
            hospital=params.get("hospital", ""),
            specialization=params.get("specialization", ""),
            products_discussed=products,
            discussion_notes=params.get("discussion_notes", ""),
            materials_shared=materials,
            samples_provided=params.get("samples_provided", 0),
            sentiment=params.get("sentiment", "neutral"),
            priority=params.get("priority", "medium"),
            follow_up_required=params.get("follow_up_required", False),
            follow_up_date=params.get("follow_up_date", ""),
            tags=tags,
            attendees=attendees,
            interaction_summary=params.get("interaction_summary", ""),
            created_by="AI Assistant",
            tool_used="log_interaction",
            interaction_status="draft",
        )

    def _build_draft_edit_state(params: dict) -> tuple[InteractionState, list[str]]:
        """Build a sparse InteractionState for edits without DB touch."""
        allowed = {
            "interaction_type", "hospital", "specialization", "products_discussed",
            "discussion_notes", "materials_shared", "samples_provided",
            "sentiment", "priority", "follow_up_required", "follow_up_date",
            "tags", "interaction_summary", "interaction_status", "hcp_name",
            "interaction_time", "attendees", "interaction_date",
        }
        filtered: dict = {}
        updated_fields: list[str] = []
        for k, v in params.items():
            if k in allowed and v is not None:
                if k in ("products_discussed", "materials_shared", "tags", "attendees"):
                    if isinstance(v, str):
                        v = [x.strip() for x in v.split(",") if x.strip()]
                    elif not isinstance(v, list):
                        v = [str(v)] if v else []
                filtered[k] = v
                updated_fields.append(k)
        return InteractionState(**filtered), updated_fields

    async def execute_tool_node(state: AgentState) -> AgentState:
        tool = state.tool_name
        params = state.tool_params
        logger.info(f"execute_tool: tool={tool} draft={state.draft_mode} params={json.dumps(params, default=str)}")

        # DRAFT MODE: do not touch DB for log/edit intents, just return structured state
        if state.draft_mode and tool in ("log_interaction", "edit_interaction"):
            try:
                if tool == "log_interaction":
                    istate = _build_draft_log_state(params)
                    state.tool_output = ToolOutput(
                        tool_name="log_interaction",
                        success=True,
                        message=f"Extracted interaction details for {istate.hcp_name or 'the HCP'}.",
                        interaction_state=istate,
                        updated_fields=[k for k, v in istate.model_dump().items() if v not in (None, "", [], 0, False)],
                    )
                elif tool == "edit_interaction":
                    istate, updated_fields = _build_draft_edit_state(params)
                    state.tool_output = ToolOutput(
                        tool_name="edit_interaction",
                        success=True,
                        message=f"Prepared {len(updated_fields)} field update(s)." if updated_fields else "No changes detected.",
                        interaction_state=istate,
                        updated_fields=updated_fields,
                    )
            except Exception as e:
                logger.error(f"execute_tool: Draft mode error in {tool}: {e}", exc_info=True)
                state.tool_output = ToolOutput(
                    tool_name=tool,
                    success=False,
                    message="Failed to extract interaction details.",
                    interaction_state=InteractionState(),
                )
            state.execution_status = "tool_executed"
            return state

        try:
            if tool == "log_interaction":
                result = _log_interaction(db=db, **params)
                state.tool_output = result

            elif tool == "edit_interaction":
                result = _edit_interaction(db=db, **params)
                state.tool_output = result

            elif tool == "search_hcp":
                result = _search_hcp(db=db, **params)
                state.search_result = result

            elif tool == "delete_interaction":
                result = _delete_interaction(db=db, **params)
                state.delete_result = result

            elif tool == "interaction_history":
                result = _interaction_history(db=db, **params)
                state.history_result = result

            elif tool == "dashboard_summary":
                result = _dashboard_summary(db=db)
                state.dashboard_result = result

            elif tool == "todays_followups":
                result = _todays_followups(db=db)
                state.history_result = result

            elif tool == "next_best_action":
                result = _next_best_action(db=db)
                state.dashboard_result = result

        except Exception as e:
            logger.error(f"execute_tool: Unhandled error in {tool}: {e}", exc_info=True)
            state.tool_output = ToolOutput(
                tool_name=tool,
                success=False,
                message="An error occurred while processing your request.",
                interaction_state=InteractionState(),
            )

        state.execution_status = "tool_executed"
        return state

    async def format_response(state: AgentState) -> AgentState:
        if state.intent == "GENERAL_QUERY":
            messages = [
                SystemMessage(content="You are a helpful CRM assistant. Respond to the user's greeting or question briefly and professionally."),
                HumanMessage(content=state.user_input),
            ]
            result = await llm.ainvoke(messages)
            state.reply = result.content
            state.execution_status = "completed"
            return state

        if state.tool_output:
            output = state.tool_output
            context = f"""
Tool executed: {output.tool_name}
Success: {output.success}
Message: {output.message}
Updated fields: {output.updated_fields}
Interaction state: {json.dumps(output.interaction_state.model_dump(), indent=2)}
"""
        elif state.search_result:
            sr = state.search_result
            context = f"""
Tool executed: {sr['tool_name']}
Success: {sr['success']}
Message: {sr['message']}
Results: {json.dumps(sr['hcps'], indent=2)}
"""
        elif state.history_result:
            hr = state.history_result
            context = f"""
Tool executed: {hr['tool_name']}
Success: {hr['success']}
Message: {hr['message']}
Data: {json.dumps(hr, indent=2)}
"""
        elif state.delete_result:
            dr = state.delete_result
            context = f"""
Tool executed: {dr['tool_name']}
Success: {dr['success']}
Message: {dr['message']}
"""
        elif state.dashboard_result:
            dr = state.dashboard_result
            context = f"""
Tool executed: {dr['tool_name']}
Success: {dr['success']}
Message: {dr['message']}
Data: {json.dumps(dr, indent=2)}
"""
        else:
            context = "No tool was executed."

        messages = [
            SystemMessage(content=FORMAT_SYSTEM_PROMPT),
            HumanMessage(content=f"User query: {state.user_input}\n\nTool result:\n{context}"),
        ]
        result = await llm.ainvoke(messages)
        state.reply = result.content
        state.execution_status = "completed"
        return state

    def route_after_intent(state: AgentState) -> Literal["execute_tool", "format_response"]:
        if state.tool_name == "none":
            return "format_response"
        return "execute_tool"

    workflow.add_node("detect_intent", detect_intent)
    workflow.add_node("execute_tool", execute_tool_node)
    workflow.add_node("format_response", format_response)

    workflow.set_entry_point("detect_intent")
    workflow.add_conditional_edges("detect_intent", route_after_intent)
    workflow.add_edge("execute_tool", "format_response")
    workflow.add_edge("format_response", END)

    return workflow.compile()


async def run_agent(
    db: Session,
    user_input: str,
    editing_interaction_id: Optional[int] = None,
    draft_mode: bool = False,
    current_state: Optional[dict] = None,
) -> dict:
    agent = create_agent(
        db,
        editing_interaction_id=editing_interaction_id,
        draft_mode=draft_mode,
        current_state=current_state,
    )

    initial_state = AgentState(
        user_input=user_input,
        editing_interaction_id=editing_interaction_id,
        execution_status="pending",
        draft_mode=draft_mode,
        current_state=current_state,
    )

    try:
        result = await agent.ainvoke(initial_state)
    except Exception as e:
        logger.error(f"run_agent: Agent execution failed: {e}", exc_info=True)
        return {
            "reply": "I encountered an error processing your request.",
            "tool_executed": "none",
            "tool_output": None,
            "updated_fields": [],
            "interaction_state": InteractionState().model_dump(),
            "execution_status": "error",
        }

    tool_output = result.get("tool_output")
    search_result = result.get("search_result")
    history_result = result.get("history_result")
    delete_result = result.get("delete_result")
    dashboard_result = result.get("dashboard_result")

    response: dict = {
        "reply": result.get("reply", ""),
        "tool_executed": result.get("tool_name", "none"),
        "tool_output": None,
        "updated_fields": [],
        "interaction_state": InteractionState().model_dump(),
        "execution_status": result.get("execution_status", "completed"),
        "editing_interaction_id": result.get("editing_interaction_id"),
    }

    if tool_output:
        response["tool_output"] = tool_output.model_dump()
        response["updated_fields"] = tool_output.updated_fields
        response["interaction_state"] = tool_output.interaction_state.model_dump()

    if search_result:
        response["tool_output"] = search_result
        response["search_results"] = search_result.get("hcps", [])

    if history_result:
        response["tool_output"] = history_result
        response["history_results"] = history_result.get("interactions", [])

    if delete_result:
        response["tool_output"] = delete_result

    if dashboard_result:
        response["tool_output"] = dashboard_result

    return response

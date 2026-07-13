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
    interaction_history as _interaction_history,
    schedule_follow_up as _schedule_follow_up,
)
from app.schemas.interaction import InteractionState, ToolOutput


class AgentState(BaseModel):
    user_input: str = ""
    intent: str = ""
    tool_name: str = ""
    tool_params: dict = {}
    tool_output: Optional[ToolOutput] = None
    search_result: Optional[dict] = None
    history_result: Optional[dict] = None
    execution_status: str = "pending"
    reply: str = ""


INTENT_SYSTEM_PROMPT = f"""You are an AI CRM assistant for Healthcare Professional interactions.

Today's date is {date.today().isoformat()}.

Your job is to analyze the user's message and determine their intent.
Choose ONE of the following intents:

1. LOG_INTERACTION - User wants to record a new interaction with an HCP
   - Tool: log_interaction
   - Extract: hcp_name, interaction_date, interaction_time, interaction_type, hospital, specialization, products_discussed, discussion_notes, objections_raised, materials_shared, samples_provided, sentiment, priority, follow_up_required, follow_up_date, reminder_date, tags, interaction_summary

2. EDIT_INTERACTION - User wants to change specific fields of an existing interaction
   - Tool: edit_interaction
   - Extract ONLY the fields the user mentions. Do NOT include fields the user didn't ask about.

3. SEARCH_HCP - User wants to find an HCP
   - Tool: search_hcp
   - Extract: name, hospital, specialization, city

4. INTERACTION_HISTORY - User wants to see past interactions
   - Tool: interaction_history
   - Extract: hcp_name, days (default 30)

5. SCHEDULE_FOLLOW_UP - User wants to schedule a follow-up
   - Tool: schedule_follow_up
   - Extract: hcp_name, follow_up_date, reminder_date, priority, notes

6. GENERAL_QUERY - User is asking a general question or greeting
   - Tool: none
   - No params needed

Return ONLY valid JSON with fields: intent, tool_name, explanation, params
The params should be a flat JSON object with the extracted values.

Examples:
User: "Log today's interaction with Dr Sharma. We discussed the new cardiac drug. He was positive."
Response: {{"intent": "LOG_INTERACTION", "tool_name": "log_interaction", "explanation": "Logging interaction with Dr Sharma", "params": {{"hcp_name": "Dr Sharma", "interaction_date": "{date.today().isoformat()}", "interaction_type": "visit", "discussion_notes": "Discussed the new cardiac drug", "sentiment": "positive"}}}}

User: "Change follow-up date to next Monday."
Response: {{"intent": "EDIT_INTERACTION", "tool_name": "edit_interaction", "explanation": "Updating follow-up date", "params": {{"follow_up_date": "{ (date.today() + timedelta(days=(7 - date.today().weekday()))).isoformat() if date.today().weekday() < 7 else date.today().isoformat() }"}}}}

User: "Find Dr Amit Gupta."
Response: {{"intent": "SEARCH_HCP", "tool_name": "search_hcp", "explanation": "Searching for Dr Amit Gupta", "params": {{"name": "Dr Amit Gupta"}}}}

User: "Show previous interactions with Dr Sharma."
Response: {{"intent": "INTERACTION_HISTORY", "tool_name": "interaction_history", "explanation": "Showing interaction history for Dr Sharma", "params": {{"hcp_name": "Dr Sharma", "days": 30}}}}

User: "Schedule reminder after seven days for Dr Sharma."
Response: {{"intent": "SCHEDULE_FOLLOW_UP", "tool_name": "schedule_follow_up", "explanation": "Scheduling follow-up for Dr Sharma", "params": {{"hcp_name": "Dr Sharma", "follow_up_date": "{(date.today() + timedelta(days=7)).isoformat()}", "reminder_date": "{(date.today() + timedelta(days=7)).isoformat()}"}}}}

User: "Hello"
Response: {{"intent": "GENERAL_QUERY", "tool_name": "none", "explanation": "General greeting", "params": {{}}}}

IMPORTANT: For EDIT_INTERACTION, only include fields the user explicitly wants to change.
For LOG_INTERACTION, extract as many fields as possible from context, using sensible defaults.
Calculate relative dates (tomorrow, next week, after 7 days) into actual ISO dates.

Return ONLY the JSON, no other text."""


FORMAT_SYSTEM_PROMPT = """You are an AI CRM assistant. Given the tool execution result, generate a friendly, professional response for the user.

Rules:
- Be concise and professional
- Mention what was done
- Include relevant details
- Use natural language
- Do NOT add markdown formatting
- Maximum 3-4 sentences

User will provide: tool_name, success, message, and the state."""


def create_agent(db: Session):
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable not set")

    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=api_key)

    workflow = StateGraph(AgentState)

    async def detect_intent(state: AgentState) -> AgentState:
        messages = [
            SystemMessage(content=INTENT_SYSTEM_PROMPT),
            HumanMessage(content=state.user_input),
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

        parsed = json.loads(content)
        state.intent = parsed.get("intent", "GENERAL_QUERY")
        state.tool_name = parsed.get("tool_name", "none")
        state.tool_params = parsed.get("params", {})
        state.execution_status = "intent_detected"
        return state

    async def execute_tool_node(state: AgentState) -> AgentState:
        tool = state.tool_name
        params = state.tool_params

        if tool == "log_interaction":
            result = _log_interaction(db=db, **params)
            state.tool_output = result

        elif tool == "edit_interaction":
            result = _edit_interaction(db=db, **params)
            state.tool_output = result

        elif tool == "search_hcp":
            result = _search_hcp(db=db, **params)
            state.search_result = result

        elif tool == "interaction_history":
            result = _interaction_history(db=db, **params)
            state.history_result = result

        elif tool == "schedule_follow_up":
            result = _schedule_follow_up(db=db, **params)
            state.tool_output = result

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
Interactions: {json.dumps(hr['interactions'], indent=2)}
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
    workflow.add_conditional_edges(
        "detect_intent",
        route_after_intent,
    )
    workflow.add_edge("execute_tool", "format_response")
    workflow.add_edge("format_response", END)

    return workflow.compile()


async def run_agent(db: Session, user_input: str) -> dict:
    agent = create_agent(db)

    initial_state = AgentState(
        user_input=user_input,
        execution_status="pending",
    )

    try:
        result = await agent.ainvoke(initial_state)
    except Exception as e:
        return {
            "reply": f"I encountered an error processing your request: {str(e)}",
            "tool_executed": "none",
            "tool_output": None,
            "updated_fields": [],
            "interaction_state": InteractionState().model_dump(),
        }

    tool_output = result.get("tool_output")
    search_result = result.get("search_result")
    history_result = result.get("history_result")

    response: dict = {
        "reply": result.get("reply", ""),
        "tool_executed": result.get("tool_name", "none"),
        "tool_output": None,
        "updated_fields": [],
        "interaction_state": InteractionState().model_dump(),
        "execution_status": result.get("execution_status", "completed"),
    }

    if tool_output:
        response["tool_output"] = tool_output.model_dump()
        response["updated_fields"] = tool_output.updated_fields
        response["interaction_state"] = tool_output.interaction_state.model_dump()

    if search_result:
        response["tool_output"] = search_result
        if "hcps" in search_result:
            response["search_results"] = search_result["hcps"]

    if history_result:
        response["tool_output"] = history_result
        if "interactions" in history_result:
            response["history_results"] = history_result["interactions"]

    return response

import os
from datetime import date
from functools import lru_cache

from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from sqlalchemy.orm import Session

from app.healthcare_professionals.healthcare_professional import HealthcareProfessional
from app.interaction_records.interaction_record import InteractionRecord


def _build_agent(*, api_key: str, db: Session):
    @tool(description="Retrieve all Healthcare Professionals from the database.")
    def get_all_hcps() -> str:
        hcps = db.query(HealthcareProfessional).all()
        if not hcps:
            return "No healthcare professionals found."
        lines = []
        for h in hcps:
            lines.append(
                f"ID: {h.id}, Name: {h.name}, Specialty: {h.specialty or 'N/A'}, "
                f"Hospital: {h.hospital or 'N/A'}, City: {h.city or 'N/A'}, "
                f"Email: {h.email or 'N/A'}, Phone: {h.phone or 'N/A'}"
            )
        return "\n".join(lines)

    @tool(description="Retrieve all interaction records, most recent first.")
    def get_all_interactions() -> str:
        records = (
            db.query(InteractionRecord)
            .order_by(InteractionRecord.date.desc())
            .all()
        )
        if not records:
            return "No interaction records found."
        lines = []
        for r in records:
            hcp_name = r.healthcare_professional.name if r.healthcare_professional else "Unknown"
            d = r.date.strftime("%Y-%m-%d") if r.date else "N/A"
            lines.append(
                f"ID: {r.id}, HCP: {hcp_name}, Type: {r.interaction_type}, "
                f"Date: {d}, Summary: {r.summary or 'N/A'}"
            )
        return "\n".join(lines)

    @tool(description="Retrieve interactions recorded today or later.")
    def get_today_interactions() -> str:
        today = date.today()
        records = (
            db.query(InteractionRecord)
            .filter(InteractionRecord.date >= today)
            .order_by(InteractionRecord.date.desc())
            .all()
        )
        if not records:
            return "No interactions recorded today."
        lines = []
        for r in records:
            hcp_name = r.healthcare_professional.name if r.healthcare_professional else "Unknown"
            d = r.date.strftime("%Y-%m-%d") if r.date else "N/A"
            lines.append(
                f"ID: {r.id}, HCP: {hcp_name}, Type: {r.interaction_type}, "
                f"Date: {d}, Summary: {r.summary or 'N/A'}"
            )
        return "\n".join(lines)

    @tool(description="Retrieve HCPs that have follow-up actions pending.")
    def get_hcps_needing_followup() -> str:
        records = (
            db.query(InteractionRecord)
            .filter(InteractionRecord.follow_up.isnot(None))
            .filter(InteractionRecord.follow_up != "")
            .order_by(InteractionRecord.date.desc())
            .all()
        )
        if not records:
            return "No HCPs currently need follow-up."
        seen = set()
        lines = []
        for r in records:
            if r.healthcare_professional_id not in seen:
                seen.add(r.healthcare_professional_id)
                hcp_name = r.healthcare_professional.name if r.healthcare_professional else "Unknown"
                lines.append(
                    f"HCP: {hcp_name} (ID: {r.healthcare_professional_id}) — "
                    f"Follow-up: {r.follow_up} (Last interaction: {r.date.strftime('%Y-%m-%d') if r.date else 'N/A'})"
                )
        return "\n".join(lines)

    @tool(description="Return the total count of Healthcare Professionals.")
    def count_all_hcps() -> str:
        count = db.query(HealthcareProfessional).count()
        return f"Total healthcare professionals: {count}"

    tools = [
        get_all_hcps,
        get_all_interactions,
        get_today_interactions,
        get_hcps_needing_followup,
        count_all_hcps,
    ]

    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=api_key)

    system_prompt = (
        "You are a helpful CRM assistant for managing Healthcare Professional (HCP) interactions. "
        "Answer questions about HCPs, interaction records, follow-ups, and summaries. "
        "Use the provided tools to look up information from the database. "
        "Be concise and accurate. If you don't know the answer, say so."
    )

    agent = create_react_agent(llm, tools, prompt=system_prompt)
    return agent


@lru_cache(maxsize=1)
def _get_api_key() -> str | None:
    return os.environ.get("GROQ_API_KEY")


async def process_ai_message(message: str, db: Session) -> dict:
    api_key = _get_api_key()
    if not api_key:
        return {
            "reply": (
                "AI assistant is not configured. "
                "Please set the GROQ_API_KEY environment variable and restart the server."
            )
        }

    try:
        agent = _build_agent(api_key=api_key, db=db)
    except Exception as e:
        return {"reply": f"Failed to initialize AI assistant: {e}"}

    try:
        result = await agent.ainvoke(
            {"messages": [HumanMessage(content=message)]}
        )
        reply = result["messages"][-1].content
    except Exception as e:
        return {"reply": f"AI assistant error: {e}"}

    return {"reply": reply}

import os
import json
from datetime import date, datetime, timedelta
from functools import lru_cache

from langchain_core.tools import tool
from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.healthcare_professionals.healthcare_professional import HealthcareProfessional
from app.interaction_records.interaction_record import InteractionRecord


def _build_agent(*, api_key: str, db: Session, current_page: str = ""):
    @tool(description="Retrieve all Healthcare Professionals from the database.")
    def get_all_hcps() -> str:
        """Return every HCP record with full details."""
        hcps = db.query(HealthcareProfessional).all()
        if not hcps:
            return "No healthcare professionals found."
        lines = []
        for h in hcps:
            lines.append(
                f"ID: {h.id}, Name: {h.name}, Specialty: {h.specialty or 'N/A'}, "
                f"Hospital: {h.hospital or 'N/A'}, City: {h.city or 'N/A'}, "
                f"Email: {h.email or 'N/A'}, Phone: {h.phone or 'N/A'}, "
                f"Active: {h.active}"
            )
        return "\n".join(lines)

    @tool(description="Search Healthcare Professionals by name, specialty, or hospital.")
    def search_hcps(query: str) -> str:
        """Search for HCPs matching a keyword across name, specialty, and hospital fields."""
        q = f"%{query}%"
        hcps = (
            db.query(HealthcareProfessional)
            .filter(
                HealthcareProfessional.name.ilike(q)
                | HealthcareProfessional.specialty.ilike(q)
                | HealthcareProfessional.hospital.ilike(q)
                | HealthcareProfessional.city.ilike(q)
            )
            .all()
        )
        if not hcps:
            return f"No healthcare professionals found matching '{query}'."
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
        """Return every interaction record with HCP name, type, date, and summary."""
        records = (
            db.query(InteractionRecord)
            .order_by(InteractionRecord.interaction_date.desc())
            .all()
        )
        if not records:
            return "No interaction records found."
        lines = []
        for r in records:
            hcp_name = r.healthcare_professional.name if r.healthcare_professional else "Unknown"
            d = r.interaction_date.strftime("%Y-%m-%d") if r.interaction_date else "N/A"
            lines.append(
                f"ID: {r.id}, HCP: {hcp_name}, Type: {r.interaction_type}, "
                f"Date: {d}, Summary: {r.interaction_summary or 'N/A'}, "
                f"Status: {r.status or 'completed'}"
            )
        return "\n".join(lines)

    @tool(description="Search interaction records by HCP name, type, status, or date range.")
    def search_interactions(
        query: str = "",
        start_date: str = "",
        end_date: str = "",
        status_filter: str = "",
    ) -> str:
        """Find interactions matching keyword, date range, or status."""
        q = db.query(InteractionRecord)

        if query:
            like = f"%{query}%"
            matching_hcps = (
                db.query(HealthcareProfessional.id)
                .filter(HealthcareProfessional.name.ilike(like))
                .subquery()
            )
            q = q.filter(
                InteractionRecord.healthcare_professional_id.in_(matching_hcps)
                | InteractionRecord.interaction_type.ilike(like)
            )
        if start_date:
            try:
                sd = datetime.strptime(start_date, "%Y-%m-%d")
                q = q.filter(InteractionRecord.interaction_date >= sd)
            except ValueError:
                return f"Error: Invalid start_date format '{start_date}'. Use YYYY-MM-DD."
        if end_date:
            try:
                ed = datetime.strptime(end_date, "%Y-%m-%d")
                q = q.filter(InteractionRecord.interaction_date <= ed)
            except ValueError:
                return f"Error: Invalid end_date format '{end_date}'. Use YYYY-MM-DD."
        if status_filter:
            q = q.filter(InteractionRecord.status == status_filter)

        records = q.order_by(InteractionRecord.interaction_date.desc()).all()
        if not records:
            return "No interaction records found matching the criteria."
        lines = []
        for r in records:
            hcp_name = r.healthcare_professional.name if r.healthcare_professional else "Unknown"
            d = r.interaction_date.strftime("%Y-%m-%d") if r.interaction_date else "N/A"
            lines.append(
                f"ID: {r.id}, HCP: {hcp_name}, Type: {r.interaction_type}, "
                f"Date: {d}, Status: {r.status or 'completed'}, "
                f"Summary: {r.interaction_summary or 'N/A'}"
            )
        return "\n".join(lines)

    @tool(description="Retrieve interactions recorded today.")
    def get_today_interactions() -> str:
        """List all interactions whose date is today or later."""
        today = date.today()
        records = (
            db.query(InteractionRecord)
            .filter(InteractionRecord.interaction_date >= today)
            .order_by(InteractionRecord.interaction_date.desc())
            .all()
        )
        if not records:
            return "No interactions recorded today."
        lines = []
        for r in records:
            hcp_name = r.healthcare_professional.name if r.healthcare_professional else "Unknown"
            d = r.interaction_date.strftime("%Y-%m-%d") if r.interaction_date else "N/A"
            lines.append(
                f"ID: {r.id}, HCP: {hcp_name}, Type: {r.interaction_type}, "
                f"Date: {d}, Summary: {r.interaction_summary or 'N/A'}"
            )
        return "\n".join(lines)

    @tool(description="Retrieve HCPs that have follow-up actions pending.")
    def get_hcps_needing_followup() -> str:
        """Find HCPs with interactions that have a non-empty follow-up date set."""
        records = (
            db.query(InteractionRecord)
            .filter(InteractionRecord.follow_up_date.isnot(None))
            .filter(InteractionRecord.follow_up_date != "")
            .order_by(InteractionRecord.interaction_date.desc())
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
                    f"HCP: {hcp_name} (ID: {r.healthcare_professional_id}) \u2014 "
                    f"Follow-up: {r.follow_up_date} (Last interaction: {r.interaction_date.strftime('%Y-%m-%d') if r.interaction_date else 'N/A'})"
                )
        return "\n".join(lines)

    @tool(description="Return the total count of Healthcare Professionals.")
    def count_all_hcps() -> str:
        """Return the number of HCPs registered."""
        count = db.query(HealthcareProfessional).count()
        return f"Total healthcare professionals: {count}"

    @tool(description="Return the total count of interaction records.")
    def count_all_interactions() -> str:
        """Return the number of interactions recorded."""
        count = db.query(InteractionRecord).count()
        return f"Total interactions: {count}"

    @tool(description="Retrieve recent activity across HCPs and interactions.")
    def get_recent_activity(days: int = 7) -> str:
        """Show recent interactions from the last N days (default 7)."""
        since = date.today() - timedelta(days=days)
        records = (
            db.query(InteractionRecord)
            .filter(InteractionRecord.interaction_date >= since)
            .order_by(InteractionRecord.interaction_date.desc())
            .all()
        )
        if not records:
            return f"No activity in the last {days} days."
        lines = [f"Activity from the last {days} days ({len(records)} interactions):"]
        for r in records:
            hcp_name = r.healthcare_professional.name if r.healthcare_professional else "Unknown"
            d = r.interaction_date.strftime("%Y-%m-%d") if r.interaction_date else "N/A"
            lines.append(
                f"  \u2022 {d} \u2014 {hcp_name} ({r.interaction_type})"
                f"{' - ' + r.interaction_summary if r.interaction_summary else ''}"
            )
        return "\n".join(lines)

    @tool(description="Return the count of interactions needing follow-up.")
    def count_pending_followups() -> str:
        """Count distinct HCPs with pending follow-ups."""
        records = (
            db.query(InteractionRecord)
            .filter(InteractionRecord.follow_up_date.isnot(None))
            .filter(InteractionRecord.follow_up_date != "")
            .all()
        )
        seen = set()
        for r in records:
            seen.add(r.healthcare_professional_id)
        return f"Pending follow-ups: {len(seen)} HCPs."

    tools = [
        get_all_hcps,
        search_hcps,
        get_all_interactions,
        search_interactions,
        get_today_interactions,
        get_hcps_needing_followup,
        count_all_hcps,
        count_all_interactions,
        count_pending_followups,
        get_recent_activity,
    ]

    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=api_key)

    today = date.today().isoformat()
    system_prompt = (
        f"You are an AI CRM Copilot for a Healthcare Professional (HCP) CRM system. "
        f"Today's date is {today}.\n\n"
        f"The user is currently on the '{current_page}' page.\n\n"
        "YOUR ROLE:\n"
        "- Understand natural language requests about HCPs and interactions\n"
        "- Navigate to the correct page\n"
        "- Extract information and populate forms\n"
        "- Answer questions using read-only data\n\n"
        "CRITICAL RULES - NEVER VIOLATE:\n"
        "1. NEVER create, update, or delete any records. You only have READ tools.\n"
        "2. If the user asks to create an HCP: extract all available details, list what's needed, "
        "and tell them to go to the Add HCP page to fill in the form.\n"
        "3. If the user asks to create an interaction: extract all available details, list what's needed, "
        "and tell them to go the Log Interaction page to fill in the form.\n"
        "4. If the user provides a name with missing fields, say: "
        "'I can help create a new Healthcare Professional. Please provide: "
        "\u2022 Full Name\n\u2022 Specialty\n\u2022 Hospital\n\u2022 City\n\u2022 Email\n\u2022 Phone Number'\n"
        "5. If asking for missing info, use bullet points. Be concise. Never long paragraphs.\n"
        "6. Always use tools to fetch real data. Never make up information.\n"
        "7. When searching or listing, format responses with bullet points.\n"
        "8. Use emoji sparingly if at all. Professional tone only.\n\n"
        "RESPONSE STYLE:\n"
        "- Concise, structured, bullet-point driven\n"
        "- Never more than 5-6 lines unless detailed data is requested\n"
        "- Always offer next steps"
    )

    agent = create_react_agent(llm, tools, prompt=system_prompt)
    return agent


@lru_cache(maxsize=1)
def _get_api_key() -> str | None:
    return os.environ.get("GROQ_API_KEY")


async def process_ai_message(message: str, db: Session, current_page: str = "") -> dict:
    api_key = _get_api_key()
    if not api_key:
        return {
            "reply": (
                "AI assistant is not configured. "
                "Please set the GROQ_API_KEY environment variable and restart the server."
            )
        }

    try:
        agent = _build_agent(api_key=api_key, db=db, current_page=current_page)
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


async def process_extract_interaction(text: str) -> dict:
    """Use Groq LLM to extract structured interaction data from natural language description."""
    api_key = _get_api_key()
    if not api_key:
        return {
            "hcpName": "",
            "interactionType": "",
            "date": "",
            "time": "",
            "discussion": [],
            "summary": "",
            "sentiment": "neutral",
            "materialsShared": [],
            "followUp": "",
            "outcomes": [],
            "notes": "",
        }

    try:
        llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=api_key)

        today = date.today().isoformat()
        system_prompt = (
            f"Today's date is {today}. "
            "You are an AI assistant that extracts structured interaction data from CRM notes. "
            "Given a user's natural language description of a meeting, call, or interaction with a Healthcare Professional, "
            "extract the following fields and return ONLY valid JSON (no markdown, no code fences):\n\n"
            "{\n"
            '  "hcpName": "Full name of the HCP (e.g. Dr. Smith)",\n'
            '  "interactionType": "call | visit | email | meeting (infer from context)",\n'
            '  "date": "YYYY-MM-DD (infer today if not specified)",\n'
            '  "time": "HH:MM (if mentioned, otherwise empty string)",\n'
            '  "discussion": ["List of topics or points discussed"],\n'
            '  "summary": "Brief 1-2 sentence summary of the interaction",\n'
            '  "sentiment": "positive | neutral | negative (based on tone)",\n'
            '  "materialsShared": ["List of materials or samples shared"],\n'
            '  "followUp": "YYYY-MM-DD (calculated follow-up date if mentioned like after 2 weeks, otherwise empty string)",\n'
            '  "outcomes": ["List of outcomes or action items"],\n'
            '  "notes": "Additional notes"\n'
            "}\n\n"
            "If a field is not mentioned, use null or an empty string/array as appropriate. "
            "For relative dates like 'tomorrow' or 'next week', calculate the actual date. "
            "For 'after 2 weeks', calculate the exact follow-up date. "
            "Be precise and only extract information explicitly stated or clearly implied."
        )

        result = await llm.ainvoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text},
        ])

        content = result.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[-1]
            content = content.rsplit("\n", 1)[0]
            if content.endswith("```"):
                content = content[:-3]
            if content.startswith("json"):
                content = content[4:]
        parsed = json.loads(content)
        return parsed

    except Exception:
        return {
            "hcpName": "",
            "interactionType": "",
            "date": "",
            "time": "",
            "discussion": [],
            "summary": "",
            "sentiment": "neutral",
            "materialsShared": [],
            "followUp": "",
            "outcomes": [],
            "notes": "",
        }


async def process_extract_hcp(text: str) -> dict:
    """Use Groq LLM to extract structured HCP data from natural language description."""
    api_key = _get_api_key()
    if not api_key:
        return {
            "name": "",
            "specialty": "",
            "hospital": "",
            "city": "",
            "email": "",
            "phone": "",
        }

    try:
        llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, api_key=api_key)

        today = date.today().isoformat()
        system_prompt = (
            f"Today's date is {today}. "
            "You are an AI assistant that extracts structured Healthcare Professional data from CRM notes. "
            "Given a user's natural language description of a Healthcare Professional, "
            "extract the following fields and return ONLY valid JSON (no markdown, no code fences):\n\n"
            "{\n"
            '  "name": "Full name of the HCP (e.g. Dr. Priya Patel)",\n'
            '  "specialty": "Medical specialty (e.g. Neurology, Cardiology)",\n'
            '  "hospital": "Hospital or clinic name",\n'
            '  "city": "City or location",\n'
            '  "email": "Email address if mentioned",\n'
            '  "phone": "Phone number if mentioned"\n'
            "}\n\n"
            "If a field is not mentioned, use an empty string. "
            "Be precise and only extract information explicitly stated or clearly implied."
        )

        result = await llm.ainvoke([
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text},
        ])

        content = result.content.strip()
        if content.startswith("```"):
            content = content.split("\n", 1)[-1]
            content = content.rsplit("\n", 1)[0]
            if content.endswith("```"):
                content = content[:-3]
            if content.startswith("json"):
                content = content[4:]
        parsed = json.loads(content)
        return parsed

    except Exception:
        return {
            "name": "",
            "specialty": "",
            "hospital": "",
            "city": "",
            "email": "",
            "phone": "",
        }

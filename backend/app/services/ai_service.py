import os
import json
from datetime import date
from functools import lru_cache

from langchain_groq import ChatGroq


@lru_cache(maxsize=1)
def _get_api_key() -> str | None:
    return os.environ.get("GROQ_API_KEY")


async def process_extract_interaction(text: str) -> dict:
    api_key = _get_api_key()
    if not api_key:
        return {
            "hcpName": "", "interactionType": "", "date": "", "time": "",
            "discussion": [], "summary": "", "sentiment": "neutral",
            "materialsShared": [], "followUp": "", "outcomes": [], "notes": "",
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
        return json.loads(content)

    except Exception:
        return {
            "hcpName": "", "interactionType": "", "date": "", "time": "",
            "discussion": [], "summary": "", "sentiment": "neutral",
            "materialsShared": [], "followUp": "", "outcomes": [], "notes": "",
        }


async def process_extract_hcp(text: str) -> dict:
    api_key = _get_api_key()
    if not api_key:
        return {"name": "", "specialty": "", "hospital": "", "city": "", "email": "", "phone": ""}

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
        return json.loads(content)

    except Exception:
        return {"name": "", "specialty": "", "hospital": "", "city": "", "email": "", "phone": ""}

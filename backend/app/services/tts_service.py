from __future__ import annotations

import httpx

from ..models.schemas import LanguageCode
from .settings import get_settings


async def synthesize(text: str, language: LanguageCode) -> str | None:
    """Optional Bhashini adapter. Returns no audio until real credentials are supplied."""
    settings = get_settings()
    if not all([settings.bhashini_tts_url, settings.bhashini_api_key, settings.bhashini_user_id]):
        return None

    payload = {
        "pipelineTasks": [{"taskType": "tts", "config": {"language": {"sourceLanguage": language}}}],
        "inputData": {"input": [{"source": text}]},
    }
    headers = {"ulcaApiKey": settings.bhashini_api_key, "userID": settings.bhashini_user_id}
    async with httpx.AsyncClient(timeout=45) as client:
        response = await client.post(settings.bhashini_tts_url, json=payload, headers=headers)
        response.raise_for_status()
    audio = response.json().get("pipelineResponse", [{}])[0].get("audio")
    return f"data:audio/wav;base64,{audio}" if audio else None


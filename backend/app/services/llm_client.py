from __future__ import annotations

import json
import re
from typing import Any

import httpx

from .settings import get_settings


class LLMUnavailable(Exception):
    """Raised when live model credentials are not configured."""


async def chat_json(
    *, system_prompt: str, user_content: list[dict[str, Any]], model: str, temperature: float
) -> dict[str, Any]:
    settings = get_settings()
    if not settings.nvidia_api_key:
        raise LLMUnavailable("NVIDIA_API_KEY is not configured")

    payload = {
        "model": model,
        "temperature": temperature,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
    }
    headers = {
        "Authorization": f"Bearer {settings.nvidia_api_key}",
        "Content-Type": "application/json",
    }
    async with httpx.AsyncClient(timeout=55) as client:
        response = await client.post(
            f"{settings.nvidia_base_url.rstrip('/')}/chat/completions",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"]
    match = re.search(r"\{.*\}", content, flags=re.DOTALL)
    if not match:
        raise ValueError("The model did not return a JSON object.")
    return json.loads(match.group(0))

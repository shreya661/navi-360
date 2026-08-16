from __future__ import annotations

import httpx

from ..models.schemas import ExtractedNotice, TrustClaim
from .llm_client import LLMUnavailable, chat_json
from .settings import get_settings


def _fallback_claims(notice: ExtractedNotice) -> list[TrustClaim]:
    """Grounded output used only when no live model is configured."""
    claims: list[TrustClaim] = []
    if notice.deadline:
        claims.append(TrustClaim(text=f"The notice gives {notice.deadline} as the deadline.", kind="fact", evidence="Deadline extracted from the uploaded notice"))
    if notice.audience:
        claims.append(TrustClaim(text=f"It appears intended for {notice.audience}.", kind="fact", evidence="Audience wording extracted from the uploaded notice"))
    claims.extend([
        TrustClaim(text="Gather the listed certificates before opening the official application portal.", kind="interpretation", evidence="Practical next step based on the document requirements"),
        TrustClaim(text="Eligibility and the final document list must be confirmed on the official portal.", kind="uncertain", evidence="The notice photo may not contain every rule or later update"),
    ])
    return claims


async def tag_claims(notice: ExtractedNotice, api_key: str | None = None) -> list[TrustClaim]:
    """Use the reasoning model to label claims without inventing facts."""
    settings = get_settings()
    effective_key = api_key or settings.nvidia_api_key
    if not effective_key:
        return _fallback_claims(notice)
    prompt = (
        "Create 3 to 6 short, useful claims from this notice. Return JSON with a `claims` array. "
        "Each item has `text`, `kind` (fact, interpretation, or uncertain), and `evidence`. "
        "Only label something fact when directly supported by the supplied text. Include at least one uncertain item. "
        "Never provide legal or eligibility decisions."
    )
    try:
        result = await chat_json(
            system_prompt=prompt,
            user_content=[{"type": "text", "text": f"Title: {notice.title}\nIssuer: {notice.issuer}\nDeadline: {notice.deadline}\nText: {notice.extracted_text}"}],
            model=settings.text_model,
            temperature=0.25,
            api_key=effective_key,
        )
        claims = [TrustClaim.model_validate(item) for item in result.get("claims", [])]
        return claims or _fallback_claims(notice)
    except (LLMUnavailable, ValueError, KeyError, TypeError, httpx.HTTPError):
        return _fallback_claims(notice)

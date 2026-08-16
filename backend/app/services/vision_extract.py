from __future__ import annotations

import base64
import re

from ..models.schemas import ExtractedNotice
from .llm_client import chat_json
from .prompts import load_prompt
from .settings import get_settings


DEMO_NOTICE = ExtractedNotice(
    title="Post-Matric Scholarship: Application Notice",
    issuer="State Scholarship Portal",
    notice_type="scholarship",
    deadline="30 September 2026",
    audience="Eligible post-matric students in reserved categories",
    extracted_text=(
        "Post-Matric Scholarship applications are invited for the 2026–27 academic year. "
        "Applicants must submit income certificate, caste certificate, bank passbook, "
        "and current institution bonafide certificate by 30 September 2026."
    ),
)


IMAGE_FALLBACK_NOTICE = ExtractedNotice(
    title="Uploaded Notice Image",
    issuer="Uploaded Document",
    notice_type="general_notice",
    deadline=None,
    audience="Recipient",
    extracted_text="Notice photo received. Add an NVIDIA NIM key or sign in with your API key to enable live vision AI extraction for images.",
)


async def extract_notice(
    image: bytes | None,
    content_type: str | None,
    supporting_text: str = "",
    api_key: str | None = None,
) -> tuple[ExtractedNotice, bool]:
    """Extract an evidence-grounded notice from an image, text, or both."""
    settings = get_settings()
    effective_key = api_key or settings.nvidia_api_key
    if not effective_key:
        if supporting_text:
            return (_fallback_from_text(supporting_text), True)
        if image:
            return (IMAGE_FALLBACK_NOTICE, True)
        return (DEMO_NOTICE, True)

    user_content = []
    if supporting_text:
        user_content.append(
            {
                "type": "text",
                "text": f"Supporting evidence text follows. Treat its source markers as evidence references.\n{supporting_text}",
            }
        )
    if image:
        encoded_image = base64.b64encode(image).decode("ascii")
        user_content.append(
            {
                "type": "image_url",
                "image_url": {"url": f"data:{content_type};base64,{encoded_image}"},
            }
        )

    result = await chat_json(
        system_prompt=load_prompt("vision_extract.txt" if image else "text_extract.txt"),
        user_content=user_content,
        model=settings.vision_model,
        temperature=0.2,
        api_key=effective_key,
    )
    try:
        return ExtractedNotice.model_validate(result), False
    except Exception as error:
        raise ValueError("Could not read the uploaded notice. Try a clearer, well-lit photo.") from error


def _fallback_from_text(text: str) -> ExtractedNotice:
    """A truthful no-key fallback: surfaces pasted/PDF text without pretending it was model-read."""
    clean = re.sub(r"\s+", " ", text).strip()
    lines = [line.strip() for line in text.splitlines() if line.strip() and not line.startswith("--- SOURCE")]
    title = lines[0][:120] if lines else "Uploaded evidence"
    lower = clean.lower()
    if any(word in lower for word in ("scholarship", "bonafide", "post-matric")):
        notice_type = "scholarship"
    elif any(word in lower for word in ("tax", "assessment year", "pan")):
        notice_type = "tax_notice"
    elif any(word in lower for word in ("electricity", "power bill", "consumer number")):
        notice_type = "utility_bill"
    else:
        notice_type = "general_notice"
    deadline_match = re.search(
        r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{2,4})\b",
        clean,
        flags=re.IGNORECASE,
    )
    return ExtractedNotice(
        title=title,
        issuer=None,
        notice_type=notice_type,
        deadline=deadline_match.group(0) if deadline_match else None,
        audience=None,
        extracted_text=clean[:12_000],
    )

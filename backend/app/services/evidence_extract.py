from __future__ import annotations

import re
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

from pypdf import PdfReader

from ..models.schemas import EvidenceItem, TimelineEvent


IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
PDF_TYPES = {"application/pdf"}
TEXT_TYPES = {"text/plain", "text/markdown"}
DATE_HINT = re.compile(
    r"\b(?:\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+"
    r"(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|"
    r"jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{2,4})\b",
    flags=re.IGNORECASE,
)


@dataclass
class PreparedEvidence:
    item: EvidenceItem
    extracted_text: str = ""
    image_bytes: bytes | None = None
    content_type: str | None = None


def _kind_for(filename: str, content_type: str | None) -> str:
    mime = (content_type or "").lower()
    suffix = Path(filename).suffix.lower()
    if mime in IMAGE_TYPES or suffix in {".jpg", ".jpeg", ".png", ".webp"}:
        return "image"
    if mime in PDF_TYPES or suffix == ".pdf":
        return "pdf"
    if mime in TEXT_TYPES or suffix in {".txt", ".md"}:
        return "text"
    raise ValueError(f"{filename}: use a JPG, PNG, WEBP, PDF, TXT, or Markdown file.")


def prepare_file(index: int, filename: str, content_type: str | None, content: bytes) -> PreparedEvidence:
    """Create a local evidence record; uploaded content is never persisted by this service."""
    if not content:
        raise ValueError(f"{filename}: the file is empty.")

    kind = _kind_for(filename, content_type)
    source_id = f"evidence-{index}"
    if kind == "image":
        item = EvidenceItem(
            id=source_id,
            filename=filename,
            kind="image",
            detail="Image submitted for visual document reading.",
        )
        return PreparedEvidence(item=item, image_bytes=content, content_type=content_type or "image/jpeg")

    if kind == "pdf":
        try:
            reader = PdfReader(BytesIO(content))
            pages = [(page.extract_text() or "").strip() for page in reader.pages]
        except Exception as error:
            raise ValueError(f"{filename}: NAVI could not read this PDF. Try a text-based PDF or a clear image.") from error
        text = "\n".join(page for page in pages if page)
        detail = f"{len(reader.pages)}-page PDF · {'text extracted' if text else 'no selectable text found'}"
    else:
        text = content.decode("utf-8", errors="replace").strip()
        detail = f"Text evidence · {len(text):,} characters"

    preview = re.sub(r"\s+", " ", text)[:260] or "No readable text was found in this file."
    item = EvidenceItem(id=source_id, filename=filename, kind=kind, detail=detail, text_preview=preview)
    return PreparedEvidence(item=item, extracted_text=text, content_type=content_type)


def prepare_pasted_text(index: int, text: str) -> PreparedEvidence:
    clean_text = text.strip()
    item = EvidenceItem(
        id=f"evidence-{index}",
        filename="Pasted text",
        kind="text",
        detail=f"Text evidence · {len(clean_text):,} characters",
        text_preview=re.sub(r"\s+", " ", clean_text)[:260],
    )
    return PreparedEvidence(item=item, extracted_text=clean_text, content_type="text/plain")


def combined_text(evidence: list[PreparedEvidence], max_chars: int) -> str:
    chunks: list[str] = []
    remaining = max_chars
    for source in evidence:
        if not source.extracted_text or remaining <= 0:
            continue
        header = f"\n--- SOURCE: {source.item.filename} ({source.item.id}) ---\n"
        body = source.extracted_text[: max(0, remaining - len(header))]
        chunks.append(header + body)
        remaining -= len(header) + len(body)
    return "".join(chunks).strip()


def build_timeline(evidence: list[PreparedEvidence]) -> list[TimelineEvent]:
    """Show an honest evidence sequence; dates are hints, not asserted chronology."""
    timeline: list[TimelineEvent] = []
    for order, source in enumerate(evidence, start=1):
        date = DATE_HINT.search(source.extracted_text)
        kind_label = {"image": "Photo", "pdf": "PDF", "text": "Text"}[source.item.kind]
        timeline.append(
            TimelineEvent(
                order=order,
                title=f"{kind_label} added",
                detail=source.item.filename,
                source_id=source.item.id,
                date_hint=date.group(0) if date else None,
            )
        )
    return timeline

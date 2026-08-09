from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, HttpUrl

LanguageCode = Literal["en", "hi", "te", "ta", "bn"]
TrustKind = Literal["fact", "interpretation", "uncertain"]
EvidenceKind = Literal["image", "pdf", "text"]


class ExtractedNotice(BaseModel):
    title: str
    issuer: str | None = None
    notice_type: str
    deadline: str | None = None
    audience: str | None = None
    extracted_text: str = ""


class TrustClaim(BaseModel):
    text: str
    kind: TrustKind
    evidence: str | None = None


class ChecklistItem(BaseModel):
    name: str
    status: Literal["found", "missing", "confirm"]
    detail: str


class OfficialSource(BaseModel):
    name: str
    url: HttpUrl
    reason: str


class AudioSegment(BaseModel):
    label: str
    text: str
    audio_url: str | None = None


class EvidenceItem(BaseModel):
    id: str
    filename: str
    kind: EvidenceKind
    detail: str
    text_preview: str | None = None


class TimelineEvent(BaseModel):
    order: int
    title: str
    detail: str
    source_id: str
    date_hint: str | None = None


class AnalysisResponse(BaseModel):
    request_id: str
    language: LanguageCode
    is_demo: bool
    notice: ExtractedNotice
    summary: str
    plain_explanation: str
    claims: list[TrustClaim] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)
    timeline: list[TimelineEvent] = Field(default_factory=list)
    missing_information: list[ChecklistItem] = Field(default_factory=list)
    official_source: OfficialSource | None = None
    safe_next_step: str
    audio_segments: list[AudioSegment] = Field(default_factory=list)
    disclaimer: str

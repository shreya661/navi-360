from __future__ import annotations

from uuid import uuid4

import httpx
from fastapi import APIRouter, File, Form, Header, HTTPException, Response, UploadFile, status

from ..models.schemas import AnalysisResponse, AudioSegment, LanguageCode
from ..services.classify_notice import classify_notice
from ..services.analysis_store import delete_analysis, get_analysis, save_analysis
from ..services.evidence_extract import (
    IMAGE_TYPES,
    PreparedEvidence,
    build_timeline,
    combined_text,
    prepare_file,
    prepare_pasted_text,
)
from ..services.missing_info import build_checklist
from ..services.official_source import find_official_source
from ..services.settings import get_settings
from ..services.translator import rewrite_for_language
from ..services.trust_tagger import tag_claims
from ..services.tts_service import synthesize
from ..services.vision_extract import extract_notice


router = APIRouter(tags=["analysis"])
@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_notice(
    files: list[UploadFile] = File(default=[]),
    text_input: str = Form(""),
    language: LanguageCode = Form("te"),
    x_nvidia_api_key: str | None = Header(default=None),
) -> AnalysisResponse:
    settings = get_settings()
    effective_api_key = x_nvidia_api_key or settings.nvidia_api_key
    if settings.require_live_ai and not effective_api_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Live AI is not configured. Contact the service administrator.")
    if not files and not text_input.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Add at least one file or paste the notice text.")
    if len(files) > settings.max_evidence_files:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Add up to {settings.max_evidence_files} evidence files at once.")
    if len(text_input) > settings.max_text_chars:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Keep pasted text under {settings.max_text_chars:,} characters.")

    evidence: list[PreparedEvidence] = []
    max_size = settings.max_upload_mb * 1024 * 1024
    max_total_size = settings.max_total_upload_mb * 1024 * 1024
    total_size = 0
    try:
        for index, upload in enumerate(files, start=1):
            content = await upload.read()
            total_size += len(content)
            if total_size > max_total_size:
                raise ValueError(f"Keep all uploaded files under {settings.max_total_upload_mb} MB in total.")
            if len(content) > max_size:
                raise ValueError(f"{upload.filename}: use a file smaller than {settings.max_upload_mb} MB.")
            evidence.append(prepare_file(index, upload.filename or f"Evidence {index}", upload.content_type, content))
        if text_input.strip():
            evidence.append(prepare_pasted_text(len(evidence) + 1, text_input))
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error

    text_evidence = combined_text(evidence, settings.max_text_chars)
    image_evidence = next((source for source in evidence if source.item.kind == "image"), None)

    try:
        notice, is_demo = await extract_notice(
            image_evidence.image_bytes if image_evidence else None,
            image_evidence.content_type if image_evidence else None,
            text_evidence,
            api_key=effective_api_key,
        )
        notice_type = classify_notice(notice)
        notice.notice_type = notice_type
        explanation = await rewrite_for_language(notice, language, api_key=effective_api_key)
        try:
            audio_url = await synthesize(explanation, language)
        except httpx.HTTPError:
            audio_url = None
    except httpx.TimeoutException as error:
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="The AI service took too long. Please try again.") from error
    except httpx.HTTPError as error:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="The AI service is temporarily unavailable. Please try again.") from error
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(error)) from error

    source = find_official_source(notice_type, notice.title, text_evidence)
    deadline = f" before {notice.deadline}" if notice.deadline else ""
    response = AnalysisResponse(
        request_id=str(uuid4()),
        language=language,
        is_demo=is_demo,
        notice=notice,
        summary=f"{notice.title}{deadline}.",
        plain_explanation=explanation,
        claims=await tag_claims(notice, api_key=effective_api_key),
        evidence=[source.item for source in evidence],
        timeline=build_timeline(evidence),
        missing_information=build_checklist(notice, notice_type),
        official_source=source,
        safe_next_step="Open the official source, confirm your eligibility, then submit only through that portal.",
        audio_segments=[AudioSegment(label="Plain-language explanation", text=explanation, audio_url=audio_url)],
        disclaimer="NAVI explains the notice; it does not decide eligibility or replace the official portal.",
    )
    save_analysis(response)
    return response


@router.get("/analyses/{request_id}", response_model=AnalysisResponse)
async def read_analysis(request_id: str) -> AnalysisResponse:
    saved = get_analysis(request_id)
    if not saved:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved analysis not found.")
    return saved


@router.delete("/analyses/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_analysis(request_id: str) -> Response:
    if not delete_analysis(request_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved analysis not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

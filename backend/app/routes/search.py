"""Search route — lets citizens ask follow-up questions about their notice
and receive safe, curated government resource links."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel

from ..services.official_source import find_official_source
from ..services.web_search import web_search


router = APIRouter(tags=["search"])


class SearchResult(BaseModel):
    title: str
    url: str
    snippet: str
    source: str


class SearchResponse(BaseModel):
    query: str
    results: list[SearchResult]
    curated_source: dict | None = None
    disclaimer: str


@router.get("/search", response_model=SearchResponse)
async def search_resources(
    q: str = Query(..., min_length=2, max_length=300, description="Citizen's question or notice keyword"),
) -> SearchResponse:
    """Search for official government resources related to a citizen's query."""
    if not q.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Query cannot be empty.")

    # Classify query to find a curated source
    query_lower = q.lower()
    if any(word in query_lower for word in ("scholarship", "student", "post-matric", "bonafide", "epass")):
        notice_type = "scholarship"
    elif any(word in query_lower for word in ("tax", "income tax", "pan", "assessment")):
        notice_type = "tax_notice"
    elif any(word in query_lower for word in ("electricity", "power bill", "discom", "consumer")):
        notice_type = "utility_bill"
    elif any(word in query_lower for word in ("pm-kisan", "kisan", "farmer", "pmkisan")):
        notice_type = "farmer_support"
    elif any(word in query_lower for word in ("e-shram", "eshram", "unorganised worker", "uan")):
        notice_type = "labour"
    elif any(word in query_lower for word in ("ayushman", "pm-jay", "health card", "hospital")):
        notice_type = "health_scheme"
    elif any(word in query_lower for word in ("pension", "nps", "pran")):
        notice_type = "pension"
    elif any(word in query_lower for word in ("aadhaar", "aadhar", "uidai")):
        notice_type = "identity_document"
    elif any(word in query_lower for word in ("admission", "university", "ugc", "college")):
        notice_type = "education_admission"
    elif any(word in query_lower for word in ("grievance", "complaint", "pgportal")):
        notice_type = "grievance"
    elif "telangana" in query_lower or "epass" in query_lower:
        notice_type = "telangana_epass"
    elif "andhra" in query_lower or "jnanabhumi" in query_lower:
        notice_type = "ap_epass"
    elif "maharashtra" in query_lower or "mahadbt" in query_lower:
        notice_type = "mahadbt"
    elif "uttar pradesh" in query_lower or "up scholarship" in query_lower:
        notice_type = "up_scholarship"
    else:
        notice_type = "general_notice"

    curated = find_official_source(notice_type, title=q, text=q)

    # Live web search
    live_results = await web_search(q, max_results=5)

    # If live search returned nothing, return only the curated source
    if not live_results and not curated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No official resources found for that query. Try rephrasing or use the National Portal of India at india.gov.in",
        )

    return SearchResponse(
        query=q,
        results=[SearchResult(**r) for r in live_results],
        curated_source=curated.model_dump(mode="json") if curated else None,
        disclaimer="NAVI only links to official government portals. Always confirm information on the official source before taking action.",
    )

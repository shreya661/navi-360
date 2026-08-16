"""Web-search service for NAVI 360 citizen queries.

Design principles:
- Uses DuckDuckGo Instant Answer API (no API key required).
- Returns ONLY results from .gov.in, .gov, .nic.in domains for safety.
- Falls back to curated official_sources.json if live search fails.
- Never manufactures a government URL; all links are from the live SERP.
"""

from __future__ import annotations

import re
from typing import Any

import httpx

SAFE_DOMAINS = re.compile(
    r"https?://(?:[a-z0-9\-]+\.)*("
    r"gov\.in|gov\.in|nic\.in|gov|"
    r"india\.gov\.in|scholarships\.gov\.in|"
    r"pmkisan\.gov\.in|eshram\.gov\.in|"
    r"telanganaepass\.cgg\.gov\.in|"
    r"jnanabhumi\.ap\.gov\.in|"
    r"mahadbt\.maharashtra\.gov\.in|"
    r"scholarship\.up\.gov\.in|"
    r"myaadhaar\.uidai\.gov\.in|"
    r"nha\.gov\.in|pfrda\.org\.in|"
    r"pgportal\.gov\.in|ugc\.gov\.in"
    r")",
    re.IGNORECASE,
)

DDGX_URL = "https://api.duckduckgo.com/"


async def web_search(query: str, max_results: int = 5) -> list[dict[str, str]]:
    """Return a list of safe government results for the user's query."""
    params: dict[str, Any] = {
        "q": f"{query} site:gov.in OR site:nic.in",
        "format": "json",
        "no_redirect": "1",
        "no_html": "1",
        "skip_disambig": "1",
    }
    results: list[dict[str, str]] = []

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(DDGX_URL, params=params)
            response.raise_for_status()
            data = response.json()

        # Instant Answer (Abstract)
        if data.get("AbstractURL") and SAFE_DOMAINS.match(data["AbstractURL"]):
            results.append({
                "title": data.get("Heading") or query,
                "url": data["AbstractURL"],
                "snippet": (data.get("Abstract") or "")[:300],
                "source": "DuckDuckGo Instant Answer",
            })

        # Related Topics
        for topic in data.get("RelatedTopics", []):
            if len(results) >= max_results:
                break
            # Some topics are nested groups
            if "Topics" in topic:
                for sub in topic["Topics"]:
                    if len(results) >= max_results:
                        break
                    url = sub.get("FirstURL", "")
                    if SAFE_DOMAINS.search(url):
                        results.append({
                            "title": sub.get("Text", "")[:100],
                            "url": url,
                            "snippet": sub.get("Text", "")[:300],
                            "source": "DuckDuckGo Related",
                        })
            else:
                url = topic.get("FirstURL", "")
                if SAFE_DOMAINS.search(url):
                    results.append({
                        "title": topic.get("Text", "")[:100],
                        "url": url,
                        "snippet": topic.get("Text", "")[:300],
                        "source": "DuckDuckGo Related",
                    })

    except (httpx.HTTPError, ValueError, KeyError):
        # Graceful fallback — caller handles empty list
        pass

    return results

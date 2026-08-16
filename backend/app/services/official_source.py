from __future__ import annotations

import json
from pathlib import Path

from ..models.schemas import OfficialSource


SOURCES_PATH = Path(__file__).resolve().parents[3] / "data" / "official_sources.json"


def find_official_source(notice_type: str, title: str = "", text: str = "") -> OfficialSource | None:
    """Select from a maintained whitelist of verified government portals."""
    sources = json.loads(SOURCES_PATH.read_text(encoding="utf-8"))
    combined = f"{title} {text}".lower()

    # Smart specific keyword matching for state & specialized portals
    if "telangana" in combined or "tg epass" in combined or "telanganaepass" in combined:
        key = "telangana_epass"
    elif "jnanabhumi" in combined or "ap epass" in combined or "andhra" in combined:
        key = "ap_epass"
    elif "up scholarship" in combined or "uttar pradesh" in combined:
        key = "up_scholarship"
    elif "mahadbt" in combined or "maharashtra" in combined:
        key = "mahadbt"
    else:
        key = notice_type

    source = sources.get(key) or sources.get(notice_type) or sources.get("general_notice")
    return OfficialSource.model_validate(source) if source else None


from __future__ import annotations

import json
from pathlib import Path

from ..models.schemas import OfficialSource


SOURCES_PATH = Path(__file__).resolve().parents[3] / "data" / "official_sources.json"


def find_official_source(notice_type: str) -> OfficialSource | None:
    """Select from a maintained whitelist—never manufacture an official-looking URL."""
    sources = json.loads(SOURCES_PATH.read_text(encoding="utf-8"))
    source = sources.get(notice_type) or sources.get("general_notice")
    return OfficialSource.model_validate(source) if source else None


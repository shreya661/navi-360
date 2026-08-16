from __future__ import annotations

from ..models.schemas import ExtractedNotice, LanguageCode
from .llm_client import LLMUnavailable, chat_json
from .prompts import load_prompt
from .settings import get_settings
from .vision_extract import DEMO_NOTICE


FALLBACKS: dict[str, str] = {
    "en": (
        "This is a scholarship application notice. Keep your income certificate, caste certificate, "
        "bank passbook, and college bonafide certificate ready. The notice says to apply by 30 September 2026."
    ),
    "hi": (
        "यह छात्रवृत्ति आवेदन की सूचना है। आय प्रमाणपत्र, जाति प्रमाणपत्र, बैंक पासबुक और कॉलेज का बोनाफाइड प्रमाणपत्र तैयार रखें। "
        "सूचना में आवेदन की अंतिम तारीख 30 सितंबर 2026 दी गई है।"
    ),
    "te": (
        "ఇది స్కాలర్‌షిప్ దరఖాస్తు నోటీసు. ఆదాయ ధ్రువీకరణ పత్రం, కుల ధ్రువీకరణ పత్రం, బ్యాంకు పాస్‌బుక్, కళాశాల బోనఫైడ్ సర్టిఫికెట్ సిద్ధంగా ఉంచుకోండి. "
        "నోటీసు ప్రకారం దరఖాస్తు చివరి తేదీ 30 సెప్టెంబర్ 2026."
    ),
    "ta": (
        "இது உதவித்தொகை விண்ணப்ப அறிவிப்பு. வருமானச் சான்று, சாதிச் சான்று, வங்கி பாஸ்புக் மற்றும் கல்லூரி போனஃபைடு சான்றிதழை தயாராக வைத்துக்கொள்ளுங்கள்."
    ),
    "bn": (
        "এটি বৃত্তির আবেদনের নোটিশ। আয়ের শংসাপত্র, জাতি শংসাপত্র, ব্যাঙ্ক পাসবুক এবং কলেজের বোনাফাইড শংসাপত্র প্রস্তুত রাখুন।"
    ),
}


async def rewrite_for_language(notice: ExtractedNotice, language: LanguageCode, api_key: str | None = None) -> str:
    settings = get_settings()
    effective_key = api_key or settings.nvidia_api_key
    if not effective_key:
        if notice.extracted_text and notice.title != DEMO_NOTICE.title:
            deadline = f" The notice mentions a deadline of {notice.deadline}." if notice.deadline else ""
            summary = notice.extracted_text[:280].strip()
            return f"NAVI extracted this notice ({notice.title}): {summary}.{deadline} Please check the official source for full verification."
        return FALLBACKS.get(language, FALLBACKS["en"])

    result = await chat_json(
        system_prompt=load_prompt("natural_rewrite.txt").replace("{{language}}", language),
        user_content=[
            {
                "type": "text",
                "text": (
                    f"Title: {notice.title}\nIssuer: {notice.issuer}\nDeadline: {notice.deadline}\n"
                    f"Audience: {notice.audience}\nDocument text: {notice.extracted_text}"
                ),
            }
        ],
        model=settings.text_model,
        temperature=0.75,
        api_key=effective_key,
    )
    return str(result.get("plain_explanation") or FALLBACKS.get(language, FALLBACKS["en"])).strip()

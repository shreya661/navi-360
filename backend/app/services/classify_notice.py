from ..models.schemas import ExtractedNotice


def classify_notice(notice: ExtractedNotice) -> str:
    """A deterministic guardrail classifies the small hackathon-supported notice set."""
    text = " ".join([notice.title, notice.notice_type, notice.extracted_text]).lower()
    if any(word in text for word in ("scholarship", "student", "bonafide", "post-matric")):
        return "scholarship"
    if any(word in text for word in ("tax", "income tax", "assessment")):
        return "tax_notice"
    if any(word in text for word in ("electricity", "power bill", "consumer number")):
        return "utility_bill"
    if any(word in text for word in ("pm-kisan", "pm kisan", "farmer", "kisan", "landholding")):
        return "farmer_support"
    if any(word in text for word in ("e-shram", "eshram", "unorganised worker", "uan")):
        return "labour"
    if any(word in text for word in ("ayushman", "pm-jay", "health card", "beneficiary card")):
        return "health_scheme"
    if any(word in text for word in ("pension", "nps", "pran")):
        return "pension"
    if any(word in text for word in ("aadhaar", "aadhar", "uidai", "enrolment id")):
        return "identity_document"
    if any(word in text for word in ("admission", "university", "ugc", "counselling")):
        return "education_admission"
    if any(word in text for word in ("grievance", "complaint", "public grievance", "pgportal")):
        return "grievance"
    return "general_notice"

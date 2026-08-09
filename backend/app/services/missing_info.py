from __future__ import annotations

from ..models.schemas import ChecklistItem, ExtractedNotice


REQUIREMENTS: dict[str, list[str]] = {
    "scholarship": [
        "Income certificate",
        "Caste certificate",
        "Bank passbook",
        "Institution bonafide certificate",
    ],
    "tax_notice": ["PAN", "Assessment-year reference", "Reply acknowledgement"],
    "utility_bill": ["Consumer number", "Latest bill", "Payment receipt"],
    "farmer_support": ["PM-KISAN registration number", "Aadhaar-linked bank account", "Land record"],
    "labour": ["Aadhaar number", "Mobile number", "Occupation details"],
    "health_scheme": ["Aadhaar number", "Family identification", "Beneficiary eligibility confirmation"],
    "pension": ["PRAN or pension reference", "Identity proof", "Bank account details"],
    "identity_document": ["Aadhaar number or enrolment ID", "Registered mobile number"],
    "education_admission": ["Application number", "Academic records", "Category certificate if applicable"],
    "grievance": ["Grievance reference number", "Supporting documents", "Department details"],
}


def build_checklist(notice: ExtractedNotice, notice_type: str) -> list[ChecklistItem]:
    evidence = notice.extracted_text.lower()
    checklist: list[ChecklistItem] = []
    for document in REQUIREMENTS.get(notice_type, ["Official notice reference"]):
        normalized = document.lower().replace("institution ", "").replace(" certificate", "")
        found = normalized in evidence or document.lower() in evidence
        checklist.append(
            ChecklistItem(
                name=document,
                status="found" if found else "confirm",
                detail=(
                    "This document is named in the uploaded notice."
                    if found
                    else "Check the official portal to confirm whether this is required for your case."
                ),
            )
        )
    return checklist

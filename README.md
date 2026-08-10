<div align="center">

<img src="./assets/navi360-logo.png" alt="NAVI 360" width="520"/>

### Government notices, decoded. In your language.

<br/>

[![FastAPI](https://img.shields.io/badge/FastAPI-000000?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-000000?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Claude](https://img.shields.io/badge/Claude-000000?style=for-the-badge&logo=anthropic&logoColor=white)](https://www.anthropic.com/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA_NIM-000000?style=for-the-badge&logo=nvidia&logoColor=76B900)](https://www.nvidia.com/en-us/ai/)
[![Bhashini](https://img.shields.io/badge/Bhashini-000000?style=for-the-badge&logoColor=white)](https://bhashini.gov.in/)

<br/>

**Snap a government notice → Understand it → Know what to do → Act on time**

</div>

---

# NAVI 360

Government communication is often written for administrators, not ordinary citizens.

A welfare eligibility letter.  
A tax notice.  
A scholarship announcement.  
A government scheme document.  
A legal or administrative notice.

For millions of people, these documents can be difficult to understand because of:

- complex legal language
- unfamiliar government terminology
- long paragraphs
- multiple deadlines
- document requirements
- language barriers
- unclear next steps

**NAVI 360 turns complicated government notices into clear, actionable information.**

---

## The Problem

A person may receive an important government notice but still not understand:

> **What is this about?**

> **What do I need to do?**

> **When do I need to do it?**

> **Which documents do I need?**

> **Where should I apply or respond?**

> **Is this information actually confirmed?**

Missing a deadline or misunderstanding a requirement can result in:

- missed welfare benefits
- rejected applications
- penalties
- missed scholarship opportunities
- incomplete submissions
- unnecessary visits to government offices

NAVI 360 is designed to reduce this information gap.

---

# What NAVI 360 Does

Upload or capture a photo of a government notice.

NAVI 360 processes the document and produces a simple, structured explanation.

| Feature | What it does |
|---|---|
| **Plain-language explanation** | Converts complex government language into easy-to-understand language |
| **Action checklist** | Shows exactly what the citizen needs to do next |
| **Timeline extraction** | Finds important dates, deadlines and time limits |
| **Official source** | Points users toward the verified government source |
| **Trust tagging** | Separates confirmed information from information requiring verification |
| **Document checklist** | Identifies documents mentioned or required in the notice |
| **Multilingual output** | Explains the notice in the user's preferred language |
| **Audio playback** | Allows users to listen instead of reading |
| **Notice summary** | Gives a quick overview before showing detailed information |

---

# How It Works

NAVI 360 does **not** rely on one giant AI prompt.

Instead, the system uses a structured pipeline designed around extraction, verification and explanation.

```text
                  ┌─────────────────────┐
                  │   Government Notice  │
                  │      Image / PDF     │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   Document / OCR    │
                  │      Extraction     │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │  Notice Structure   │
                  │  & Entity Parsing   │
                  └──────────┬──────────┘
                             │
             ┌───────────────┼────────────────┐
             ▼               ▼                ▼
       ┌───────────┐   ┌────────────┐   ┌─────────────┐
       │  Dates &  │   │ Documents  │   │  Important  │
       │ Deadlines │   │ Required   │   │   Actions   │
       └─────┬─────┘   └─────┬──────┘   └──────┬──────┘
             │               │                 │
             └───────────────┼─────────────────┘
                             ▼
                  ┌─────────────────────┐
                  │     AI Reasoning    │
                  │  Explain + Organize │
                  └──────────┬──────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │   Trust / Source    │
                  │     Verification    │
                  └──────────┬──────────┘
                             │
                             ▼
             ┌───────────────┼────────────────┐
             ▼               ▼                ▼
       ┌───────────┐   ┌────────────┐   ┌─────────────┐
       │  Simple   │   │  Action    │   │   Timeline  │
       │ Explanation│  │ Checklist  │   │ & Deadlines │
       └───────────┘   └────────────┘   └─────────────┘
                             │
                             ▼
                  ┌─────────────────────┐
                  │ Multilingual Output │
                  │   + Voice Support   │
                  └─────────────────────┘

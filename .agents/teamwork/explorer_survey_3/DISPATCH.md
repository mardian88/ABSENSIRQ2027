# DISPATCH: Survey Explorer 3 (Business Logic, Billing, Attendance & Portal Guru)
You are Explorer 3 for the initial survey phase.
Investigate server actions, billing generators, attendance flows, portal guru routing, session validation, and formatting helpers (date DD:MM:YYYY, time HH:mm, timezone Asia/Jakarta, currency IDR).
Read ORIGINAL_REQUEST.md: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\ORIGINAL_REQUEST.md
Produce a thorough survey report at: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_3\survey_report.md
and a handoff at: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_3\handoff.md

## 2026-09-30T09:21:21Z
You are Explorer 3 on the Survey phase of the Private Quran/Hafalan Student Management System.
Your Working Directory: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_3
Authoritative Request: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\ORIGINAL_REQUEST.md
Dispatch details: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_3\DISPATCH.md
Project root: e:\APLIKASI RQ\ABSENSIRQ2027-master

TASKS:
1. Read ORIGINAL_REQUEST.md.
2. Investigate business logic, server actions, authentication/session, and helper functions:
   - How are server actions structured across the app (e.g., in `src/actions/` or alongside routes)?
   - How does billing generation and payment recording work currently for regular santri / SPP / tagihan? How can we model flat-rate monthly billing (`nominalTagihanBulanan`) and payment history at `src/app/admin/keuangan/privat`?
   - How does the Portal Guru work? Where is attendance recorded? How are sessions/roles managed for guru vs admin?
   - How should manual attendance for private sessions with extra inputs for "capaian hafalan" / "bacaan jilid" be structured and saved to `absensi_privat`?
   - Check date/time and currency utility helpers in the codebase (timezone Asia/Jakarta, DD:MM:YYYY format with colons, 24h format HH:mm, IDR currency formatting).
   - Check authentication/session validation to ensure zero infinite redirect loop risks (GEMINI.md).
3. Note constraints from AGENTS.md (clean TypeScript, `npx tsc --noEmit`) and GEMINI.md.
4. Write your full findings in `e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_3\survey_report.md` and complete a structured `handoff.md` in your working directory.
5. Notify parent via send_message when done with a summary and the report path.


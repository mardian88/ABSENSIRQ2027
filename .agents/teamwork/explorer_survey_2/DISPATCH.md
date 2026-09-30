# DISPATCH: Survey Explorer 2 (UI, Tablecn, Admin Routes & Components)
You are Explorer 2 for the initial survey phase.
Investigate existing Tablecn implementations (@tanstack/react-table, sadmann7 style), UI component libraries, layout conventions, table patterns, and routes under `src/app/admin/`.
Read ORIGINAL_REQUEST.md: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\ORIGINAL_REQUEST.md
Produce a thorough survey report at: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_2\survey_report.md
and a handoff at: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_2\handoff.md

## 2026-09-30T09:21:21Z
You are Explorer 2 on the Survey phase of the Private Quran/Hafalan Student Management System.
Your Working Directory: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_2
Authoritative Request: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\ORIGINAL_REQUEST.md
Dispatch details: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_2\DISPATCH.md
Project root: e:\APLIKASI RQ\ABSENSIRQ2027-master

TASKS:
1. Read ORIGINAL_REQUEST.md.
2. Investigate UI architecture, components, and design standards:
   - Examine how Tablecn / @tanstack/react-table is implemented in existing admin pages (e.g., `src/app/admin/santri`, `src/app/admin/guru`, `src/components/`, etc.).
   - Check data table patterns: columns, pagination, filtering, search, sorting, row actions, modals/drawers for CRUD.
   - Inspect existing admin layouts, sidebar navigation, headers, breadcrumbs.
   - Note UI guidelines: ui-ux-pro-max and antislop compliance (consistent themes, clean spacing, proper loading and empty states).
   - Check route conventions for `src/app/admin/santri-privat/page.tsx` and `src/app/admin/keuangan/privat/page.tsx`.
3. Note constraints from AGENTS.md (no implicit any, dead code, npx tsc --noEmit) and GEMINI.md (Tablecn standardization, Rupiah formatting, date/time formatting).
4. Write your full findings in `e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_2\survey_report.md` and complete a structured `handoff.md` in your working directory.
5. Notify parent via send_message when done with a summary and the report path.

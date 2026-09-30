# DISPATCH: Milestone 1 - Explorer 1 (Server Actions & Data Operations)
Milestone 1: Manajemen Data Santri Privat (CRUD & Tablecn)
Your Working Directory: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_m1_1
Authoritative Request: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\ORIGINAL_REQUEST.md
Project Specification: e:\APLIKASI RQ\ABSENSIRQ2027-master\PROJECT.md

TASKS:
1. Read ORIGINAL_REQUEST.md and PROJECT.md.
2. Formulate the exact implementation strategy for `src/app/admin/santri-privat/actions.ts`:
   - `getSantriPrivatList()`: fetch all private students ordered by `createdAt` desc.
   - `createSantriPrivat(data)`: insert with `uuidv4()`, sanitize inputs, validate required fields, default status to 'aktif', ensure nominal is integer.
   - `updateSantriPrivat(id, data)`: partial update with validation.
   - `deleteSantriPrivat(id)`: safe deletion with check for existing attendance or billing records.
   - Check revalidation paths (`/admin/santri-privat`).
3. Ensure strict compliance with AGENTS.md (`npx tsc --noEmit` clean, no implicit any) and GEMINI.md.
4. Write your analysis and recommendations in `e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_m1_1\analysis.md` and handoff in `handoff.md`.

## 2026-09-30T09:31:58Z
Sender: b0cade56-be3d-44b5-85e9-dbdb03a5bb0f
Priority: MESSAGE_PRIORITY_HIGH
Content:
You are Explorer 1 for Milestone 1: Manajemen Data Santri Privat.
Your Working Directory: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_m1_1
Authoritative Request: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\ORIGINAL_REQUEST.md
Project Specification: e:\APLIKASI RQ\ABSENSIRQ2027-master\PROJECT.md
Dispatch Instructions: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_m1_1\DISPATCH.md

TASKS:
1. Read ORIGINAL_REQUEST.md and PROJECT.md.
2. Formulate the exact implementation strategy for `src/app/admin/santri-privat/actions.ts`:
   - `getSantriPrivatList()`
   - `createSantriPrivat(data)`
   - `updateSantriPrivat(id, data)`
   - `deleteSantriPrivat(id)`
   - Safe validation and revalidation.
3. Check AGENTS.md and GEMINI.md compliance.
4. Write your analysis in `e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_m1_1\analysis.md` and handoff at `handoff.md`.
5. Send message to parent upon completion.

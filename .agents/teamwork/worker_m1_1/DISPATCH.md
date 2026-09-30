# DISPATCH: Worker - Milestone 1 (Manajemen Data Santri Privat)
You are the Worker for Milestone 1: Manajemen Data Santri Privat (CRUD & Tablecn).
Your Working Directory: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\worker_m1_1
Authoritative Request: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\ORIGINAL_REQUEST.md
Project Specification: e:\APLIKASI RQ\ABSENSIRQ2027-master\PROJECT.md

INPUT FINDINGS & PLANS:
1. M1 Explorer 1 Report (Server Actions & DB Ops): `e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_m1_1\analysis.md`
2. M1 Explorer 2 Report (Tablecn & Columns Architecture): `e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_m1_2\analysis.md`
3. M1 Explorer 3 Report (Zod Form, Real-time Currency Formatting, SweetAlert & Sidebar): `e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_m1_3\analysis.md`

FILES EXCLUSIVELY OWNED:
- `src/lib/date-utils.ts` (ensure `formatDateWIB` formatting with colon separator `DD:MM:YYYY` WIB)
- `src/app/admin/santri-privat/actions.ts`
- `src/app/admin/santri-privat/columns.tsx`
- `src/app/admin/santri-privat/SantriPrivatClient.tsx`
- `src/app/admin/santri-privat/page.tsx`
- `src/components/Sidebar.tsx` (add "Santri Privat" link under Database)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

STRICT RULES & CONSTRAINTS:
1. AGENTS.md: No implicit any, remove dead code, and run `npx tsc --noEmit` to verify 0 errors.
2. GEMINI.md:
   - Timezone: `Asia/Jakarta` (WIB GMT+7).
   - Date format: `DD:MM:YYYY` with colon separator (e.g. `28:03:2026`).
   - Currency: IDR dot thousand separator (`1.000`), real-time auto-formatting on form input, stored as integer in DB.
   - Tablecn: Standardized `@tanstack/react-table` wrapper from `@/components/ui/data-table/data-table`.

VERIFICATION:
Run `cmd.exe /c "npx tsc --noEmit"` to verify 0 TypeScript errors before completing your handoff.
Write your completion handoff in: `e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\worker_m1_1\handoff.md`.

## 2026-09-30T09:39:20Z
[Message] timestamp=2026-09-30T09:39:20Z sender=b0cade56-be3d-44b5-85e9-dbdb03a5bb0f priority=MESSAGE_PRIORITY_HIGH content=You are the Worker for Milestone 1: Manajemen Data Santri Privat (CRUD & Tablecn).
Your Working Directory: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\worker_m1_1
Authoritative Request: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\ORIGINAL_REQUEST.md
Project Specification: e:\APLIKASI RQ\ABSENSIRQ2027-master\PROJECT.md
Dispatch Instructions: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\worker_m1_1\DISPATCH.md

INPUT FINDINGS & PLANS:
1. M1 Explorer 1 Report: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_m1_1\analysis.md
2. M1 Explorer 2 Report: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_m1_2\analysis.md
3. M1 Explorer 3 Report: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_m1_3\analysis.md

FILES EXCLUSIVELY OWNED:
- src/lib/date-utils.ts (ensure formatDateWIB formatting with colon separator DD:MM:YYYY WIB)
- src/app/admin/santri-privat/actions.ts
- src/app/admin/santri-privat/columns.tsx
- src/app/admin/santri-privat/SantriPrivatClient.tsx
- src/app/admin/santri-privat/page.tsx
- src/components/Sidebar.tsx (add "Santri Privat" link under Database)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

STRICT RULES & CONSTRAINTS:
1. AGENTS.md: No implicit any, remove dead code, and run npx tsc --noEmit to verify 0 errors.
2. GEMINI.md:
   - Timezone: Asia/Jakarta (WIB GMT+7).
   - Date format: DD:MM:YYYY with colon separator (e.g. 28:03:2026).
   - Currency: IDR dot thousand separator (1.000), real-time auto-formatting on form input, stored as integer in DB.
   - Tablecn: Standardized @tanstack/react-table wrapper from @/components/ui/data-table/data-table.

TASKS:
1. Read the input reports and dispatch instructions.
2. Implement all required files with high craft, anti-slop, and strict TypeScript.
3. Run `cmd.exe /c "npx tsc --noEmit"` and verify 0 errors.
4. Write handoff report in e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\worker_m1_1\handoff.md.
5. Send message to parent upon completion.

## 2026-09-30T09:43:12Z
**Context**: Milestone 1 Implementation (actions.ts)
**Content**: The E2E test runner detected a TypeScript error in `src/app/admin/santri-privat/actions.ts` around lines 14 & 26: Zod v4 uses `error` or standard message instead of `required_error: "..."`. Please make sure to fix this and run `cmd.exe /c "npx tsc --noEmit"` to ensure 0 TypeScript errors before completing your handoff.
**Action**: Correct the Zod syntax and verify `npx tsc --noEmit` exits with 0 errors.


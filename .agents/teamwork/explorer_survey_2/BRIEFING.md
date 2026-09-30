# BRIEFING — 2026-09-30T09:30:00Z

## Mission
Investigate UI architecture, components, Tablecn / @tanstack/react-table implementations, admin routes, layouts, and design standards for Private Quran/Hafalan Student Management System.

## 🔒 My Identity
- Archetype: explorer
- Roles: UI & Tablecn Investigator, Design Standard Analyst
- Working directory: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_2
- Original parent: b0cade56-be3d-44b5-85e9-dbdb03a5bb0f
- Milestone: Survey Phase - UI Architecture & Tablecn Survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement source code
- Adhere strictly to AGENTS.md (no implicit any, dead code, npx tsc --noEmit)
- Adhere strictly to GEMINI.md (Tablecn standardization by sadmann7/@tanstack/react-table, Rupiah formatting, date/time Asia/Jakarta DD:MM:YYYY HH:mm)
- Files for content delivery (.agents/teamwork/explorer_survey_2/), send_message for notifications
- Never place source code or tests in .agents/teamwork/

## Current Parent
- Conversation ID: b0cade56-be3d-44b5-85e9-dbdb03a5bb0f
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `src/components/ui/data-table/*` (DataTable, Pagination, Toolbar, ViewOptions, ColumnHeader, Skeleton)
  - `src/app/santri/*` (page, SantriClient, columns, actions)
  - `src/app/admin-guru/*` (page, AdminGuruClient, columns, actions)
  - `src/app/admin-keuangan/*` (pembayaran, monitoring, top-up, donasi)
  - `src/app/portal-guru/*` (PortalGuruClient, mutabaah, columns, actions)
  - `src/components/AppLayout.tsx`, `Sidebar.tsx`
  - `src/proxy.ts`, `src/lib/date.ts`, `src/lib/utils.ts`, `src/lib/sweetalert.ts`
  - `src/db/schema.ts` (`santri_privat`, `absensi_privat`, `keuangan_privat`)
- **Key findings**:
  - Tablecn component is ready in `src/components/ui/data-table/data-table.tsx` with standard toolbar, pagination, and sorting.
  - Existing admin routes use layout wrappers with `Sidebar.tsx`.
  - Routes specified in ORIGINAL_REQUEST: `src/app/admin/santri-privat/page.tsx` and `src/app/admin/keuangan/privat/page.tsx` fit seamlessly with Next.js App Router and `AppLayout.tsx`.
  - Teacher manual attendance page (R3) best fits at `src/app/portal-guru/absensi-privat/page.tsx` with navigation link added in `PortalGuruClient.tsx`.
  - Typecheck `npx tsc --noEmit` verified: 0 errors currently.
- **Unexplored areas**: None for UI survey scope.

## Key Decisions Made
- Fully documented Tablecn patterns, form design, modal patterns, currency/date formatting, and route conventions.

## Artifact Index
- e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_2\survey_report.md — Full findings report
- e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_2\handoff.md — Handoff report
- e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_2\progress.md — Liveness progress heartbeat

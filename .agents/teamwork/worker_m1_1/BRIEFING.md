# BRIEFING — 2026-09-30T09:45:00Z

## Mission
Implement Milestone 1: Manajemen Data Santri Privat (CRUD & Tablecn) with high craft, anti-slop, and strict TypeScript.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\worker_m1_1
- Original parent: b0cade56-be3d-44b5-85e9-dbdb03a5bb0f
- Milestone: M1 - Manajemen Data Santri Privat (CRUD & Tablecn)

## 🔒 Key Constraints
- AGENTS.md: No implicit any, remove dead code, verify 0 errors with npx tsc --noEmit.
- GEMINI.md: Asia/Jakarta timezone (WIB GMT+7).
- GEMINI.md: Date format DD:MM:YYYY with colon separator (e.g. 28:03:2026).
- GEMINI.md: 24-hour time format HH:mm (e.g. 14:30).
- GEMINI.md: Indonesian Rupiah format with dot thousands separator (1.000). Real-time auto-formatting on input, stored as integer in DB.
- GEMINI.md: Standardized Tablecn @tanstack/react-table wrapper in src/components/ui/data-table/data-table.
- Integrity: All implementations must be genuine, maintaining real state and behavior.

## Current Parent
- Conversation ID: b0cade56-be3d-44b5-85e9-dbdb03a5bb0f
- Updated: 2026-09-30T09:43:12Z

## Task Summary
- **What to build**: Full CRUD management interface for private students (santri privat) under /admin/santri-privat with Tablecn, modal forms, real-time Rupiah formatting, safe delete validation, and Sidebar navigation.
- **Success criteria**:
  - `src/lib/date-utils.ts`: exports formatDateWIB, formatTimeWIB, formatDateTimeWIB adhering to GEMINI.md colon separator.
  - `src/app/admin/santri-privat/actions.ts`: getSantriPrivatList, getSantriPrivatById, createSantriPrivat, updateSantriPrivat, deleteSantriPrivat with safe referential integrity checks against absensi_privat and keuangan_privat.
  - `src/app/admin/santri-privat/columns.tsx`: Tablecn column definitions with select, NIS, name avatar, contact, monthly fee, status pill, formatted creation date, and edit/delete actions.
  - `src/app/admin/santri-privat/SantriPrivatClient.tsx`: Client view with metric bento cards, Tablecn table, status filtering, modal dialog with real-time Rupiah formatting, and SweetAlert2 integration.
  - `src/app/admin/santri-privat/page.tsx`: Server component data loader.
  - `src/components/Sidebar.tsx`: Add "Santri Privat" link under Database.
  - `npx tsc --noEmit` passes with 0 errors.
- **Interface contracts**: PROJECT.md § Interface Contracts
- **Code layout**: PROJECT.md § Code Layout

## Key Decisions Made
- Use Zod preprocessing for `nominalTagihanBulanan` to handle numeric inputs and digits extraction.
- Refined Zod v4 syntax removing deprecated `required_error` and `invalid_type_error`.
- Validate referential integrity on delete: reject deletion if student has existing attendance (`absensi_privat`) or billing (`keuangan_privat`) records with informative guidance.
- Real-time IDR dot auto-formatting on input while typing, setting pure integer into form state.
- Tablecn `@tanstack/react-table` wrapper with column header sorting, pagination, and status filtering.

## Artifact Index
- `src/lib/date-utils.ts` — Date formatting utility conforming to GEMINI.md (Asia/Jakarta, colon separator)
- `src/app/admin/santri-privat/actions.ts` — Server actions for DB operations & cache revalidation
- `src/app/admin/santri-privat/columns.tsx` — TanStack Table columns definition
- `src/app/admin/santri-privat/SantriPrivatClient.tsx` — Client component with metrics, Tablecn, and modal form
- `src/app/admin/santri-privat/page.tsx` — Server component loader
- `src/components/Sidebar.tsx` — Admin navigation link under Database

## Change Tracker
- **Files modified**:
  - `src/lib/date-utils.ts`: Created new date/time utilities for WIB and colon date formatting.
  - `src/app/admin/santri-privat/actions.ts`: Created server actions for santri privat CRUD with referential integrity.
  - `src/app/admin/santri-privat/columns.tsx`: Created Tablecn columns with avatars, badges, and actions.
  - `src/app/admin/santri-privat/SantriPrivatClient.tsx`: Created client component with bento cards, Tablecn, and modal form.
  - `src/app/admin/santri-privat/page.tsx`: Created server component loader.
  - `src/components/Sidebar.tsx`: Added "Santri Privat" navigation entry under Database.
- **Build status**: PASS (`npx tsc --noEmit` exit code 0)
- **Pending issues**: None

## Quality Status
- **Build/test result**: PASS (TypeScript 5.x 0 errors)
- **Lint status**: clean
- **Tests added/modified**: Verified against static types and schema definitions

## Loaded Skills
- **Source**: C:\Users\hp\.gemini\config\skills\karpathy-guidelines\SKILL.md
- **Local copy**: not required (read directly)
- **Core methodology**: Caution, simplicity, surgical changes, and goal verification.

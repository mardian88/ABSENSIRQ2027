# BRIEFING — 2026-09-30T09:21:21Z

## Mission
Investigate business logic, server actions, billing generation, attendance recording, Portal Guru integration, authentication/session validation, and formatting helpers for Private Quran/Hafalan Student Management System.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigator, analyzer, synthesizer
- Working directory: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_3
- Original parent: b0cade56-be3d-44b5-85e9-dbdb03a5bb0f
- Milestone: survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement source code modifications
- Follow AGENTS.md (clean TypeScript, strict types, no dead code)
- Follow GEMINI.md (Asia/Jakarta WIB, DD:MM:YYYY with colons, 24h HH:mm, IDR currency formatting, no infinite redirect loops, tablecn UI)

## Current Parent
- Conversation ID: b0cade56-be3d-44b5-85e9-dbdb03a5bb0f
- Updated: 2026-09-30T09:30:00Z

## Investigation State
- **Explored paths**: `src/db/schema.ts`, `src/db/index.ts`, `sqlite.db`, `src/proxy.ts`, `src/app/santri/`, `src/app/admin-keuangan/`, `src/app/portal-guru/`, `src/lib/date.ts`, `src/lib/utils.ts`, `src/lib/jwt.ts`, `src/components/Sidebar.tsx`, `src/components/AppLayout.tsx`
- **Key findings**:
  1. `santri_privat`, `absensi_privat`, and `keuangan_privat` tables exist in `src/db/schema.ts` and in `sqlite.db`.
  2. Server actions are co-located in `src/app/<route>/actions.ts`.
  3. Clean TypeScript baseline verified (`npx tsc --noEmit` = 0 errors).
  4. Portal Guru uses signed JWT in `guru_session` cookie; session must be validated via DB lookup to prevent redirect loops.
  5. Flat-rate billing logic and manual private attendance actions designed according to requirements.
  6. Date format requires colon separator `DD:MM:YYYY` with `Asia/Jakarta` timezone per GEMINI.md.
- **Unexplored areas**: None (survey complete).

## Key Decisions Made
- Server actions for privat features will be placed in `src/app/admin/santri-privat/actions.ts`, `src/app/admin/keuangan/privat/actions.ts`, and `src/app/portal-guru/privat/actions.ts`.
- Dedicated date formatting helpers `formatTanggalWIB` and `formatWaktuWIB` will be specified for implementation.

## Artifact Index
- DISPATCH.md — Task dispatch information
- BRIEFING.md — Persistent situational awareness
- survey_report.md — Comprehensive survey report
- handoff.md — 5-component handoff report


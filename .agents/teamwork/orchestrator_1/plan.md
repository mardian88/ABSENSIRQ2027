# Execution Plan — Sistem Manajemen Santri Privat

## Objective
Implement and verify a comprehensive Private Quran & Hafalan Student Management System satisfying all requirements in `ORIGINAL_REQUEST.md`, complying strictly with `AGENTS.md` and `GEMINI.md`.

## Phase 0: Full Survey & Architecture Mapping
- Dispatch 3 parallel Explorers:
  1. **Explorer 1 (Schema & Data Layer)**: Examine database schema (Drizzle / Prisma / SQLite / Postgres / Supabase, specifically `santri_privat`, `absensi_privat`, tagihan/transaksi tables, migrations, models).
  2. **Explorer 2 (UI & Tablecn Conventions)**: Examine existing Tablecn implementations, admin routes, components, design tokens, form validation, `@tanstack/react-table` patterns.
  3. **Explorer 3 (Business Logic & Auth/Portal)**: Examine portal guru/admin navigation, server actions, billing generators, session handling (WIB Asia/Jakarta, date/time formatting, rupiah formatting, session redirect guards).
- Merge explorer findings into `PROJECT.md` at project root with complete Feature Inventory.

## Phase 1: Dual Track Launch
- **Track A (E2E Testing)**: Dispatch Test Writer / E2E specialist to build an opaque-box test suite across Tiers 1-4 and publish `TEST_READY.md`.
- **Track B (Implementation)**:
  - **Milestone 1**: Data & CRUD Santri Privat (`src/app/admin/santri-privat/page.tsx`, Tablecn, validation, actions).
  - **Milestone 2**: Tagihan Bulanan Tetap (`src/app/admin/keuangan/privat/page.tsx`, flat-rate server action generator, payment history).
  - **Milestone 3**: Pencatatan Absensi & Capaian (`absensi_privat`, form with hafalan/jilid progress, guru/admin portal).

## Phase 2: Final Verification & Adversarial Hardening
- Run full E2E test suite (100% pass required).
- Adversarial coverage hardening (Tier 5) with Challenger.
- Forensic Auditor integrity review (clean status required).
- TypeScript compile validation (`npx tsc --noEmit` clean).
- Report completion to Sentinel.

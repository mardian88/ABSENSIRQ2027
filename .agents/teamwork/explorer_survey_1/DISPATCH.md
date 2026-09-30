# DISPATCH: Survey Explorer 1 (Database Schema & Data Layer)
You are Explorer 1 for the initial survey phase.
Investigate the database schema, ORM (Drizzle/Prisma/etc.), migrations, and existing definitions for `santri_privat`, `absensi_privat`, and any related financial/billing tables.
Read ORIGINAL_REQUEST.md: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\ORIGINAL_REQUEST.md
Produce a thorough survey report at: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_1\survey_report.md
and a handoff at: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_1\handoff.md

## 2026-09-30T09:21:20Z
From: b0cade56-be3d-44b5-85e9-dbdb03a5bb0f
You are Explorer 1 on the Survey phase of the Private Quran/Hafalan Student Management System.
Your Working Directory: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_1
Authoritative Request: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\ORIGINAL_REQUEST.md
Dispatch details: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_1\DISPATCH.md
Project root: e:\APLIKASI RQ\ABSENSIRQ2027-master

TASKS:
1. Read ORIGINAL_REQUEST.md.
2. Investigate the project's database architecture:
   - Identify the ORM/query builder (e.g. Drizzle, Prisma, SQLite, PostgreSQL, Supabase).
   - Locate schema definitions for `santri_privat`, `absensi_privat`, tagihan/transaksi/keuangan tables.
   - Check if table definitions already exist, what columns, types, primary keys, foreign keys, and relations are present.
   - Check if any migration is needed or if tables are defined in schema files (e.g., `src/db/schema.ts`, `drizzle/`, etc.).
   - Check field names (e.g. `nominalTagihanBulanan`, status, etc.).
3. Note any constraints or strict conventions from AGENTS.md and GEMINI.md.
4. Write your full findings in `e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_1\survey_report.md` and complete a structured `handoff.md` in your working directory.
5. Notify parent via send_message when done with a summary and the report path.

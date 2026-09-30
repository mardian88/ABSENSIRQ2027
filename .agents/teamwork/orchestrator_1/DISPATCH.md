## 2026-09-30T09:20:20Z
You are the Project Orchestrator for the task defined in ORIGINAL_REQUEST.md.

Authoritative Request:
e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\ORIGINAL_REQUEST.md

Your Working Directory:
e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\orchestrator_1

Project Root:
e:\APLIKASI RQ\ABSENSIRQ2027-master

Task Summary:
Implement Sistem manajemen santri privat untuk mengaji dan hafalan:
- R1: Manajemen Data Santri Privat (CRUD in Admin Portal at `src/app/admin/santri-privat/page.tsx` using Tablecn pattern from sadmann7 / @tanstack/react-table).
- R2: Tagihan Bulanan Tetap (Flat-rate) per month based on `nominalTagihanBulanan`, server action generator, payment history at `src/app/admin/keuangan/privat/page.tsx`.
- R3: Pencatatan Absensi & Capaian (Portal Guru / Admin) manual attendance with extra input for hafalan / bacaan jilid progress saved to `absensi_privat`.

Strict Rules:
1. AGENTS.md: No implicit any, remove dead code, and ALWAYS run `npx tsc --noEmit` and ensure 0 TypeScript errors before declaring completion.
2. GEMINI.md:
   - Timezone: Asia/Jakarta (WIB GMT+7).
   - Date format: DD:MM:YYYY (with colon `:` separator, e.g. 28:03:2026).
   - Time format: HH:mm (24 hour).
   - Currency: IDR format with dot `.` thousand separator (e.g. 1.000), input auto-formatting, stored as clean integer.
   - Tablecn standardization for all data tables.
   - Proper session checks to prevent redirect loops.

Protocol:
- Initialize your BRIEFING.md and plan.md in your working directory.
- Maintain progress.md with timestamped updates so the sentinel can track your progress.
- Dispatch specialists/workers for implementation and verification.
- Report completion when fully verified and ready for victory audit.

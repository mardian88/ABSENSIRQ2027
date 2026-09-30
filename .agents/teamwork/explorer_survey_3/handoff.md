# Handoff Report: Explorer Survey 3

## 1. Observation
- **Database Schema**: In `src/db/schema.ts` (lines 708–736), `santriPrivat`, `absensiPrivat`, and `keuanganPrivat` are already defined with fields matching requirements.
- **Physical SQLite Verification**: Querying `sqlite_master` in `sqlite.db` confirmed all 3 tables exist (`santri_privat`, `absensi_privat`, `keuangan_privat`) with exact matching columns.
- **Server Action Patterns**: Server actions are co-located in `actions.ts` within route directories across `src/app/` (e.g. `src/app/santri/actions.ts`, `src/app/admin-keuangan/pembayaran/actions.ts`, `src/app/portal-guru/actions.ts`). Every file starts with `"use server";` and uses `revalidatePath`.
- **Portal Guru Architecture**: Authentication in `src/app/portal-guru/actions.ts` (lines 12–55) creates a signed JWT stored in the `guru_session` cookie. `getGuruSession()` validates the token and queries the `guru` table in the database.
- **Regular Finance Flow**: `src/app/admin-keuangan/pembayaran/actions.ts` handles regular billing via `prosesPembayaran`, inserting into `keuanganKas` with `status: 'lunas'`.
- **Date & Currency Helpers**: In `src/lib/date.ts`, `formatDateID` uses `en-GB` Intl formatter producing slashes (`DD/MM/YYYY`). In `src/lib/utils.ts`, `formatNominal` and `formatRp` format numbers using `id-ID` with dot thousand separators.
- **Proxy & Route Protection**: `src/proxy.ts` (lines 7–39) treats `/portal-guru` and `/portal-ortu` as public paths (relying on page-level cookie validation), while all dashboard/admin paths require the Better-Auth session token.
- **TypeScript Health**: Executing `cmd.exe /c "npx tsc --noEmit"` returned exit code 0 with 0 errors.

## 2. Logic Chain
1. **Server Action Structure**: Because all existing modules (`santri`, `admin-keuangan`, `portal-guru`) co-locate their actions in `src/app/<module>/actions.ts`, the new private student management features should place their actions in:
   - `src/app/admin/santri-privat/actions.ts`
   - `src/app/admin/keuangan/privat/actions.ts`
   - `src/app/portal-guru/privat/actions.ts`
2. **Billing Mechanism**:
   - `keuangan_privat` requires `(idSantriPrivat, bulan, tahun, nominalTagihan, status, tanggalLunas)`.
   - Monthly flat-rate billing generation should query all active `santri_privat` where `nominalTagihanBulanan > 0`, skip records already billed for that `(bulan, tahun)`, and insert rows with `status = 'belum_lunas'`.
   - Payment recording updates `status` to `'lunas'` and records `tanggalLunas`.
3. **Portal Guru Attendance**:
   - The user requires manual attendance in Portal Guru with extra inputs for "capaian hafalan" or "bacaan jilid", storing to `absensi_privat`.
   - `absensi_privat` has `idSantriPrivat`, `idGuru`, `waktuSesi`, `statusKehadiran`, `capaianHafalan`.
   - In Portal Guru, `idGuru` is automatically extracted from `getGuruSession().id`, preventing spoofing.
4. **Formatting Compliance (GEMINI.md)**:
   - `GEMINI.md` mandates `Asia/Jakarta` timezone, `DD:MM:YYYY` with colon separator, and 24h `HH:mm`.
   - Existing helpers use slashes (`/`), so we must introduce or use helper functions that replace slashes with colons: `.replace(/\//g, ':')`.
   - Nominal inputs must auto-format thousands with dots while sending raw integer values to server actions.
5. **Anti-Loop Session Handling**:
   - Both `/portal-guru` and `/admin` routes must validate sessions against the database before redirecting.

## 3. Caveats
- `src/app/portal-guru/mutabaah/actions.ts` (line 14) had a minor issue where `c.get("guru_session")?.value` was read directly without verifying the JWT. For the new privat module, we must strictly use `getGuruSession()` which verifies the token via `verifyToken()`.
- Route convention note: Existing admin routes use hyphens (e.g. `admin-keuangan`), but user prompt explicitly requested `src/app/admin/santri-privat/page.tsx` and `src/app/admin/keuangan/privat/page.tsx`. `AppLayout.tsx` seamlessly supports both, but we recommend adding redirect aliases (e.g. `/admin-keuangan/privat` -> `/admin/keuangan/privat`) and Sidebar navigation items.

## 4. Conclusion
The architectural foundation is fully ready for the implementation phase:
1. Schema & tables are verified in SQLite (`santri_privat`, `absensi_privat`, `keuangan_privat`).
2. Server action patterns and authentication mechanisms are clearly mapped.
3. Billing generation and payment recording logic can be cleanly implemented in `src/app/admin/keuangan/privat/actions.ts`.
4. Portal Guru attendance with capaian hafalan/jilid inputs can be cleanly implemented in `src/app/portal-guru/privat/actions.ts` and client component.
5. Date/time/currency helpers and Tablecn standards are established.

## 5. Verification Method
- **Typecheck verification**:
  ```bash
  cmd.exe /c "npx tsc --noEmit"
  ```
- **Database schema inspection**:
  ```bash
  node -e "const { createClient } = require('@libsql/client'); const c = createClient({ url: 'file:./sqlite.db' }); c.execute(\"SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%privat%'\").then(r => console.log(r.rows));"
  ```
- **Reports inspection**:
  - `e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_3\survey_report.md`
  - `e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_3\handoff.md`

# Handoff Report — Explorer 2 (UI Architecture, Tablecn & Route Survey)
**Task:** Survey Phase for Private Quran/Hafalan Student Management System  
**Working Directory:** `e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\explorer_survey_2`  
**Handoff Type:** Hard (Survey Complete)  

---

## 1. Observation

1. **Tablecn Component Suite:**
   - Exact location: `src/components/ui/data-table/`
   - Files:
     - `data-table.tsx` (lines 1-152): Core `@tanstack/react-table` wrapper with sorting, filtering, row selection, pagination, and toolbar integration.
     - `data-table-toolbar.tsx` (lines 1-78): Search input, reset button, sort toggle, custom `toolbarActions` render prop, and `DataTableViewOptions`.
     - `data-table-pagination.tsx` (lines 1-116): Page size dropdown (`[10, 20, 30, 40, 50]`), page indicator (`Page X of Y`), row selection summary, and navigation buttons.
     - `data-table-column-header.tsx` (lines 1-100): Sort asc/desc/clear dropdown and hide column toggle.
     - `data-table-skeleton.tsx` (lines 1-116): Loading skeleton supporting customizable column and row counts.
     - `src/components/ui/table.tsx` (lines 1-120): Radix-style headless HTML table components.

2. **Existing Admin Data Table Implementations:**
   - `src/app/santri/SantriClient.tsx` (line 15, lines 646-758): Implements `<DataTable sortColumn="nomorInduk" columns={getSantriColumns(...)} data={nonAlumniList} searchKey="namaLengkap" ... />`.
   - `src/app/admin-guru/AdminGuruClient.tsx` (line 11, lines 147-163): Implements `<DataTable sortColumn="nip" columns={getGuruColumns(...)} data={data} searchKey="namaLengkap" ... />`.
   - `src/app/dashboard/mutabaah/MutabaahAdminClient.tsx` (line 5, lines 25-29): Implements `<DataTable columns={getMutabaahColumns()} data={data} searchKey="namaSantri" />`.
   - `src/app/portal-guru/PortalGuruClient.tsx` (line 10) & `src/app/portal-guru/mutabaah/MutabaahGuruClient.tsx` (line 9, lines 180-200): Implements `<DataTable columns={...} data={...} />`.

3. **App Layout & Route Guarding:**
   - `src/components/AppLayout.tsx` (lines 12-18):
     ```typescript
     const isKioskRoute = pathname === "/pindai-wajah" || pathname === "/pindai-qr" || pathname === "/absensi/manual" || pathname === "/akses-absen";
     const isPublicRoute = pathname === "/" || pathname.startsWith("/psb") || pathname.startsWith("/admin-psb/cetak") || pathname.startsWith("/login") || pathname.startsWith("/izin") || pathname.startsWith("/portal-guru") || pathname.startsWith("/portal-ortu") || pathname.startsWith("/mutabaah") || isKioskRoute;
     ```
     Any route starting with `/admin/` (e.g. `/admin/santri-privat` and `/admin/keuangan/privat`) is NOT considered public, and will automatically be rendered inside the admin `AppLayout` with the `Sidebar`!
   - `src/proxy.ts` (lines 7-38): Protects dashboard paths against unauthenticated requests using `better-auth.session_token`.
   - `src/components/Sidebar.tsx` (lines 19-102): Contains groups `Database` (lines 36-44) and `Keuangan` (lines 84-95) where new menu links can be cleanly injected.

4. **Database Schema:**
   - `src/db/schema.ts` (lines 708-737):
     - `santriPrivat`: `id`, `namaLengkap`, `nomorInduk`, `kontakOrtu`, `statusSantri` ('aktif' | 'nonaktif'), `nominalTagihanBulanan`, `createdAt`.
     - `absensiPrivat`: `id`, `idSantriPrivat`, `idGuru`, `waktuSesi`, `statusKehadiran` ('hadir' | 'izin' | 'alpa'), `capaianHafalan`, `createdAt`.
     - `keuanganPrivat`: `id`, `idSantriPrivat`, `bulan`, `tahun`, `nominalTagihan`, `status` ('belum_lunas' | 'lunas'), `tanggalLunas`.

5. **Repository TypeScript State:**
   - Ran `cmd.exe /c "npx tsc --noEmit"`.
   - Exit code: 0 (Zero errors detected).

---

## 2. Logic Chain

1. **Table Standardization:**
   - Observation: GEMINI.md explicitly mandates that all admin data tables must use Tablecn by sadmann7 based on `@tanstack/react-table`.
   - Observation: `src/components/ui/data-table/` contains the exact reference Tablecn implementation already used by `/santri`, `/admin-guru`, and `/admin-psb`.
   - Inherence: The new pages (`/admin/santri-privat`, `/admin/keuangan/privat`, and `/portal-guru/absensi-privat`) must import `DataTable` directly from `@/components/ui/data-table/data-table` and follow the same `columns.tsx` + `<Client>.tsx` + `actions.ts` design pattern.

2. **Route Alignment:**
   - Observation: `ORIGINAL_REQUEST.md` specifies `src/app/admin/santri-privat/page.tsx` for R1 and `src/app/admin/keuangan/privat/page.tsx` for R2.
   - Observation: In Next.js App Router, creating these directory trees creates routes `/admin/santri-privat` and `/admin/keuangan/privat`.
   - Observation: In `AppLayout.tsx`, these routes will not match `isPublicRoute` and will automatically get the desktop sidebar and mobile drawer.
   - Inherence: We should add sidebar navigation entries in `src/components/Sidebar.tsx` under the `Database` and `Keuangan` groups, allowing users to navigate directly to both pages.

3. **Portal Guru Attendance:**
   - Observation: Requirement R3 states: "Buat halaman khusus di Portal Guru / Admin di mana guru pembimbing dapat melakukan absensi manual untuk sesi privat setelah sesi selesai."
   - Observation: In `src/app/portal-guru/`, teachers authenticate with `guru_session` and have a dedicated mobile-friendly layout without the admin sidebar.
   - Inherence: The primary teacher page should be placed at `src/app/portal-guru/absensi-privat/page.tsx` with a navigation tab/link in `PortalGuruClient.tsx`, following the proven pattern in `src/app/portal-guru/mutabaah/`. For admin oversight, attendance history can also be inspected from `/admin/santri-privat`.

4. **GEMINI.md Compliance:**
   - Date separator: Must use colon (`:`) e.g. `DD:MM:YYYY` (`28:03:2026`) and time `HH:mm` (24-hour) in `Asia/Jakarta`.
   - Currency: Display formatted in Indonesian Rupiah with period separator (`Rp 200.000`), inputs must feature real-time formatting with period separators while typing, and pure integer sent to the database.

---

## 3. Caveats

- **Existing Routes:** The existing app has routes like `/santri` and `/admin-guru` (without an `/admin/` folder previously). The requested routes `src/app/admin/santri-privat` and `src/app/admin/keuangan/privat` introduce the `src/app/admin/` folder structure. This is fully supported by Next.js and `AppLayout.tsx`, but developers must be aware that the URL will be `/admin/santri-privat` rather than `/santri-privat`.
- **Database Migrations:** The schema in `src/db/schema.ts` (lines 708-737) already defines the three tables. Explorer 1 / Schema survey will verify if the SQLite/LibSQL database already has the physical tables migrated or needs `drizzle-kit push`.

---

## 4. Conclusion

The UI and Tablecn investigation is complete. The system architecture is clean, highly modular, and ready for implementation.

**Key Architecture Decisions:**
1. **R1 Admin Santri Privat:** `src/app/admin/santri-privat/page.tsx` + `SantriPrivatClient.tsx` + `columns.tsx` + `actions.ts`. Uses Tablecn `DataTable` with search, status filters, and modal CRUD.
2. **R2 Admin Keuangan Privat:** `src/app/admin/keuangan/privat/page.tsx` + `KeuanganPrivatClient.tsx` + `columns.tsx` + `actions.ts`. Features monthly summary metrics, month/year selector, "Generate Tagihan" server action, and Tablecn table for payment statuses.
3. **R3 Portal Guru Absensi Privat:** `src/app/portal-guru/absensi-privat/page.tsx` + `AbsensiPrivatGuruClient.tsx` + `columns.tsx` + `actions.ts`. Features teacher session check, manual attendance form with memorization / jilid progress textarea, and session history Tablecn table.
4. **Navigation:** Add sidebar items in `src/components/Sidebar.tsx` and navigation tab in `src/app/portal-guru/PortalGuruClient.tsx`.
5. **Formatting Rules:** Strict adherence to `Asia/Jakarta` WIB, colon date formatting (`DD:MM:YYYY`), 24h time (`HH:mm`), and auto-formatting Rupiah inputs.

---

## 5. Verification Method

To independently verify the survey findings:

1. **Verify Tablecn Component Suite:**
   ```bash
   dir "src\components\ui\data-table"
   ```
   Check that `data-table.tsx`, `data-table-toolbar.tsx`, `data-table-pagination.tsx`, `data-table-column-header.tsx`, `data-table-view-options.tsx`, and `data-table-skeleton.tsx` exist.

2. **Verify Layout & Protected Path Logic:**
   - Inspect `src/components/AppLayout.tsx` line 14: confirm that `/admin/*` routes are excluded from `isPublicRoute`.
   - Inspect `src/proxy.ts` lines 8-38: confirm authentication rules for dashboard routes.

3. **Verify Existing Tablecn Implementations:**
   - Inspect `src/app/santri/SantriClient.tsx` line 646.
   - Inspect `src/app/admin-guru/AdminGuruClient.tsx` line 147.

4. **Verify TypeScript Type Check:**
   ```powershell
   cmd.exe /c "npx tsc --noEmit"
   ```
   Must exit with code 0 (zero errors).

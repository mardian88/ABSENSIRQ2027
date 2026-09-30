# Survey Report: Business Logic, Billing, Attendance, Portal Guru & Compliance (Explorer 3)

**Author:** Explorer Survey 3  
**Target:** Private Quran/Hafalan Student Management System (`santri_privat`, `absensi_privat`, `keuangan_privat`)  
**Date:** 2026-09-30  
**Status:** Completed  

---

## Executive Summary
This survey report delivers a comprehensive investigation of the business logic, server actions, billing mechanisms, attendance workflow, Portal Guru integration, authentication/session architecture, and formatting compliance rules across the repository.

All 3 core database tables for the private student management system (`santri_privat`, `absensi_privat`, `keuangan_privat`) have already been defined in `src/db/schema.ts` (lines 708–736) and verified to physically exist in `sqlite.db`. The codebase has a clean TypeScript baseline (`npx tsc --noEmit` exits with 0 errors).

---

## 1. Server Actions Architecture & Patterns

### 1.1 File Structure & Co-location
Server actions in this application are **strictly co-located alongside route directories** inside `src/app/<route>/actions.ts`. There is no central `src/actions/` directory.

Examples across modules:
- `src/app/santri/actions.ts` — Regular santri CRUD & batch operations.
- `src/app/admin-keuangan/pembayaran/actions.ts` — Regular santri payment processing.
- `src/app/admin-keuangan/monitoring/actions.ts` — Financial monitoring & billing ledger.
- `src/app/portal-guru/actions.ts` — Portal Guru authentication, session validation, and dashboard queries.
- `src/app/portal-guru/mutabaah/actions.ts` — Mutabaah setoran actions for teachers.

### 1.2 Action Signature & Conventions
Every server action module conforms to standard patterns:
1. Top directive: `"use server";`
2. Primary Key Generation: `v4 as uuidv4()` from the `uuid` package.
3. Database Queries: Drizzle ORM queries using `db.select()`, `db.insert()`, `db.update()`, `db.delete()`.
4. Cache Invalidation: Explicit `revalidatePath('/path/to/revalidate')` calls after write operations.
5. Error Handling & Return Types:
   - Query actions return arrays or typed objects directly.
   - Mutation actions return `{ success: true, message?: string, data?: any }` or throw descriptive `Error`s caught by UI handlers or SweetAlert (`showSuccess`, `showError`).

---

## 2. Billing Generation & Payment Recording

### 2.1 Existing Regular Billing System
In the existing regular santri finance module (`src/app/admin-keuangan/`):
- `pengaturanKeuangan`: Stores billing configurations (`kode`, `namaPembayaran`, `nominalDefault`, `nominalSaudara`).
- `keuanganKas` & `keuanganInfaq`: Records payments with attributes:
  - `idSantri`, `idTagihan`, `bulan`, `tahun`, `nominal`, `tanggalBayar`, `status: 'lunas' | 'belum_lunas'`, `metodeBayar: 'tunai' | 'potong_saldo' | 'transfer' | 'qris'`, `idPenerima: idAdmin`.
- Regular bills are not pre-generated in batch; instead, when an admin processes payments via `prosesPembayaran`, a `keuanganKas` row is inserted with `status = 'lunas'` and `tanggalBayar = new Date()`.

### 2.2 Flat-Rate Monthly Billing for Private Santri (`keuangan_privat`)
The schema for private santri finance is already defined in `src/db/schema.ts` (lines 728–736):
```ts
export const keuanganPrivat = sqliteTable('keuangan_privat', {
  id: text('id').primaryKey(),
  idSantriPrivat: text('id_santri_privat').references(() => santriPrivat.id),
  bulan: integer('bulan').notNull(),
  tahun: integer('tahun').notNull(),
  nominalTagihan: integer('nominal_tagihan').notNull(),
  status: text('status').notNull().default('belum_lunas'), // belum_lunas, lunas
  tanggalLunas: integer('tanggal_lunas', { mode: 'timestamp' })
});
```

### 2.3 Proposed Server Actions for `src/app/admin/keuangan/privat/actions.ts`
1. **`generateTagihanBulananPrivat(bulan: number, tahun: number)`**:
   - Queries all active private students: `db.select().from(santriPrivat).where(eq(santriPrivat.statusSantri, 'aktif'))`.
   - Filters out students whose `nominalTagihanBulanan <= 0`.
   - Queries existing bills for target `(bulan, tahun)` in `keuanganPrivat`.
   - Creates a set of existing student IDs to prevent duplicate billing.
   - Inserts new rows into `keuanganPrivat` for unbilled students:
     ```ts
     {
       id: uuidv4(),
       idSantriPrivat: s.id,
       bulan,
       tahun,
       nominalTagihan: s.nominalTagihanBulanan,
       status: 'belum_lunas',
       tanggalLunas: null
     }
     ```
   - Calls `revalidatePath('/admin/keuangan/privat')`.
   - Returns `{ success: true, generated: count, skipped: count }`.

2. **`catatPembayaranPrivat(idKeuanganPrivat: string, tanggalLunas?: Date)`**:
   - Updates `keuanganPrivat` row: `set({ status: 'lunas', tanggalLunas: tanggalLunas || new Date() })`.
   - Revalidates path and returns `{ success: true }`.

3. **`batalkanPembayaranPrivat(idKeuanganPrivat: string)`**:
   - Resets `status: 'belum_lunas'`, `tanggalLunas: null`.

4. **`getKeuanganPrivatList(bulan?: number, tahun?: number, status?: string)`**:
   - Performs inner join between `keuanganPrivat` and `santriPrivat`.
   - Calculates summary metrics:
     - `totalTagihan`: Sum of all `nominalTagihan`.
     - `totalLunas`: Sum of `nominalTagihan` where `status === 'lunas'`.
     - `totalBelumLunas`: Sum of `nominalTagihan` where `status === 'belum_lunas'`.
     - `persentaseLunas`: Ratio of paid to total.

---

## 3. Portal Guru Architecture, Sessions & Attendance

### 3.1 Portal Guru Authentication & Session Flow
- **Cookie Name**: `guru_session` (httpOnly, secure in production, sameSite `lax`, maxAge 7 days).
- **Token Mechanism**: Signed JWT (`SignJWT` using `BETTER_AUTH_SECRET` via `src/lib/jwt.ts`).
- **Session Lookup**:
  `getGuruSession()` in `src/app/portal-guru/actions.ts`:
  1. Reads `guru_session` cookie.
  2. Calls `verifyToken(token)` to extract payload `{ id: string, role: string }`.
  3. Queries database: `db.select().from(guru).where(eq(guru.id, idGuru))`.
  4. Returns `guruData` if active, or `null`.
- **Note on `mutabaah/actions.ts` bug detected**: In `src/app/portal-guru/mutabaah/actions.ts`, line 14 directly accessed `c.get("guru_session")?.value` without running `verifyToken()`. For the new privat module, we must always use `getGuruSession()` to correctly extract the verified `guru.id`.

### 3.2 Private Attendance Schema (`absensi_privat`)
Defined in `src/db/schema.ts` (lines 718–726):
```ts
export const absensiPrivat = sqliteTable('absensi_privat', {
  id: text('id').primaryKey(),
  idSantriPrivat: text('id_santri_privat').references(() => santriPrivat.id),
  idGuru: text('id_guru').references(() => guru.id),
  waktuSesi: integer('waktu_sesi', { mode: 'timestamp' }).notNull(),
  statusKehadiran: text('status_kehadiran').notNull(), // hadir, izin, alpa
  capaianHafalan: text('capaian_hafalan'),
  createdAt: integer('created_at', { mode: 'timestamp' })
});
```

### 3.3 Private Attendance Input & Recording Requirements
The attendance form requires:
1. **Santri Privat**: Combobox / dropdown selection from active `santri_privat`.
2. **Guru Pembimbing**:
   - In Portal Guru: Automatically bound to authenticated guru (`session.id`).
   - In Admin Portal: Dropdown of active teachers from `guru` table.
3. **Waktu Sesi**: Session timestamp (Date picker + 24h time input).
4. **Status Kehadiran**: Radio or Select ('hadir' | 'izin' | 'alpa').
5. **Capaian Hafalan / Bacaan Jilid**: Freeform textarea or structured text input to record progress (e.g., "Surah An-Naba: 1-20 lancar" or "Iqro 4 hal 15 makhraj qolqolah").
6. **Actions**:
   - `simpanAbsensiPrivat(data: { idSantriPrivat, idGuru, waktuSesi, statusKehadiran, capaianHafalan })`.
   - `getRiwayatAbsensiPrivat(filters?: { idSantriPrivat?, idGuru?, startDate?, endDate? })`.
   - `hapusAbsensiPrivat(id: string)`.

### 3.4 Integration Points in Portal Guru
- Route: `src/app/portal-guru/privat/page.tsx`
- Navigation: Add button/tab in `PortalGuruClient.tsx` (line 280) alongside "Riwayat Absensi" and "Mutabaah Santri":
  ```tsx
  <button onClick={() => router.push('/portal-guru/privat')} className="...">
    <UserCheck className="w-4 h-4 inline mr-2" /> Absensi Privat
  </button>
  ```

---

## 4. Date, Time & Currency Formatting Utilities Compliance

### 4.1 GEMINI.md Strict Rule Requirements
1. **Timezone:** Must be `Asia/Jakarta` (WIB, GMT+7).
2. **Date Format:** Must use colon (`:`) separator — `DD:MM:YYYY` (e.g., `28:03:2026`). Never use slash (`/`) or hyphen (`-`).
3. **Time Format:** 24-Hour format `HH:mm` (e.g., `14:30`).
4. **Currency Format:**
   - Display: Rupiah with dots (`.`) as thousands separator: `Rp 250.000` or `250.000`.
   - Input Form: Auto-formatting with dots as user types to prevent entry errors, with raw integer submitted to database.

### 4.2 Codebase Helper Analysis & Recommendations
- Current `formatDateID` in `src/lib/date.ts` uses `en-GB` Intl format, producing `DD/MM/YYYY` (slashes).
- Current `formatTanggal` in `src/lib/utils.ts` also outputs slashes (`DD/MM/YYYY`).
- **Recommended dedicated helpers** to place in `src/lib/date.ts` (or import in privat modules):
```ts
export function formatTanggalWIB(date: Date | string | number | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  return formatter.format(d).replace(/\//g, ':'); // Ensures DD:MM:YYYY
}

export function formatWaktuWIB(date: Date | string | number | null | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  return formatter.format(d); // Ensures HH:mm 24h
}
```
- **Currency formatting**: `formatNominal` and `formatRp` in `src/lib/utils.ts` already use `Intl.NumberFormat('id-ID')` with dot thousand separators. For input fields, an input masking helper `formatInputNumber(val)` should be used.

---

## 5. Session Validation & Prevention of Infinite Redirect Loops

### 5.1 GEMINI.md Anti-Loop Rule
In `GEMINI.md`:
> **Autentikasi & Redirect (Pencegahan Infinite Loop):**
> Saat menambahkan atau memodifikasi fitur di portal mana pun (khususnya Portal Orang Tua / Dashboard Ortu):
> 1. **Validasi Sesi Penuh**: Jangan hanya mengecek keberadaan string cookie untuk menentukan status login. Selalu validasi isi cookie tersebut ke database.
> 2. **Halaman Login**: Halaman `/login` wajib memvalidasi sesi ke dalam database *sebelum* me-redirect user ke dashboard.

### 5.2 Verification in Current Implementation
- `src/proxy.ts` allows public access to `/portal-guru` and `/portal-ortu`, delegating session validation to their respective server components.
- In `src/app/portal-guru/page.tsx`:
  Calls `getGuruDashboardData()`, which calls `getGuruSession()`, which queries `guru` table in database. If null, redirects to `/portal-guru/login`.
- In `src/app/portal-guru/login/page.tsx`:
  When building `/portal-guru/privat`, if the user has a valid active database session, redirect to `/portal-guru/privat`. If the cookie is present but invalid/expired/deleted from the database, the cookie must be cleared and redirect prevented.

---

## 6. Layout, Routing & Tablecn Compliance

### 6.1 Layout Integration
`src/components/AppLayout.tsx`:
- Public paths (`/portal-guru`, `/portal-ortu`, `/login`, etc.) are rendered without the Admin Sidebar.
- All non-public paths (such as `src/app/admin/santri-privat/page.tsx` and `src/app/admin/keuangan/privat/page.tsx`) automatically receive the full Admin responsive `Sidebar` with mobile drawer and header.

### 6.2 Tablecn Standard
Per `GEMINI.md` and user acceptance criteria:
- All tables must use `@tanstack/react-table` via existing components in `src/components/ui/data-table/`:
  - `DataTable` (`components/ui/data-table/data-table.tsx`)
  - `DataTableColumnHeader` (`components/ui/data-table/data-table-column-header.tsx`)
  - `DataTablePagination` (`components/ui/data-table/data-table-pagination.tsx`)
  - `DataTableViewOptions` (`components/ui/data-table/data-table-view-options.tsx`)

### 6.3 Strict TypeScript Baseline (AGENTS.md)
- Command: `cmd.exe /c "npx tsc --noEmit"`
- Exit Code: `0` (Zero errors across entire project).
- All new code must strictly declare explicit types and eliminate unused variables and dead code.

---

## 7. Synthesis & Architectural Recommendations for Implementation

| Requirement | Proposed File Path | Key Components & Actions |
|---|---|---|
| **R1: Santri Privat CRUD** | `src/app/admin/santri-privat/page.tsx`<br>`src/app/admin/santri-privat/SantriPrivatClient.tsx`<br>`src/app/admin/santri-privat/actions.ts`<br>`src/app/admin/santri-privat/columns.tsx` | - CRUD operations on `santriPrivat`<br>- Tablecn UI with status badges, search, sorting<br>- Modal form with nominal auto-formatting<br>- Sidebar navigation link in Database group |
| **R2: Flat-rate Billing** | `src/app/admin/keuangan/privat/page.tsx`<br>`src/app/admin/keuangan/privat/KeuanganPrivatClient.tsx`<br>`src/app/admin/keuangan/privat/actions.ts`<br>`src/app/admin/keuangan/privat/columns.tsx` | - `generateTagihanBulananPrivat(bulan, tahun)`<br>- `catatPembayaranPrivat(id, tanggal)`<br>- Monthly summary metrics cards<br>- Tablecn with payment status badge & actions<br>- Sidebar navigation link in Keuangan group |
| **R3: Absensi & Capaian** | `src/app/portal-guru/privat/page.tsx`<br>`src/app/portal-guru/privat/AbsensiPrivatGuruClient.tsx`<br>`src/app/portal-guru/privat/actions.ts`<br>`src/app/portal-guru/privat/columns.tsx` | - Form for manual privat attendance with "capaian hafalan / bacaan jilid"<br>- Bound to authenticated guru session<br>- Tablecn riwayat absensi privat<br>- Navigation tab in `PortalGuruClient.tsx` |
| **Route Alias / Redirect** | `src/app/admin-keuangan/privat/page.tsx` | - Redirects to `/admin/keuangan/privat` for backward consistency |
| **Helper Utilities** | `src/lib/date.ts` | - Add `formatTanggalWIB` (`DD:MM:YYYY` with colons) and `formatWaktuWIB` (`HH:mm`) |

# Project: Sistem Manajemen Santri Privat (Mengaji & Hafalan)

## Architecture
The system manages private students (both active regular students taking additional private classes, and external private-only students) for Quran recitation and memorization.
- **Data Layer**: Drizzle ORM (`drizzle-orm/libsql`) with Turso LibSQL client. Core schemas already defined in `src/db/schema.ts` (`santriPrivat`, `absensiPrivat`, `keuanganPrivat`).
- **Server Actions**: Co-located in App Router directories (`src/app/<route>/actions.ts`) with `"use server";`, `uuidv4()`, Drizzle operations, and path revalidations.
- **UI Framework & Components**: Next.js 16 App Router, React 19, Tailwind CSS v4, Lucide React, SweetAlert2, `react-hot-toast`.
- **Tablecn Standards**: Standardized `@tanstack/react-table` wrapper via `src/components/ui/data-table/` (`DataTable`, `DataTableToolbar`, `DataTablePagination`, `DataTableColumnHeader`).
- **Portal Guru & Admin Layout**: Admin pages wrapped by desktop sidebar (`src/components/Sidebar.tsx`) and mobile drawer; Portal Guru accessed via `/portal-guru` with JWT session cookie `guru_session`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Formatting & Compliance Helpers | Asia/Jakarta WIB timezone, DD:MM:YYYY date (colon separator), HH:mm 24h time, IDR dot thousands separator | M1, M2, M3 | GEMINI.md |
| 2 | R1: Manajemen Data Santri Privat | CRUD interface at `src/app/admin/santri-privat/page.tsx` using Tablecn pattern, Zod modal forms, currency input auto-formatting, sidebar entry | M1 | ORIGINAL_REQUEST §R1 |
| 3 | R2: Tagihan Bulanan Tetap (Flat-rate) | Server action generator based on `nominalTagihanBulanan`, payment recording, summary cards, Tablecn at `src/app/admin/keuangan/privat/page.tsx` | M2 | ORIGINAL_REQUEST §R2 |
| 4 | R3: Pencatatan Absensi & Capaian | Manual attendance form with mandatory input for capaian hafalan / bacaan jilid at `src/app/portal-guru/privat/page.tsx`, Tablecn history, Portal Guru nav | M3 | ORIGINAL_REQUEST §R3 |
| 5 | E2E Testing Suite (Tiers 1-4) | Comprehensive requirement-driven opaque-box test harness & test suite | E2E Track | ORIGINAL_REQUEST Acceptance Criteria |
| 6 | Adversarial Hardening & Type Validation | Tier 5 white-box challenger tests, `npx tsc --noEmit` 0 errors validation, Forensic Integrity Audit | M4 (Final) | AGENTS.md & GEMINI.md |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Manajemen Data Santri Privat (CRUD & Tablecn) | `src/app/admin/santri-privat/`, server actions, Tablecn table, Zod modal form, sidebar link | none | PLANNED |
| M2 | Tagihan Bulanan Tetap & Keuangan Privat | `src/app/admin/keuangan/privat/`, flat-rate bill generator, payment recording & status toggle, summary cards | M1 | PLANNED |
| M3 | Pencatatan Absensi & Capaian Privat | `src/app/portal-guru/privat/`, server actions, attendance form with capaian hafalan/jilid, history table, portal nav | M1 | PLANNED |
| M4 | Final E2E Pass, Hardening & Audit | Run 100% E2E tests, Tier 5 challenger verification, zero TS errors (`npx tsc --noEmit`), forensic audit clean | M1, M2, M3, E2E | PLANNED |

## Interface Contracts
### 1. `santri_privat` CRUD (`src/app/admin/santri-privat/actions.ts`)
- `getSantriPrivatList(): Promise<SantriPrivat[]>`
- `createSantriPrivat(data: { namaLengkap: string; nomorInduk?: string; kontakOrtu: string; nominalTagihanBulanan: number; statusSantri: 'aktif' | 'nonaktif' }): Promise<{ success: boolean; id?: string; error?: string }>`
- `updateSantriPrivat(id: string, data: Partial<{ namaLengkap: string; nomorInduk?: string; kontakOrtu: string; nominalTagihanBulanan: number; statusSantri: 'aktif' | 'nonaktif' }>): Promise<{ success: boolean; error?: string }>`
- `deleteSantriPrivat(id: string): Promise<{ success: boolean; error?: string }>`

### 2. `keuangan_privat` Billing & Payments (`src/app/admin/keuangan/privat/actions.ts`)
- `generateTagihanBulananPrivat(bulan: number, tahun: number): Promise<{ success: boolean; generated: number; skipped: number; message?: string }>`
- `catatPembayaranPrivat(idKeuanganPrivat: string, tanggalLunas?: Date): Promise<{ success: boolean; error?: string }>`
- `batalkanPembayaranPrivat(idKeuanganPrivat: string): Promise<{ success: boolean; error?: string }>`
- `getKeuanganPrivatList(bulan?: number, tahun?: number, status?: string): Promise<{ data: KeuanganPrivatWithSantri[]; summary: { totalTagihan: number; totalLunas: number; totalBelumLunas: number; persentaseLunas: number } }>`

### 3. `absensi_privat` Attendance & Progress (`src/app/portal-guru/privat/actions.ts`)
- `simpanAbsensiPrivat(data: { idSantriPrivat: string; idGuru?: string; waktuSesi: Date | string; statusKehadiran: 'hadir' | 'izin' | 'alpa'; capaianHafalan?: string }): Promise<{ success: boolean; error?: string }>`
- `getRiwayatAbsensiPrivat(filters?: { idSantriPrivat?: string; idGuru?: string; limit?: number }): Promise<AbsensiPrivatWithDetails[]>`
- `hapusAbsensiPrivat(id: string): Promise<{ success: boolean; error?: string }>`

## Code Layout
- `src/lib/date-utils.ts` / formatting helpers: Asia/Jakarta WIB, `DD:MM:YYYY`, `HH:mm`, Indonesian Rupiah formatting.
- `src/app/admin/santri-privat/`: Admin CRUD for private students. Owned by M1 Worker.
  - `page.tsx`: Server component loader.
  - `SantriPrivatClient.tsx`: Client view, modal forms, Tablecn.
  - `columns.tsx`: TanStack Table columns.
  - `actions.ts`: Server actions.
- `src/app/admin/keuangan/privat/`: Admin flat-rate billing & payments. Owned by M2 Worker.
  - `page.tsx`: Server component loader.
  - `KeuanganPrivatClient.tsx`: Client view, summary cards, generation modal, Tablecn.
  - `columns.tsx`: TanStack Table columns.
  - `actions.ts`: Server actions.
- `src/app/portal-guru/privat/`: Teacher portal private attendance & memorization progress. Owned by M3 Worker.
  - `page.tsx`: Server component loader with guru session check.
  - `AbsensiPrivatClient.tsx`: Client view, attendance & progress recording form, history table.
  - `actions.ts`: Server actions.
- `src/components/Sidebar.tsx`: Navigation items for Santri Privat and Tagihan Privat.
- `src/app/portal-guru/PortalGuruClient.tsx`: Navigation link for Absensi Privat.
- `tests/e2e/privat/`: E2E test suite owned by E2E Testing Track.

## Strict Standards Compliance
1. **AGENTS.md**: No implicit any, remove dead code, and ensure `npx tsc --noEmit` succeeds with 0 errors.
2. **GEMINI.md**:
   - Timezone: `Asia/Jakarta` (WIB GMT+7).
   - Date format: `DD:MM:YYYY` with colon separator (e.g. `28:03:2026`).
   - Time format: `HH:mm` (24 hour).
   - Currency: IDR format with dot thousand separator (`1.000`), real-time input auto-formatting, stored as integer.
   - Tablecn: All tables use `@tanstack/react-table` wrapper in `src/components/ui/data-table/`.
   - Zero infinite redirect loops: full database session validation.

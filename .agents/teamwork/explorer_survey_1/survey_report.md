# Database Architecture & Data Layer Survey Report
**Project**: Private Quran/Hafalan Student Management System (`santri_privat`, `absensi_privat`, `keuangan_privat`)  
**Investigator**: Explorer 1 (Survey Phase)  
**Date**: 2026-09-30  
**Status**: Completed  

---

## 1. Executive Summary

This survey examined the database architecture, ORM configuration, schema definitions, and migration status for the Private Quran/Hafalan Student Management feature. 

### Key Findings
1. **ORM & Driver**: The project uses **Drizzle ORM** (`drizzle-orm` v0.45.2, `drizzle-kit` v0.31.10) with `@libsql/client` (Turso LibSQL / SQLite dialect). The connection is managed in `src/db/index.ts`.
2. **Pre-Existing Table Definitions**: The tables `santri_privat`, `absensi_privat`, and `keuangan_privat` are **already defined** in `src/db/schema.ts` (lines 708–736).
3. **Database State on Turso**: Direct inspection of the live Turso database confirmed that all three tables (`santri_privat`, `absensi_privat`, `keuangan_privat`) **already exist** in Turso with the exact matching DDL, columns, and foreign keys. All three tables currently have 0 records.
4. **No Migration Required**: Because the tables are already created on the database, no new DDL migrations or `client.execute()` scripts are required to start implementing CRUD, billing, and attendance features.
5. **TypeScript Health**: The project's TypeScript compilation (`npx tsc --noEmit`) passes with **0 errors**.

---

## 2. Database Stack & Configuration

- **ORM**: Drizzle ORM (`drizzle-orm/libsql`)
- **Dialect**: `turso` (SQLite compatible)
- **Database Client**: `@libsql/client`
- **Connection Configuration** (`src/db/index.ts` & `drizzle.config.ts`):
  ```typescript
  // src/db/index.ts
  import { drizzle } from 'drizzle-orm/libsql';
  import { createClient } from '@libsql/client';
  import * as schema from './schema';

  const client = createClient({
    url: process.env.DATABASE_URL || 'file:./sqlite.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  export const db = drizzle(client, { schema });
  ```
- **Drizzle Config** (`drizzle.config.ts`):
  - `schema`: `./src/db/schema.ts`
  - `out`: `./drizzle`
  - `dialect`: `'turso'`

---

## 3. Detailed Schema & Table Analysis

### 3.1. `santri_privat`
- **Location in Code**: `src/db/schema.ts` (lines 708–716)
- **Export Name**: `export const santriPrivat = sqliteTable('santri_privat', { ... })`
- **Live SQL DDL on Turso**:
  ```sql
  CREATE TABLE `santri_privat` (
    `id` text PRIMARY KEY NOT NULL,
    `nama_lengkap` text NOT NULL,
    `nomor_induk` text,
    `kontak_ortu` text NOT NULL,
    `status_santri` text DEFAULT 'aktif' NOT NULL,
    `nominal_tagihan_bulanan` integer DEFAULT 0 NOT NULL,
    `created_at` integer
  );
  ```
- **Column Specifications**:
  | Column (DB) | Property (Drizzle) | Type (SQLite) | Mode / Constraints | Description |
  |---|---|---|---|---|
  | `id` | `id` | `TEXT` | Primary Key, Not Null | Unique identifier (UUID v4) |
  | `nama_lengkap` | `namaLengkap` | `TEXT` | Not Null | Student's full name |
  | `nomor_induk` | `nomorInduk` | `TEXT` | Nullable | Optional Student ID (NIS). Allows linking active regular santri or left blank/custom for external santri |
  | `kontak_ortu` | `kontakOrtu` | `TEXT` | Not Null | Parent's WhatsApp/phone contact |
  | `status_santri` | `statusSantri` | `TEXT` | Not Null, Default `'aktif'` | Status: `'aktif'` or `'nonaktif'` |
  | `nominal_tagihan_bulanan` | `nominalTagihanBulanan` | `INTEGER` | Not Null, Default `0` | Flat-rate monthly tuition/fee in IDR (integer without dots) |
  | `created_at` | `createdAt` | `INTEGER` | Nullable, `{ mode: 'timestamp' }` | Creation timestamp |

### 3.2. `absensi_privat`
- **Location in Code**: `src/db/schema.ts` (lines 718–726)
- **Export Name**: `export const absensiPrivat = sqliteTable('absensi_privat', { ... })`
- **Live SQL DDL on Turso**:
  ```sql
  CREATE TABLE `absensi_privat` (
    `id` text PRIMARY KEY NOT NULL,
    `id_santri_privat` text,
    `id_guru` text,
    `waktu_sesi` integer NOT NULL,
    `status_kehadiran` text NOT NULL,
    `capaian_hafalan` text,
    `created_at` integer,
    FOREIGN KEY (`id_santri_privat`) REFERENCES `santri_privat`(`id`) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (`id_guru`) REFERENCES `guru`(`id`) ON UPDATE no action ON DELETE no action
  );
  ```
- **Column Specifications**:
  | Column (DB) | Property (Drizzle) | Type (SQLite) | Mode / Constraints | Description |
  |---|---|---|---|---|
  | `id` | `id` | `TEXT` | Primary Key, Not Null | Unique session record ID (UUID v4) |
  | `id_santri_privat` | `idSantriPrivat` | `TEXT` | Nullable, FK to `santri_privat(id)` | Targeted private student |
  | `id_guru` | `idGuru` | `TEXT` | Nullable, FK to `guru(id)` | Assigned teacher / guru pembimbing |
  | `waktu_sesi` | `waktuSesi` | `INTEGER` | Not Null, `{ mode: 'timestamp' }` | Date & time of the private session |
  | `status_kehadiran` | `statusKehadiran` | `TEXT` | Not Null | Attendance status: `'hadir'`, `'izin'`, `'alpa'` |
  | `capaian_hafalan` | `capaianHafalan` | `TEXT` | Nullable | Notes on memorization / reading progress (e.g. "Juz 30 An-Naba 1-15" or "Iqro 4 Hal 12") |
  | `created_at` | `createdAt` | `INTEGER` | Nullable, `{ mode: 'timestamp' }` | Log creation timestamp |

### 3.3. `keuangan_privat`
- **Location in Code**: `src/db/schema.ts` (lines 728–736)
- **Export Name**: `export const keuanganPrivat = sqliteTable('keuangan_privat', { ... })`
- **Live SQL DDL on Turso**:
  ```sql
  CREATE TABLE `keuangan_privat` (
    `id` text PRIMARY KEY NOT NULL,
    `id_santri_privat` text,
    `bulan` integer NOT NULL,
    `tahun` integer NOT NULL,
    `nominal_tagihan` integer NOT NULL,
    `status` text DEFAULT 'belum_lunas' NOT NULL,
    `tanggal_lunas` integer,
    FOREIGN KEY (`id_santri_privat`) REFERENCES `santri_privat`(`id`) ON UPDATE no action ON DELETE no action
  );
  ```
- **Column Specifications**:
  | Column (DB) | Property (Drizzle) | Type (SQLite) | Mode / Constraints | Description |
  |---|---|---|---|---|
  | `id` | `id` | `TEXT` | Primary Key, Not Null | Unique billing record ID (UUID v4) |
  | `id_santri_privat` | `idSantriPrivat` | `TEXT` | Nullable, FK to `santri_privat(id)` | Targeted private student |
  | `bulan` | `bulan` | `INTEGER` | Not Null | Billing Month (1 to 12) |
  | `tahun` | `tahun` | `INTEGER` | Not Null | Billing Year (e.g. 2026, 2027) |
  | `nominal_tagihan` | `nominalTagihan` | `INTEGER` | Not Null | Generated flat-rate bill amount in IDR |
  | `status` | `status` | `TEXT` | Not Null, Default `'belum_lunas'` | Payment status: `'belum_lunas'` or `'lunas'` |
  | `tanggal_lunas` | `tanggalLunas` | `INTEGER` | Nullable, `{ mode: 'timestamp' }` | Date & time when paid |

---

## 4. Relationship and Integration Analysis

1. **Relation with `guru`**:
   - `absensiPrivat.idGuru` references `guru.id`.
   - `guru` table contains 7 active teachers on Turso (`id`, `nip`, `nama_lengkap`, `kontak_wa`, `status_aktif`).
   - Portal Guru authentication uses cookie `guru_session`, which decrypts to `payload.id` matching `guru.id`.
2. **Relation with `santri` (Regular Active Students)**:
   - `santri` has 148 active students in Turso.
   - For R1 ("baik untuk santri aktif yang mengambil kelas privat tambahan, maupun santri eksternal yang hanya mengambil kelas privat"):
     - When adding an active santri, the admin can either pick from the existing `santri` list (auto-populating `namaLengkap`, `nomorInduk`, `kontakOrtu`), or manually type external student details.
3. **Relation with `keuangan_buku_kas`**:
   - When a private bill in `keuangan_privat` is marked `lunas` (or paid), it can optionally generate an automatic entry or be integrated with general cash ledger (`keuangan_buku_kas`) under category `"Privat"` or `"SPP Privat"`.

---

## 5. Architectural & Strict Rule Constraints

From `AGENTS.md` and `GEMINI.md`:
1. **Strict TypeScript & Vercel**:
   - No implicit `any`.
   - Zero dead code or unused variables.
   - Must run and pass `cmd.exe /c "npx tsc --noEmit"` before completing implementation.
2. **Timezone & Date Conventions**:
   - Timezone must always be `Asia/Jakarta` (WIB, GMT+7).
   - Date display format must use **colon (`:`)** separator: `DD:MM:YYYY` (e.g., `28:03:2026`). Never `/` or `-`.
   - Time format: 24-Hour `HH:mm` (e.g., `14:30`).
3. **Currency Conventions**:
   - UI display: Format using dot as thousands separator (e.g., `Rp 150.000` via `Intl.NumberFormat('id-ID')`).
   - Form inputs: Auto-formatting with dots on input.
   - Database storage: Plain raw integer without punctuation.
4. **UI Design Standard**:
   - Must use `Tablecn` (`@tanstack/react-table`) sadmann7 components located at `@/components/ui/data-table/data-table.tsx`.
   - Avoid generic AI slop: use clean typography, polished badge indicators, consistent padding and rounded corners.

---

## 6. Implementation Recommendations

### R1: Student Management (`src/app/admin/santri-privat/page.tsx`)
- Support routing to `/admin/santri-privat` (or `/admin-santri-privat` with redirect/alias).
- Server actions: `getSantriPrivatList`, `createSantriPrivat`, `updateSantriPrivat`, `deleteSantriPrivat`, `getRegularSantriOptions` (for quick import of active santri).
- Use `DataTable` from `@/components/ui/data-table/data-table.tsx` with columns: NIS, Nama Lengkap, Kontak Ortu, Status (Aktif/Nonaktif Badge), Nominal Tagihan Bulanan (formatted IDR), Aksi (Edit, Hapus).

### R2: Monthly Flat-Rate Billing (`src/app/admin/keuangan/privat/page.tsx`)
- Server actions:
  - `generateTagihanBulananPrivat(bulan, tahun)`: Iterates all active `santri_privat`, inserts into `keuangan_privat` with `nominalTagihan = s.nominalTagihanBulanan` if not already generated.
  - `getKeuanganPrivatList(bulan, tahun, statusFilter)`: Retrieves bills with student name, contacts, amount, status.
  - `markTagihanLunas(idTagihan, metodeBayar)`: Updates status to `'lunas'` and sets `tanggalLunas = new Date()`.
- Filter by Month/Year and Status (Semua, Belum Lunas, Lunas).
- Summary cards: Total Tagihan Bulan Ini, Total Terbayar (Lunas), Total Belum Lunas, Persentase Pembayaran.

### R3: Attendance & Memorization Progress in Portal Guru (`src/app/portal-guru/privat/page.tsx` & `/portal-guru`)
- Server actions:
  - `getSantriPrivatOptions()`: Active private students.
  - `recordAbsensiPrivat(idSantriPrivat, waktuSesi, statusKehadiran, capaianHafalan)`: Automatically assigns `idGuru` from `getGuruSession()`.
  - `getRiwayatAbsensiPrivatGuru(idGuru)`: History of private sessions taught by the guru.
- Portal Guru UI:
  - Add navigation tab/card "Sesi Privat" in `PortalGuruClient.tsx` (linking to `/portal-guru/privat`).
  - Attendance Form:
    - Select Student (`idSantriPrivat`)
    - Session Date & Time (`waktuSesi`, defaulting to now WIB)
    - Status Kehadiran (`hadir`, `izin`, `alpa`)
    - Capaian Hafalan / Bacaan Jilid (Text input / textarea: e.g. "Juz 30 Surat An-Naba ayat 1-20", "Iqro 5 hal 10")
  - Riwayat Absensi Privat Table / List showing session history and achievements.

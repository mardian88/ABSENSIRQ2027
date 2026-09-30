# Comprehensive UI Architecture & Tablecn Survey Report
**Project:** Private Quran/Hafalan Student Management System (`santri_privat`, `keuangan_privat`, `absensi_privat`)  
**Investigator:** Explorer 2 (UI Architecture & Tablecn Specialist)  
**Date:** 2026-09-30  
**Status:** Completed  

---

## 1. Executive Summary

This report establishes the complete frontend design and component architecture for implementing the Private Quran/Hafalan Student Management System. 

The application is built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **@tanstack/react-table v8.21.3** (Tablecn - sadmann7 design), **Radix UI**, **Lucide React**, **React Hook Form**, and **Zod**.

Existing admin pages (`/santri`, `/admin-guru`, `/admin-psb`, `/dashboard/mutabaah`, `/portal-guru`) consistently leverage a standardized `DataTable` wrapper located in `src/components/ui/data-table/`. All planned routes (`/admin/santri-privat`, `/admin/keuangan/privat`, and `/portal-guru/absensi-privat`) can be implemented using these established design standards, ensuring 100% architectural uniformity, strict TypeScript compliance (`npx tsc --noEmit` verified with 0 errors), and full adherence to GEMINI.md and AGENTS.md rules.

---

## 2. Tablecn / @tanstack/react-table Implementation

### 2.1 Component Suite Location & Structure
The project contains an existing, fully functioning Tablecn implementation in `src/components/ui/data-table/`:

| File | Purpose | Key Features |
|---|---|---|
| `data-table.tsx` | Main table component | Wraps `@tanstack/react-table`, handles pagination, column visibility, sorting, and row selection. |
| `data-table-toolbar.tsx` | Search, filtering, action toolbar | Debounced search input, reset filters button, sort toggle button, custom `toolbarActions` slot, and view options popover. |
| `data-table-pagination.tsx` | Table pagination bar | Page size select (10, 20, 30, 40, 50), page indicator (`Page X of Y`), row selection counter (`X of Y row(s) selected`), navigation buttons (`ChevronsLeft`, `ChevronLeft`, `ChevronRight`, `ChevronsRight`). |
| `data-table-column-header.tsx` | Sortable/hideable column headers | Dropdown menu with Asc, Desc, Reset sort, and Hide column options. |
| `data-table-view-options.tsx` | Column visibility toggle | Command-based popover to toggle column visibility. |
| `data-table-skeleton.tsx` | Table loading state | Clean animated skeleton for loading states matching row and column counts. |
| `src/components/ui/table.tsx` | Base HTML table primitive | Radix-style headless table elements styled with Tailwind (`Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`). |

### 2.2 `DataTable` Component Props Interface
From `src/components/ui/data-table/data-table.tsx`:
```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;               // Key to search/filter (e.g. "namaLengkap")
  searchPlaceholder?: string;       // Input placeholder (default: "Cari...")
  sortColumn?: string;              // Column to toggle sort via toolbar button
  toolbarActions?: (table: Table<TData>) => React.ReactNode; // Slot for custom filters & action buttons
  rowSelection?: any;               // Controlled row selection state
  onRowSelectionChange?: any;       // Callback for row selection changes
}
```

---

## 3. Data Table & CRUD Patterns in Existing Admin Modules

### 3.1 Santri Management (`src/app/santri/`)
- **Structure:**
  - `page.tsx`: Server Component with `export const dynamic = "force-dynamic"`. Fetches data from server actions and passes to client component.
  - `SantriClient.tsx`: Client Component handling state, search, dialogs, and bulk actions.
  - `columns.tsx`: Separate column definitions using `ColumnDef<any>[]`.
  - `actions.ts`: Server Actions (`"use server"`) using Drizzle ORM and `revalidatePath`.
- **Column Pattern:**
  - Row checkbox (`id: "select"`) using `@/components/ui/checkbox`.
  - Primary text with avatar thumbnail (`namaLengkap` with initial avatar circle `bg-slate-200 text-slate-500 font-bold`).
  - Status badge: Active (`bg-emerald-100 text-emerald-700`) vs Inactive (`bg-rose-100 text-rose-700`).
  - Actions column (`id: "actions"`): Edit (`Edit2`), Delete (`Trash2`), and custom action buttons (`Badge`, `GraduationCap`, `QrCode`).
- **Toolbar Pattern:**
  - Left: Search input (`Input` component, `w-[150px] lg:w-[250px]`).
  - Right: Category/Status select dropdowns (`h-9 px-3 py-1 bg-white border border-slate-200 rounded-md text-sm`), mass action dropdown (`Aksi Massal`), and Add button (`Tambah Santri`).

### 3.2 Guru Management (`src/app/admin-guru/`)
- **Structure:**
  - Client component `AdminGuruClient.tsx` uses `DataTable` with `sortColumn="nip"`, `searchKey="namaLengkap"`.
  - Header displays title, subtitle, selected count counter (`Cetak ID Card (X)`, `Hapus (X)`), and primary action button (`Tambah Data`).
  - Modal dialog uses fixed overlay with `bg-black/50` or `bg-slate-950/50 backdrop-blur-sm`, clean rounded container, sticky header, scrollable body, and action footer (`Batal`, `Simpan`).

### 3.3 Mutabaah & Portal Guru (`src/app/portal-guru/` & `src/app/dashboard/mutabaah/`)
- In `src/app/dashboard/mutabaah/MutabaahAdminClient.tsx`, Tablecn `DataTable` displays student recitation/memorization progress:
  - Columns: Tanggal, Santri & Halaqah, Kategori (`mengaji` vs `hafalan`), Capaian (truncation with full title hover and notes badge), Input Oleh (Guru vs Wali), Status Ortu (`Dilihat` vs `Belum`).
- In `src/app/portal-guru/mutabaah/MutabaahGuruClient.tsx`:
  - Tabbed interface: `Input Setoran` (form) and `Riwayat Mutabaah` (DataTable).
  - Clean mobile-responsive sticky header (`bg-emerald-700 text-white`).

---

## 4. Route Conventions & Layout Architecture

### 4.1 Layout & Navigation Flow
- **Root Layout (`src/app/layout.tsx`):**
  - Wraps entire application with `<AppLayout>{children}</AppLayout>` and `Toaster` from `react-hot-toast`.
- **App Layout (`src/components/AppLayout.tsx`):**
  - Inspects `pathname` via `usePathname()`.
  - Renders `<Sidebar />` on desktop (`md:relative md:translate-x-0`) and drawer overlay on mobile (`fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 md:hidden`).
  - Protected vs Public routes check:
    ```typescript
    const isPublicRoute = pathname === "/" || pathname.startsWith("/psb") || 
      pathname.startsWith("/admin-psb/cetak") || pathname.startsWith("/login") || 
      pathname.startsWith("/izin") || pathname.startsWith("/portal-guru") || 
      pathname.startsWith("/portal-ortu") || pathname.startsWith("/mutabaah") || isKioskRoute;
    ```
  - **Key Observation:** Since `/admin/*` routes are NOT in `isPublicRoute`, any page under `src/app/admin/...` will automatically receive the full admin `Sidebar` and desktop header layout!

### 4.2 Sidebar Integration (`src/components/Sidebar.tsx`)
- The sidebar defines navigation groups:
  1. `Main`: Dashboard (`/dashboard`)
  2. `KIOSK`: Pindai QR (`/pindai-qr`), Absensi Manual (`/absensi/manual`)
  3. `Database`:
     - Hasil PSB (`/admin-psb`)
     - Database Santri (`/santri`)
     - Database Alumni (`/alumni`)
     - Data Pengurus/Guru (`/admin-guru`)
     - **Addition for R1:** `Santri Privat` (`/admin/santri-privat`, icon: `Users`)
  4. `Keuangan`:
     - Monitoring Pembayaran (`/admin-keuangan/monitoring`)
     - Pembayaran (Kas/Iuran) (`/admin-keuangan/pembayaran`)
     - Buku Kas Umum (`/admin-keuangan/buku-kas`)
     - Top-Up Saldo (`/admin-keuangan/top-up`)
     - Tabungan Santri (`/admin-keuangan/tabungan`)
     - Kebutuhan Santri (`/admin-keuangan/katalog`)
     - Wakaf (`/admin-keuangan/donasi`)
     - **Addition for R2:** `Tagihan Privat` (`/admin/keuangan/privat`, icon: `Coins` or `Wallet`)
- **Auto-expand capability:** `Sidebar.tsx` includes an `useEffect` that automatically expands the parent group accordion if the current `pathname` starts with the item's `href`.

### 4.3 Portal Guru Navigation (`src/app/portal-guru/PortalGuruClient.tsx`)
- Portal Guru is a dedicated teacher-facing portal located at `/portal-guru`.
- Header tab navigation currently contains:
  - `Riwayat Absensi` (dashboard)
  - `Mutabaah Santri` (navigates to `/portal-guru/mutabaah`)
  - `Kontrak & Dokumen` (kontrak)
- **Addition for R3:**
  - Add navigation item for `Absensi Privat` (navigates to `/portal-guru/absensi-privat`, icon: `CalendarCheck` or `BookOpen`).

---

## 5. Requirements Mapping & Proposed Route Specifications

### 5.1 R1: Santri Privat Management
- **Directory:** `src/app/admin/santri-privat/`
  - `page.tsx`: Server component fetching `santri_privat` records via server actions.
  - `SantriPrivatClient.tsx`: Client component managing state, CRUD modals, search, and Tablecn table.
  - `columns.tsx`: TanStack Table column definitions (`ColumnDef<any>[]`).
  - `actions.ts`: Server Actions (`getSantriPrivatList`, `createSantriPrivat`, `updateSantriPrivat`, `deleteSantriPrivat`).
- **Table Columns (`columns.tsx`):**
  1. `select`: Row selection checkbox.
  2. `nomorInduk`: NIS / Kode Santri (optional/auto).
  3. `namaLengkap`: Full name with initials avatar.
  4. `kontakOrtu`: WhatsApp / Phone contact of guardian.
  5. `nominalTagihanBulanan`: Flat-rate monthly tuition amount formatted with `formatRp` (e.g. `Rp 250.000`).
  6. `statusSantri`: Status badge (`aktif`: emerald badge, `nonaktif`: rose badge).
  7. `createdAt`: Registration date formatted as `DD:MM:YYYY` WIB.
  8. `actions`: Edit button, Delete button (with confirmation dialog).
- **CRUD Modal Form (`SantriPrivatClient.tsx`):**
  - Form validation: `zod` schema with `react-hook-form`.
  - Fields:
    - `namaLengkap`: text, required.
    - `nomorInduk`: text, optional.
    - `kontakOrtu`: text, required (WhatsApp format).
    - `nominalTagihanBulanan`: number input with real-time dot formatting (e.g. user types `250000` -> displays `250.000`, sends `250000` to server).
    - `statusSantri`: select (`aktif` | `nonaktif`).
  - User feedback: `SweetAlert2` for delete confirmation (`showConfirm`), success alerts (`showSuccess`), and error alerts (`showError`).

### 5.2 R2: Flat-rate Monthly Billing (`keuangan_privat`)
- **Directory:** `src/app/admin/keuangan/privat/`
  - `page.tsx`: Server component fetching `keuangan_privat` joined with `santri_privat`.
  - `KeuanganPrivatClient.tsx`: Client component with summary statistics cards, month/year selector, "Generate Tagihan" trigger, and payment status toggle.
  - `columns.tsx`: TanStack Table column definitions.
  - `actions.ts`: Server Actions (`getKeuanganPrivatList`, `generateTagihanBulananPrivat`, `updateStatusPembayaranPrivat`, `deleteTagihanPrivat`).
- **Summary Metrics Cards (UI/UX Pro Max):**
  - 3 metric cards at top:
    1. Total Tagihan Bulan Ini (Rp)
    2. Total Terbayar / Lunas (Rp + count)
    3. Total Tunggakan / Belum Lunas (Rp + count)
- **Table Columns (`columns.tsx`):**
  1. `select`: Row selection checkbox.
  2. `santri`: `namaLengkap` & `nomorInduk`.
  3. `periode`: Bulan & Tahun (e.g., "Maret 2026").
  4. `nominalTagihan`: Formatted Rupiah (`Rp 250.000`).
  5. `status`: Status badge: `Lunas` (`bg-emerald-100 text-emerald-700`) vs `Belum Lunas` (`bg-amber-100 text-amber-700`).
  6. `tanggalLunas`: Date of settlement (`DD:MM:YYYY HH:mm WIB` or `-`).
  7. `actions`: Action button "Tandai Lunas" / "Batalkan Lunas", Delete tagihan.
- **Generate Tagihan Action:**
  - Button `Generate Tagihan Bulanan` with modal or prompt confirming month and year.
  - Server Action selects all active `santri_privat` with `nominalTagihanBulanan > 0`, checks for existing records for `(idSantriPrivat, bulan, tahun)` to prevent duplicates, and inserts missing bills into `keuangan_privat`.

### 5.3 R3: Absensi & Capaian (Portal Guru & Admin)
- **Teacher Route:** `src/app/portal-guru/absensi-privat/`
  - `page.tsx`: Server component validating `guru_session` cookie and fetching teacher profile and active private students.
  - `AbsensiPrivatGuruClient.tsx`: Client component styled like `MutabaahGuruClient.tsx` (sticky emerald header, responsive card container, tabs).
  - `columns.tsx`: TanStack Table columns for attendance history.
  - `actions.ts`: Server Actions (`simpanAbsensiPrivat`, `getRiwayatAbsensiPrivatGuru`, `hapusAbsensiPrivat`).
- **Teacher Interface Tabs:**
  - **Tab 1: Input Absensi Sesi:**
    - Dropdown: Pilih Santri Privat (active private students).
    - Date & Time: Tanggal Sesi (`DatePicker` formatted `DD:MM:YYYY`), Jam Sesi (`Input` time `HH:mm`).
    - Status Kehadiran: Segmented radio buttons (`Hadir`, `Izin`, `Alpa`).
    - Capaian Hafalan / Bacaan Jilid: Textarea with placeholder (e.g., "Surah Al-Mulk ayat 1-15, tajwid makhraj huruf jelas" atau "Iqro Jilid 4 hal 12-14").
    - Action button: `Simpan Absensi & Capaian` (with loading state).
  - **Tab 2: Riwayat Absensi:**
    - Tablecn `DataTable` showing recent private attendance sessions:
      - Waktu Sesi (`DD:MM:YYYY HH:mm WIB`)
      - Nama Santri
      - Status (`Hadir`, `Izin`, `Alpa`)
      - Capaian Hafalan / Jilid
      - Aksi (Hapus jika sesi hari ini / keliru)
- **Admin Visibility:**
  - In `src/app/admin/santri-privat/page.tsx`, include a tab or drawer / modal to inspect the full attendance and memorization log of private students, providing admin oversight.

---

## 6. GEMINI.md & AGENTS.md Mandatory Rules Compliance Checklist

| Rule Category | Requirement | Technical Implementation |
|---|---|---|
| **Date Timezone** | Must use `Asia/Jakarta` (WIB GMT+7). Never use server default. | Use `Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta' })` or helper `formatDateWIB` / `formatDateTimeWIB`. |
| **Date Separator** | Must use colon separator (`:`). NEVER slash (`/`) or hyphen (`-`). Format `DD:MM:YYYY`. | Custom helper formatting `parts` to `${day}:${month}:${year}` (e.g. `30:09:2026`). |
| **Time Format** | 24-Hour format `HH:mm`. | Use `hour: '2-digit', minute: '2-digit', hour12: false` with colon separator (e.g. `14:30`). |
| **Currency Display** | Dot separator for thousands (e.g. `1.000`). Indonesian Rupiah standard. | `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val)` or `formatRp()`. |
| **Currency Form Input** | Real-time auto-formatting with dot separators as user types. Raw value to DB must be clean integer. | `const raw = e.target.value.replace(/\D/g, ''); num = parseInt(raw, 10); display = num.toLocaleString('id-ID');` |
| **Auth & Redirects** | Full session validation against database before redirects. Prevent infinite 307 redirect loops. | On login & dashboard pages, validate session payload via `getGuruDashboardData()` / `auth.api.getSession()`. |
| **Tablecn Standard** | All admin data tables must use `@tanstack/react-table` (Tablecn by sadmann7). | Use `<DataTable>` component from `@/components/ui/data-table/data-table` with standard header, pagination, and toolbar. |
| **Strict TypeScript** | No implicit `any`, no dead code / unused variables, `npx tsc --noEmit` must pass with 0 errors. | Verified current baseline: 0 errors. All interfaces and props must be strictly typed. |

---

## 7. UI/UX Pro Max & Anti-Slop Design Guidelines

1. **Design System & Hierarchy:**
   - **Background:** `bg-slate-50` clean canvas with subtle border containment (`border-slate-200`).
   - **Cards & Surfaces:** `bg-white rounded-2xl shadow-sm border border-slate-200/80`.
   - **Brand Primary Accent:** Emerald (`bg-emerald-600 hover:bg-emerald-700 text-white`, `bg-emerald-50 text-emerald-700` for badges/pills).
   - **Semantic Accents:**
     - Rose for destructive actions and "Alpa" status.
     - Amber for warnings and "Belum Lunas" status.
     - Indigo/Blue for batch actions and general highlights.
2. **Anti-Slop Cleanliness:**
   - No unnecessary multi-layer cards or artificial gradient borders.
   - Clean spacing following strict 8px rhythm (`gap-4`, `p-6`, `space-y-6`).
   - High data density with comfortable row heights (`px-4 py-3`).
   - Meaningful empty states ("Belum ada santri privat terdaftar", "Tidak ada tagihan untuk periode ini").
   - Explicit loading skeletons via `DataTableSkeleton` matching column schema.
3. **Accessibility & Responsive Ergonomics:**
   - Contrast ratio compliant badges with dark text on light tint backgrounds (`text-emerald-700 bg-emerald-100`).
   - Mobile-first responsiveness: tables wrapped in `overflow-x-auto`, action buttons stacked on small screens and inline on desktop (`flex-col md:flex-row`).
   - Clear focus rings for keyboard navigation (`focus:ring-2 focus:ring-emerald-500`).

---

## 8. Summary of Files to be Created in Implementation Phase

```
src/
├── app/
│   ├── admin/
│   │   ├── santri-privat/
│   │   │   ├── page.tsx                  (Server Component)
│   │   │   ├── SantriPrivatClient.tsx    (Client Component with Tablecn & Form Dialog)
│   │   │   ├── columns.tsx               (ColumnDef definitions)
│   │   │   └── actions.ts                (Server Actions: CRUD santri_privat)
│   │   └── keuangan/
│   │       └── privat/
│   │           ├── page.tsx              (Server Component)
│   │           ├── KeuanganPrivatClient.tsx (Client Component: Metrics, Filter, Tablecn)
│   │           ├── columns.tsx           (ColumnDef definitions)
│   │           └── actions.ts            (Server Actions: Generate & update tagihan)
│   └── portal-guru/
│       └── absensi-privat/
│           ├── page.tsx                  (Server Component with teacher session check)
│           ├── AbsensiPrivatGuruClient.tsx (Client Component: Form + Riwayat Tablecn)
│           ├── columns.tsx               (ColumnDef definitions)
│           └── actions.ts                (Server Actions: Log absensi_privat)
└── components/
    └── Sidebar.tsx                       (Update navigation entries for Santri Privat & Tagihan Privat)
```

This completes the UI Architecture, Tablecn, and Route Survey. The project is fully prepared for the implementation plan.

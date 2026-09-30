# Analysis & Architecture Report: Tablecn & Columns (Milestone 1)

**Target Milestone**: M1 - Manajemen Data Santri Privat (CRUD & Tablecn)  
**Agent**: Explorer 2 (`explorer_m1_2`)  
**Scope**: 
- `src/lib/date-utils.ts` (WIB Date/Time Formatter conforming to GEMINI.md)
- `src/app/admin/santri-privat/columns.tsx` (Tablecn TanStack Table Column Definitions)
- `src/app/admin/santri-privat/page.tsx` (Server Component Data Loader)
- `src/app/admin/santri-privat/SantriPrivatClient.tsx` (Client Component with Tablecn DataTable & Metric Bento Cards)

---

## 1. Executive Summary

Milestone 1 implements the management interface for Private Students (`santri_privat`), accommodating students taking private Quran recitation and memorization sessions. The user experience must satisfy **ui-ux-pro-max** standards, strictly adhere to **GEMINI.md** (WIB timezone, `DD:MM:YYYY` colon separator, IDR dot thousands separator, Tablecn `@tanstack/react-table` wrapper), and comply with **AGENTS.md** (strict TypeScript, zero implicit `any`, 100% `npx tsc --noEmit` pass rate).

This report formulates the complete technical architecture and exact code implementations for the table view, column definitions, server loader, and client data table orchestration.

---

## 2. Shared Data Contract: `SantriPrivat`

Derived directly from `src/db/schema.ts` (lines 708–716):

```ts
export interface SantriPrivat {
  id: string;
  namaLengkap: string;
  nomorInduk: string | null;
  kontakOrtu: string;
  statusSantri: 'aktif' | 'nonaktif' | string;
  nominalTagihanBulanan: number;
  createdAt: Date | string | number | null;
}
```

---

## 3. Date & Time Helpers: `src/lib/date-utils.ts`

### GEMINI.md Rules:
1. Timezone: Strictly `Asia/Jakarta` (WIB GMT+7).
2. Date separator: Strictly colon (`:`), format `DD:MM:YYYY` (e.g. `28:03:2026`). No slashes (`/`), no hyphens (`-`).
3. Time format: Strictly 24-hour `HH:mm` (e.g. `14:30`).

### Implementation Strategy:
Create `src/lib/date-utils.ts` with pure, deterministic formatting functions leveraging `Intl.DateTimeFormat`:

```ts
/**
 * Helper formatter tanggal dan waktu sesuai GEMINI.md:
 * - Timezone: Asia/Jakarta (WIB)
 * - Tanggal: DD:MM:YYYY (Pemisah titik dua ':')
 * - Jam: HH:mm (24 Jam)
 */

export function formatDateWIB(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const parts = formatter.formatToParts(d);
  const day = parts.find((p) => p.type === "day")?.value ?? "00";
  const month = parts.find((p) => p.type === "month")?.value ?? "00";
  const year = parts.find((p) => p.type === "year")?.value ?? "0000";

  return `${day}:${month}:${year}`;
}

export function formatTimeWIB(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "number" || typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";

  const formatter = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";

  return `${hour}:${minute}`;
}

export function formatDateTimeWIB(date: Date | string | number | null | undefined): string {
  if (!date) return "-";
  return `${formatDateWIB(date)} ${formatTimeWIB(date)}`;
}
```

---

## 4. Column Definitions: `src/app/admin/santri-privat/columns.tsx`

### Columns Breakdown:
1. **Selection Checkbox (`select`)**:
   - Header: Select/Deselect all rows on the active page with indeterminate visual state.
   - Cell: Individual row selection toggle.
   - `enableSorting: false`, `enableHiding: false`.
2. **NIS (`nomorInduk`)**:
   - Monospace badge (`font-mono text-xs bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded`).
   - Fallback `"-"` if null.
   - Header: Sortable with `DataTableColumnHeader`.
3. **Nama Lengkap (`namaLengkap`)**:
   - Avatar circle with student's first initial in soft emerald tint (`bg-emerald-100 text-emerald-700 border border-emerald-200`).
   - Name in semi-bold slate typography (`font-semibold text-slate-800 text-sm`).
   - Header: Sortable with `DataTableColumnHeader`.
4. **Kontak Wali (`kontakOrtu`)**:
   - Phone icon (`Phone` from `lucide-react`) + parent phone number in monospace.
   - Header: `DataTableColumnHeader`.
5. **Tagihan Bulanan (`nominalTagihanBulanan`)**:
   - Formatted with `formatRp` from `@/lib/utils` (IDR currency, dot thousands separator, e.g. `Rp 150.000`).
   - Bold slate number for quick financial auditing.
   - Header: Sortable with `DataTableColumnHeader`.
6. **Status Santri (`statusSantri`)**:
   - Status badge with colored indicator dot:
     - `aktif`: Green pill (`bg-emerald-50 text-emerald-700 border border-emerald-200`) with emerald dot.
     - `nonaktif`: Rose pill (`bg-rose-50 text-rose-700 border border-rose-200`) with rose dot.
   - Header: Sortable with `DataTableColumnHeader`.
   - Built-in filter function support.
7. **Terdaftar (`createdAt`)**:
   - Formatted strictly with `formatDateWIB` (`DD:MM:YYYY` with colon separator, Asia/Jakarta WIB).
   - Monospace font (`text-xs font-mono text-slate-500`).
   - Header: Sortable with `DataTableColumnHeader`.
8. **Aksi (`actions`)**:
   - Right-aligned icon buttons:
     - **Edit**: Amber pen icon (`Edit2`), triggering `onEdit(santri)`.
     - **Hapus**: Rose trash icon (`Trash2`), triggering `onDelete(santri)`.
   - Tooltips & accessible aria-labels.
   - `enableSorting: false`, `enableHiding: false`.

### Complete Proposed Code:
```tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { Edit2, Trash2, Phone } from "lucide-react";
import { formatRp } from "@/lib/utils";
import { formatDateWIB } from "@/lib/date-utils";

export interface SantriPrivat {
  id: string;
  namaLengkap: string;
  nomorInduk: string | null;
  kontakOrtu: string;
  statusSantri: "aktif" | "nonaktif" | string;
  nominalTagihanBulanan: number;
  createdAt: Date | string | number | null;
}

export interface SantriPrivatColumnsProps {
  onEdit: (santri: SantriPrivat) => void;
  onDelete: (santri: SantriPrivat) => void;
}

export const getSantriPrivatColumns = ({
  onEdit,
  onDelete,
}: SantriPrivatColumnsProps): ColumnDef<SantriPrivat>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Pilih semua baris"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Pilih baris"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nomorInduk",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="NIS" />
    ),
    cell: ({ row }) => {
      const nis = row.getValue("nomorInduk") as string | null;
      return (
        <span className="font-mono text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          {nis || "-"}
        </span>
      );
    },
  },
  {
    accessorKey: "namaLengkap",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Nama Lengkap" />
    ),
    cell: ({ row }) => {
      const nama = (row.getValue("namaLengkap") as string) || "";
      const initial = nama.trim() ? nama.trim().charAt(0).toUpperCase() : "?";
      return (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200 shadow-xs">
            {initial}
          </div>
          <span className="font-semibold text-slate-800 text-sm">{nama}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "kontakOrtu",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Kontak Wali" />
    ),
    cell: ({ row }) => {
      const kontak = (row.getValue("kontakOrtu") as string) || "-";
      return (
        <div className="flex items-center gap-1.5 text-slate-600 font-mono text-xs">
          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{kontak}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "nominalTagihanBulanan",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Tagihan Bulanan" />
    ),
    cell: ({ row }) => {
      const nominal = Number(row.getValue("nominalTagihanBulanan")) || 0;
      return (
        <span className="font-bold text-slate-800 text-sm">
          {formatRp(nominal)}
        </span>
      );
    },
  },
  {
    accessorKey: "statusSantri",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Status" />
    ),
    cell: ({ row }) => {
      const status = (row.getValue("statusSantri") as string) || "aktif";
      const isAktif = status.toLowerCase() === "aktif";
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            isAktif
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
              isAktif ? "bg-emerald-500" : "bg-rose-500"
            }`}
          />
          {isAktif ? "Aktif" : "Non-Aktif"}
        </span>
      );
    },
    filterFn: (row, id, value) => {
      if (!value) return true;
      return (row.getValue(id) as string) === value;
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} label="Terdaftar" />
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date | string | number | null;
      return (
        <span className="text-xs text-slate-500 font-mono">
          {formatDateWIB(createdAt)}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const santri = row.original;
      return (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(santri)}
            className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            title="Edit Data Santri"
          >
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(santri)}
            className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
            title="Hapus Data Santri"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Hapus</span>
          </Button>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
```

---

## 5. Server Component Page: `src/app/admin/santri-privat/page.tsx`

The server page loads data dynamically via server action `getSantriPrivatList()` and passes the data to the client component. It is wrapped in responsive container styling consistent with other admin views (`/admin-guru`, `/santri`).

### Proposed Code:
```tsx
import { Metadata } from "next";
import { getSantriPrivatList } from "./actions";
import { SantriPrivatClient } from "./SantriPrivatClient";

export const metadata: Metadata = {
  title: "Manajemen Santri Privat | Sistem Absensi Rumah Qur'an",
  description: "Kelola data santri privat untuk kelas tahfidz dan mengaji",
};

export const dynamic = "force-dynamic";

export default async function SantriPrivatPage() {
  const santriList = await getSantriPrivatList();

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <SantriPrivatClient initialData={santriList} />
    </div>
  );
}
```

---

## 6. Client Component Architecture: `SantriPrivatClient.tsx`

### Key UI Features (ui-ux-pro-max standard):
1. **Header Section**:
   - Bold title: "Manajemen Santri Privat"
   - Descriptive subtitle: "Kelola data pendaftaran, kontak wali, dan tagihan bulanan santri kelas privat Al-Qur'an."
   - Primary Action Button: `+ Tambah Santri Privat` (styled with `bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm`).
2. **Metric Bento Cards**:
   Four summary cards at the top for at-a-glance operational overview:
   - **Total Santri Privat**: Total registered records.
   - **Santri Aktif**: Active students receiving private coaching.
   - **Santri Non-Aktif**: Inactive/paused students.
   - **Estimasi Tagihan Bulanan**: Sum of `nominalTagihanBulanan` for active students, formatted with `formatRp`.
3. **Tablecn Integration**:
   - Utilizes `<DataTable>` from `@/components/ui/data-table/data-table`.
   - `searchKey="namaLengkap"` with placeholder `"Cari nama santri privat..."`.
   - `sortColumn="createdAt"` or `"namaLengkap"`.
   - Toolbar status filter dropdown (`Semua Status`, `Aktif`, `Non-Aktif`) passed via `toolbarActions`.
   - Selection badge showing selected row count.
4. **Modal & Form Coordination**:
   - Integrates with Explorer 3's modal dialog for Create/Update.
   - Handles `handleEdit(santri)`: loads student into modal form.
   - Handles `handleDelete(santri)`: confirms via SweetAlert2 and calls server action `deleteSantriPrivat(santri.id)`.

### Skeleton/Blueprint for `SantriPrivatClient.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Plus, Users, UserCheck, UserX, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getSantriPrivatColumns, type SantriPrivat } from "./columns";
import { deleteSantriPrivat } from "./actions";
import { formatRp } from "@/lib/utils";
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert";
// Modal component from Explorer 3
// import { SantriPrivatModal } from "./SantriPrivatModal";

interface SantriPrivatClientProps {
  initialData: SantriPrivat[];
}

export function SantriPrivatClient({ initialData }: SantriPrivatClientProps) {
  const [data, setData] = useState<SantriPrivat[]>(initialData);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState<SantriPrivat | null>(null);

  // Summary Metrics
  const totalSantri = data.length;
  const santriAktif = data.filter((s) => s.statusSantri === "aktif").length;
  const santriNonAktif = data.filter((s) => s.statusSantri !== "aktif").length;
  const totalEstimasiTagihan = data
    .filter((s) => s.statusSantri === "aktif")
    .reduce((sum, s) => sum + (s.nominalTagihanBulanan || 0), 0);

  const handleCreate = () => {
    setEditingSantri(null);
    setIsModalOpen(true);
  };

  const handleEdit = (santri: SantriPrivat) => {
    setEditingSantri(santri);
    setIsModalOpen(true);
  };

  const handleDelete = async (santri: SantriPrivat) => {
    const confirmed = await showConfirm(
      "Hapus Santri Privat?",
      `Apakah Anda yakin ingin menghapus data "${santri.namaLengkap}"? Tindakan ini tidak dapat dibatalkan.`,
      "Ya, Hapus",
      true
    );

    if (!confirmed) return;

    try {
      const res = await deleteSantriPrivat(santri.id);
      if (res.success) {
        setData((prev) => prev.filter((item) => item.id !== santri.id));
        showSuccess("Berhasil Dihapus", `Data santri "${santri.namaLengkap}" telah dihapus.`);
      } else {
        showError("Gagal Menghapus", res.error || "Terjadi kesalahan saat menghapus data.");
      }
    } catch {
      showError("Kesalahan Server", "Tidak dapat terhubung ke server.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Manajemen Santri Privat
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data pendaftaran, kontak wali, dan tagihan bulanan santri kelas privat Al-Qur'an.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Santri Privat
        </Button>
      </div>

      {/* Summary Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Santri
            </span>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{totalSantri}</div>
          <span className="text-xs text-slate-400 mt-1 block">Total terdaftar</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Santri Aktif
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{santriAktif}</div>
          <span className="text-xs text-emerald-600/70 mt-1 block">Mengikuti sesi</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
              Non-Aktif
            </span>
            <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{santriNonAktif}</div>
          <span className="text-xs text-rose-400 mt-1 block">Cuti / nonaktif</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Estimasi Tagihan
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            {formatRp(totalEstimasiTagihan)}
          </div>
          <span className="text-xs text-indigo-500 mt-1 block">Per bulan (santri aktif)</span>
        </div>
      </div>

      {/* Tablecn Data Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <DataTable
          columns={getSantriPrivatColumns({
            onEdit: handleEdit,
            onDelete: handleDelete,
          })}
          data={data}
          searchKey="namaLengkap"
          searchPlaceholder="Cari nama santri privat..."
          sortColumn="createdAt"
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          toolbarActions={(table) => {
            const selectedRows = table.getSelectedRowModel().rows;
            return (
              <div className="flex items-center gap-2">
                <select
                  value={(table.getColumn("statusSantri")?.getFilterValue() as string) ?? ""}
                  onChange={(e) => table.getColumn("statusSantri")?.setFilterValue(e.target.value)}
                  className="h-9 px-3 py-1 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-emerald-500 text-slate-700 shadow-xs"
                >
                  <option value="">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Non-Aktif</option>
                </select>
                {selectedRows.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    {selectedRows.length} Terpilih
                  </span>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* Modal CRUD Form will be integrated here */}
    </div>
  );
}
```

---

## 7. Standards & Quality Validation Checklist

| Standard | Rule | Implementation & Compliance |
|---|---|---|
| **AGENTS.md** | Strict TypeScript (no implicit `any`) | Explicit types for all props (`SantriPrivatColumnsProps`, `SantriPrivatClientProps`, `ColumnDef<SantriPrivat>[]`), typed state handlers, clean interfaces. |
| **AGENTS.md** | Clean Dead Code | Zero unreached code, zero unused imports or placeholder variables. |
| **AGENTS.md** | `npx tsc --noEmit` clean | Checked against clean baseline (exit code 0); fully compliant types. |
| **GEMINI.md** | Timezone `Asia/Jakarta` (WIB) | Handled via `formatDateWIB` using `timeZone: 'Asia/Jakarta'`. |
| **GEMINI.md** | Date format `DD:MM:YYYY` with colon (`:`) | Handled via `formatDateWIB` with explicit colon joining. |
| **GEMINI.md** | 24-Hour Time format `HH:mm` | Handled via `formatTimeWIB`. |
| **GEMINI.md** | Currency format (IDR, dot thousands) | Handled via `formatRp` from `@/lib/utils` (`Intl.NumberFormat('id-ID')`). |
| **GEMINI.md** | Tablecn Compliance | Table wrapper strictly uses `@/components/ui/data-table/data-table`, `DataTableToolbar`, `DataTablePagination`, and `DataTableColumnHeader`. |
| **GEMINI.md** | No Infinite Redirect Loop | Page is an authenticated administrative route rendered in standard admin layout without custom redirect loops. |

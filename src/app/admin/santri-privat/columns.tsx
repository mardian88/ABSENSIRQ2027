"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";
import { Edit2, Trash2, Phone } from "lucide-react";
import { formatRp } from "@/lib/utils";
import { formatDateWIB } from "@/lib/date-utils";
import type { SantriPrivat } from "./actions";

export type { SantriPrivat };

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

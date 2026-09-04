"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PerizinanData } from "./actions";

export const getIzinColumns = (
  onOpenDetailModal: (izin: PerizinanData) => void
): ColumnDef<PerizinanData>[] => {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      header: "No",
      cell: ({ row }) => <span className="text-sm">{row.index + 1}</span>,
    },
    {
      id: "namaLengkap",
      accessorKey: "santri.namaLengkap",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent"
          >
            Nama Santri
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <div className="font-medium text-slate-900">{row.original.santri.namaLengkap}</div>,
    },
    {
      accessorKey: "santri.nomorInduk",
      header: "NIS",
      cell: ({ row }) => <div className="text-sm text-slate-600">{row.original.santri.nomorInduk || "-"}</div>,
    },
    {
      accessorKey: "kategori",
      header: "Kategori",
      cell: ({ row }) => {
        const kategori = row.getValue("kategori") as string;
        const colorClass = kategori === 'sakit' 
          ? 'bg-amber-100 text-amber-800 border-amber-200' 
          : 'bg-blue-100 text-blue-800 border-blue-200';
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border uppercase ${colorClass}`}>
            {kategori}
          </span>
        );
      },
    },
    {
      accessorKey: "waktuPengajuan",
      header: "Tanggal Pengajuan",
      cell: ({ row }) => {
        const date = new Date(row.original.waktuPengajuan);
        return <div className="text-sm text-slate-600">
          {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(date)}
        </div>;
      },
    },
    {
      id: "actions",
      header: "Aksi",
      cell: ({ row }) => {
        const izin = row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenDetailModal(izin)}
              className="p-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 rounded-lg transition-colors border border-transparent hover:border-emerald-200 shadow-sm"
              title="Lihat Detail & Bukti"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        );
      },
    }
  ];
};

"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlpaData } from "./actions";

export const getColumns = (): ColumnDef<AlpaData>[] => {
  return [
    {
      header: "No",
      cell: ({ row }) => <span className="text-sm">{row.index + 1}</span>,
    },
    {
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
      accessorKey: "waktuScan",
      header: "Tanggal Alpa",
      cell: ({ row }) => {
        const date = new Date(row.original.waktuScan);
        return <div className="text-sm text-slate-600">
          {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(date)}
        </div>;
      },
    },
    {
      accessorKey: "statusKehadiran",
      header: "Keterangan",
      cell: ({ row }) => {
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200 uppercase">
            Alpa
          </span>
        );
      },
    }
  ];
};

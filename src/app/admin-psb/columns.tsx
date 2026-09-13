import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import { formatDateID } from "@/lib/date";

export const getPsbColumns = ({
  handleDetail,
}: {
  handleDetail: (p: any) => void;
}): ColumnDef<any>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
    accessorKey: "tanggalDaftar",
    header: "Tanggal Daftar",
    cell: ({ row }) => formatDateID(row.getValue("tanggalDaftar") as string)
  },
  {
    accessorKey: "namaLengkap",
    header: "Nama Lengkap",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <span className="font-medium text-slate-800 flex items-center">
          {item.namaLengkap}
          {!item.isRead && <span className="ml-2 inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>}
        </span>
      );
    }
  },
  {
    id: "umur",
    header: "L/P - Umur",
    cell: ({ row }) => {
      const p = row.original;
      return (
        <span>
          {p.jenisKelamin?.substring(0,1)} - {p.tanggalLahir ? (new Date().getFullYear() - new Date(p.tanggalLahir).getFullYear()) : '?'} th
        </span>
      );
    }
  },
  {
    accessorKey: "kontakOrtu",
    header: "Kontak Ortu",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      if (status === 'menunggu') return (
        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
           <Clock className="w-3 h-3"/> Menunggu
        </span>
      );
      if (status === 'diterima') return (
        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
           <CheckCircle className="w-3 h-3"/> Diterima
        </span>
      );
      if (status === 'ditolak') return (
        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded-full">
           <XCircle className="w-3 h-3"/> Ditolak
        </span>
      );
      return null;
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const p = row.original;
      return (
        <div className="flex justify-end">
          <button 
            onClick={() => handleDetail(p)}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm inline-flex items-center gap-2"
          >
            <Eye className="w-4 h-4"/> Detail
          </button>
        </div>
      );
    }
  }
];

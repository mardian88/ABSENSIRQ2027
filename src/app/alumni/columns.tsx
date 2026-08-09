import { ColumnDef } from "@tanstack/react-table";
import { RefreshCw, Trash2 } from "lucide-react";

export const getAlumniColumns = ({
  handleAktifkan,
  handleDelete,
  isLoading
}: {
  handleAktifkan: (id: string) => void;
  handleDelete: (id: string) => void;
  isLoading: boolean;
}): ColumnDef<any>[] => [
  {
    accessorKey: "nomorInduk",
    header: "NIS",
  },
  {
    accessorKey: "namaLengkap",
    header: "Nama Lengkap",
    cell: ({ row }) => {
      const nama = row.getValue("namaLengkap") as string;
      return (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
            {nama.charAt(0)}
          </div>
          <span className="font-semibold text-slate-900">{nama}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "halaqoh",
    header: "Halaqoh Terakhir",
    cell: ({ row }) => {
      return <span>{row.getValue("halaqoh") || "-"}</span>;
    }
  },
  {
    accessorKey: "kontakOrtu",
    header: "Kontak Wali",
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <div className="flex items-center gap-2 justify-end">
          <button 
            onClick={() => handleAktifkan(id)}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Aktifkan Kembali Menjadi Santri"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(id)} 
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Hapus Permanen"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      );
    }
  }
];

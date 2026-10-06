import { ColumnDef } from "@tanstack/react-table";
import { RefreshCw, Trash2 } from "lucide-react";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

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
    header: ({ column }) => <DataTableColumnHeader column={column} label="NIS" />,
  },
  {
    accessorKey: "namaLengkap",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Nama Lengkap" />,
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
    header: ({ column }) => <DataTableColumnHeader column={column} label="Halaqoh Terakhir" />,
    cell: ({ row }) => {
      return <span>{row.getValue("halaqoh") || "-"}</span>;
    }
  },
  {
    accessorKey: "kontakOrtu",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Kontak Wali" />,
  },
  {
    accessorKey: "tanggalAktif",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Tanggal Aktif" />,
    cell: ({ row }) => {
      const tgl = row.getValue("tanggalAktif") as string;
      if (!tgl) return <span>-</span>;
      try {
        const [y, m, d] = tgl.split("-");
        if (y && m && d) return <span>{`${d}/${m}/${y}`}</span>;
        return <span>{tgl}</span>;
      } catch (e) {
        return <span>{tgl}</span>;
      }
    }
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

import { ColumnDef } from "@tanstack/react-table";
import { MessageSquare, CheckCircle2, Clock, Pencil, Trash2 } from "lucide-react";

export const getMutabaahRiwayatColumns = (
  onEdit: (item: any) => void,
  onDelete: (id: string) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "namaSantri",
    header: "SANTRI",
    cell: ({ row }) => (
      <div>
        <p className="font-bold text-slate-800">
          {row.original.namaSantri}
          {row.original.inputOleh === 'ortu' && (
            <span className="ml-2 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-100 text-amber-700 align-middle">Mandiri</span>
          )}
        </p>
        <p className="text-xs text-slate-500">
          {new Date(row.original.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    )
  },
  {
    accessorKey: "jenis",
    header: "JENIS",
    cell: ({ row }) => (
      <span className={`px-2 py-1 rounded-md text-[10px] font-bold capitalize ${row.original.jenis === 'mengaji' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
        {row.original.jenis}
      </span>
    )
  },
  {
    accessorKey: "capaian",
    header: "CAPAIAN",
    cell: ({ row }) => (
      <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-sm text-slate-700 max-w-[200px] truncate" title={row.original.capaian}>
        {row.original.capaian}
      </div>
    )
  },
  {
    accessorKey: "catatanGuru",
    header: "CATATAN GURU",
    cell: ({ row }) => (
      <div className="max-w-[200px]">
        {row.original.catatanGuru ? (
          <div className="flex items-start gap-1 text-xs text-blue-600 italic border-l-2 border-blue-300 pl-2 truncate" title={row.original.catatanGuru}>
            <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            "{row.original.catatanGuru}"
          </div>
        ) : (
          <span className="text-slate-400 text-xs italic">-</span>
        )}
      </div>
    )
  },
  {
    accessorKey: "isSeenByOrtu",
    header: "STATUS",
    cell: ({ row }) => (
      <div className="max-w-[150px]">
        <div className="flex items-center gap-2 mb-1">
          {row.original.isSeenByOrtu ? (
            <span className="text-emerald-600 text-xs flex items-center gap-1 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Telah dicek</span>
          ) : (
            <span className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Belum dicek</span>
          )}
        </div>
        {row.original.catatanOrtu && (
          <div className="text-xs text-slate-600 italic border-l-2 border-emerald-300 pl-2 truncate" title={row.original.catatanOrtu}>
            Ortu: "{row.original.catatanOrtu}"
          </div>
        )}
      </div>
    )
  },
  {
    id: "aksi",
    header: () => <div className="text-center">AKSI</div>,
    cell: ({ row }) => (
      <div className="flex justify-center gap-1">
        {!row.original.isSeenByOrtu ? (
          <>
            <button onClick={() => onEdit(row.original)} className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md" title="Edit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(row.original.id)} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md" title="Hapus">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-400 italic">Terkunci</span>
        )}
      </div>
    )
  }
];

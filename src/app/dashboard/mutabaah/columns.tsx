import { ColumnDef } from "@tanstack/react-table";
import { CheckCircle2, Clock, MessageSquare } from "lucide-react";

export const getMutabaahColumns = (): ColumnDef<any>[] => [
  {
    accessorKey: "tanggal",
    header: "TANGGAL",
    cell: ({ row }) => {
      const val = row.getValue("tanggal") as string;
      return <span className="font-medium text-slate-600">{new Date(val).toLocaleDateString('id-ID')}</span>;
    }
  },
  {
    accessorKey: "namaSantri",
    header: "SANTRI & HALAQAH",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div>
          <p className="font-bold text-slate-800">{item.namaSantri}</p>
          <p className="text-xs text-slate-500">{item.namaHalaqoh || 'Belum ada halaqah'}</p>
        </div>
      );
    }
  },
  {
    accessorKey: "jenis",
    header: "KATEGORI",
    cell: ({ row }) => {
      const jenis = row.getValue("jenis") as string;
      return (
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold capitalize ${jenis === 'mengaji' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
          {jenis}
        </span>
      );
    }
  },
  {
    accessorKey: "capaian",
    header: "CAPAIAN",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="max-w-[250px]" title={item.capaian}>
          <span className="text-slate-700 font-medium truncate block">{item.capaian}</span>
          {item.catatanGuru && (
            <div className="flex items-start gap-1 text-[10px] text-blue-600 mt-1 italic bg-blue-50 px-2 py-1 rounded">
              <MessageSquare className="w-3 h-3 mt-[1px] shrink-0" />
              <span className="truncate max-w-[200px]" title={item.catatanGuru}>{item.catatanGuru}</span>
            </div>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: "inputOleh",
    header: "INPUT OLEH",
    cell: ({ row }) => {
      const item = row.original;
      if (item.inputOleh === 'ortu') {
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">Wali Santri</span>;
      }
      return (
        <div>
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">Guru</span>
          <p className="text-[10px] text-slate-500 mt-1">{item.namaGuru}</p>
        </div>
      );
    }
  },
  {
    accessorKey: "isSeenByOrtu",
    header: () => <div className="text-center">STATUS ORTU</div>,
    cell: ({ row }) => {
      const item = row.original;
      if (item.isSeenByOrtu) {
        return (
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="inline-flex items-center justify-center bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Dilihat
            </div>
            {item.catatanOrtu && (
              <p className="text-[10px] text-slate-500 italic max-w-[150px] truncate" title={item.catatanOrtu}>
                "{item.catatanOrtu}"
              </p>
            )}
          </div>
        );
      }
      return (
        <div className="text-center">
          <div className="inline-flex items-center justify-center bg-slate-50 text-slate-400 px-2 py-1 rounded-full text-[10px] font-medium border border-slate-200">
            <Clock className="w-3 h-3 mr-1" /> Belum
          </div>
        </div>
      );
    }
  }
];

import { ColumnDef } from "@tanstack/react-table";
import { AlertTriangle, CheckCircle2, MessageSquare } from "lucide-react";

export const getProgressColumns = (): ColumnDef<any>[] => [
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
    id: "mengaji",
    header: "MENGAJI / BACAAN",
    cell: ({ row }) => {
      const item = row.original;
      if (item.mengaji) {
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={item.mengaji.capaian}>{item.mengaji.capaian}</span>
            <span className="text-[10px] text-slate-500 mt-1">
              {new Date(item.mengaji.waktuDibuat).toLocaleDateString('id-ID')} • oleh {item.mengaji.inputOleh === 'guru' ? item.mengaji.namaGuru : 'Ortu'}
            </span>
            {item.mengaji.catatanGuru && (
              <div className="mt-1 flex items-start gap-1 text-[10px] text-blue-600 italic bg-blue-50 px-2 py-1 rounded">
                <MessageSquare className="w-3 h-3 mt-[1px] shrink-0" />
                <span className="truncate max-w-[180px]" title={item.mengaji.catatanGuru}>{item.mengaji.catatanGuru}</span>
              </div>
            )}
          </div>
        );
      }
      return <span className="text-xs text-slate-400 italic">Belum ada catatan</span>;
    }
  },
  {
    id: "hafalan",
    header: "HAFALAN / TAHFIZH",
    cell: ({ row }) => {
      const item = row.original;
      if (item.hafalan) {
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={item.hafalan.capaian}>{item.hafalan.capaian}</span>
            <span className="text-[10px] text-slate-500 mt-1">
              {new Date(item.hafalan.waktuDibuat).toLocaleDateString('id-ID')} • oleh {item.hafalan.inputOleh === 'guru' ? item.hafalan.namaGuru : 'Ortu'}
            </span>
            {item.hafalan.catatanGuru && (
              <div className="mt-1 flex items-start gap-1 text-[10px] text-blue-600 italic bg-blue-50 px-2 py-1 rounded">
                <MessageSquare className="w-3 h-3 mt-[1px] shrink-0" />
                <span className="truncate max-w-[180px]" title={item.hafalan.catatanGuru}>{item.hafalan.catatanGuru}</span>
              </div>
            )}
          </div>
        );
      }
      return <span className="text-xs text-slate-400 italic">Belum ada catatan</span>;
    }
  },
  {
    id: "status",
    header: () => <div className="text-center">STATUS AKTIVITAS</div>,
    cell: ({ row }) => {
      const item = row.original;
      const isWarning = item.hariTanpaUpdate > 7;
      
      if (item.hariTanpaUpdate === -1) {
        return (
          <div className="text-center">
            <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold">KOSONG</span>
          </div>
        );
      }
      
      if (isWarning) {
        return (
          <div className="flex flex-col items-center">
            <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded-md text-[10px] font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Pasif
            </span>
            <span className="text-[10px] text-rose-500 mt-1">{item.hariTanpaUpdate} hari lalu</span>
          </div>
        );
      }
      
      return (
        <div className="flex flex-col items-center">
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Aktif
          </span>
          <span className="text-[10px] text-slate-500 mt-1">
            {item.hariTanpaUpdate === 0 ? 'Hari ini' : `${item.hariTanpaUpdate} hari lalu`}
          </span>
        </div>
      );
    }
  }
];

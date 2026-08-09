import { ColumnDef } from "@tanstack/react-table";
import { formatTimeID } from "@/lib/date";

export const getLiveFeedColumns = (): ColumnDef<any>[] => [
  {
    accessorKey: "namaSantri",
    header: "Nama Santri",
    cell: ({ row }) => (
      <span className="font-bold text-slate-800">
        {row.getValue("namaSantri") || 'Unknown'}
      </span>
    )
  },
  {
    accessorKey: "waktuScan",
    header: "Waktu Update",
    cell: ({ row }) => {
      const status = row.original.statusKehadiran;
      return (
        <span className="font-medium text-slate-600">
          {['hadir', 'terlambat', 'pulang_cepat'].includes(status) ? formatTimeID(row.getValue("waktuScan") as string) : '-'}
        </span>
      );
    }
  },
  {
    accessorKey: "statusKehadiran",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("statusKehadiran") as string;
      const statusClass = 
        status === 'hadir' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
        status === 'terlambat' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
        status === 'pulang_cepat' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
        status === 'izin' || status === 'sakit' ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' :
        'bg-rose-100 text-rose-700 border border-rose-200';
      
      return (
        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusClass}`}>
          {status.replace('_', ' ')}
        </span>
      );
    }
  },
  {
    accessorKey: "metodeScan",
    header: "Metode",
    cell: ({ row }) => {
      const val = row.getValue("metodeScan") as string;
      return (
        <span className="capitalize text-slate-600 font-medium">{val}</span>
      );
    }
  }
];

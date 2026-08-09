import { ColumnDef } from "@tanstack/react-table";
import { formatDateID, formatTimeID } from "@/lib/date";

export const getLaporanColumns = (): ColumnDef<any>[] => [
  {
    accessorKey: "waktuMasuk",
    header: "Tanggal",
    cell: ({ row }) => {
      const item = row.original;
      const dt = item.waktuMasuk || item.waktuPulang;
      return <div className="font-medium text-slate-900">{dt ? formatDateID(new Date(dt)) : item.tanggalWIB}</div>;
    }
  },
  {
    accessorKey: "person.namaLengkap",
    id: "namaLengkap", // For search and sort
    header: "Nama Lengkap",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div>
          <div className="font-bold text-slate-900">{item.person.namaLengkap}</div>
          <div className="text-xs text-slate-500">
            {item.kategori === 'Guru' ? 'NIP' : 'NIS'}: {item.person.nomorInduk} 
            {item.kategori === 'Santri' && ` • Halaqoh: ${item.person.halaqoh || '-'}`}
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "kategori",
    header: () => <div className="text-center">Kategori</div>,
    cell: ({ row }) => {
      const kategori = row.getValue("kategori") as string;
      return (
        <div className="text-center">
          <span className={`px-2 py-1 text-xs font-bold rounded-full ${kategori === 'Guru' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {kategori}
          </span>
        </div>
      );
    }
  },
  {
    id: "waktu",
    header: () => <div className="text-center">Masuk / Pulang</div>,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="text-center">
          <div className="font-mono text-sm text-slate-700 font-medium inline-block">
            {item.waktuMasuk ? formatTimeID(new Date(item.waktuMasuk)) : "-"} 
            <span className="text-slate-300 mx-2">/</span> 
            {item.waktuPulang ? formatTimeID(new Date(item.waktuPulang)) : "-"}
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "statusKehadiran",
    header: () => <div className="text-center">Status</div>,
    cell: ({ row }) => {
      const status = row.getValue("statusKehadiran") as string;
      return (
        <div className="text-center">
          <span className={`px-2 py-1 rounded text-xs font-bold uppercase
            ${status === 'hadir' ? 'bg-emerald-100 text-emerald-700' : 
              status === 'pulang' ? 'bg-amber-100 text-amber-700' :
              status === 'terlambat' ? 'bg-amber-100 text-amber-700' :
              status === 'pulang cepat' ? 'bg-orange-100 text-orange-700' :
              'bg-slate-100 text-slate-700'}`}>
            {status === 'terlambat' ? 'Telat' : status}
          </span>
        </div>
      );
    }
  }
];

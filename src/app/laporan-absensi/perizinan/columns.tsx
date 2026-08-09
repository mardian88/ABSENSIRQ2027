import { ColumnDef } from "@tanstack/react-table";
import { formatDateID } from "@/lib/date";
import { ExternalLink, ImageIcon, Edit } from "lucide-react";

export const getIzinColumns = (
  onOpenDetailModal: (item: any) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "santri.namaLengkap",
    id: "namaLengkap",
    header: "SANTRI",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="align-top">
          <div className="font-bold text-slate-800">{item.santri.namaLengkap}</div>
          <div className="text-xs text-slate-500 mt-0.5">NIS: {item.santri.nomorInduk}</div>
        </div>
      );
    }
  },
  {
    accessorKey: "waktuPengajuan",
    header: "WAKTU SUBMIT",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="align-top">
          <div className="text-sm font-semibold text-slate-700">
            {formatDateID(item.tanggalMulai)}
          </div>
          {item.tanggalSelesai > item.tanggalMulai && (
            <div className="text-xs text-slate-500 mt-0.5">
              s/d {formatDateID(item.tanggalSelesai)}
            </div>
          )}
        </div>
      );
    }
  },
  {
    id: "durasi",
    header: "RENTANG & DURASI",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="align-top text-center">
          <div className="font-medium text-slate-700">
            {Math.round((new Date(item.tanggalSelesai).getTime() - new Date(item.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24)) + 1}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Hari</div>
        </div>
      );
    }
  },
  {
    accessorKey: "keterangan",
    header: "KETERANGAN",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="align-top max-w-xs">
          <p className="text-sm text-slate-700 italic truncate" title={item.keterangan}>"{item.keterangan}"</p>
        </div>
      );
    }
  },
  {
    id: "bukti",
    header: "BUKTI",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="align-top">
          {item.buktiUrl ? (
            <button 
              onClick={() => onOpenDetailModal(item)}
              className="inline-flex items-center justify-center p-2 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors" 
              title="Lihat Bukti"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          ) : (
            <span 
              className="inline-flex items-center justify-center p-2 bg-slate-50 text-slate-400 rounded-md cursor-not-allowed"
              title="Tidak ada foto bukti dilampirkan"
            >
              <ImageIcon className="w-4 h-4" />
            </span>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: "kategori",
    header: () => <div className="text-center">KATEGORI</div>,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="text-center align-top">
          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
            item.kategori === 'Sakit' 
              ? 'bg-rose-100 text-rose-700' 
              : 'bg-amber-100 text-amber-700'
          }`}>
            {(item.kategori as string).toUpperCase()}
          </span>
        </div>
      );
    }
  }
];

export const getAlpaColumns = (
  onOpenEditModal: (id: string) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "santri.namaLengkap",
    id: "namaLengkap",
    header: "SANTRI",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="align-middle">
          <div className="font-bold text-slate-800">{item.santri.namaLengkap}</div>
          <div className="text-xs text-slate-500 mt-0.5">NIS: {item.santri.nomorInduk}</div>
        </div>
      );
    }
  },
  {
    accessorKey: "waktuScan",
    header: "TANGGAL ALPA",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="font-medium text-slate-900 align-middle">
          {formatDateID(item.waktuScan)}
        </div>
      );
    }
  },
  {
    id: "jenis",
    header: () => <div className="text-center">JENIS</div>,
    cell: () => (
      <div className="text-center align-middle">
        <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700">
          ALPA
        </span>
      </div>
    )
  },
  {
    id: "aksi",
    header: () => <div className="text-right">AKSI</div>,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="text-right align-middle">
          <button
            onClick={() => onOpenEditModal(item.id)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Status
          </button>
        </div>
      );
    }
  }
];

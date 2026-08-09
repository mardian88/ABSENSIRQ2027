import { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, ImageIcon } from "lucide-react";

export const getIzinHariIniColumns = (
  onOpenBukti: (url: string) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "santri.namaLengkap",
    id: "namaLengkap",
    header: "SANTRI",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="align-middle">
          <p className="font-bold text-slate-800">{item.santri.namaLengkap}</p>
          <p className="text-xs text-slate-500 mt-0.5">NIS: {item.santri.nomorInduk}</p>
        </div>
      );
    }
  },
  {
    accessorKey: "halaqoh.namaHalaqoh",
    header: "HALAQAH",
    cell: ({ row }) => (
      <span className="text-slate-600 align-middle">{row.original.halaqoh.namaHalaqoh}</span>
    )
  },
  {
    accessorKey: "kategori",
    header: "KATEGORI",
    cell: ({ row }) => (
      <div className="align-middle">
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
          row.original.kategori === 'Sakit' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {(row.original.kategori as string).toUpperCase()}
        </span>
      </div>
    )
  },
  {
    accessorKey: "keterangan",
    header: "KETERANGAN",
    cell: ({ row }) => (
      <div className="align-middle max-w-[200px] truncate" title={row.original.keterangan}>
        <p className="text-slate-600 italic truncate text-xs">"{row.original.keterangan}"</p>
      </div>
    )
  },
  {
    id: "bukti",
    header: () => <div className="text-center">BUKTI</div>,
    cell: ({ row }) => (
      <div className="text-center align-middle">
        {row.original.buktiUrl ? (
          <button 
            onClick={() => onOpenBukti(row.original.buktiUrl!)}
            className="inline-flex items-center justify-center p-1.5 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors"
            title="Lihat Bukti"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="inline-flex items-center justify-center p-1.5 bg-slate-50 text-slate-400 rounded-md cursor-not-allowed">
            <ImageIcon className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    )
  }
];

export const getBelumHadirHariIniColumns = (): ColumnDef<any>[] => [
  {
    id: "no",
    header: () => <div className="text-center w-12">NO</div>,
    cell: ({ row }) => (
      <div className="text-center font-medium text-slate-500">
        {row.index + 1}
      </div>
    )
  },
  {
    accessorKey: "namaLengkap",
    id: "namaLengkap",
    header: "SANTRI",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="align-middle">
          <p className="font-bold text-slate-800">{item.namaLengkap}</p>
          <p className="text-xs text-slate-500 mt-0.5">NIS: {item.nomorInduk}</p>
        </div>
      );
    }
  },
  {
    accessorKey: "halaqoh",
    header: "HALAQAH",
    cell: ({ row }) => (
      <span className="text-slate-600 align-middle">{row.original.halaqoh || "-"}</span>
    )
  }
];

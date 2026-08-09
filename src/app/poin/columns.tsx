import { ColumnDef } from "@tanstack/react-table";
import { Medal, AlertOctagon } from "lucide-react";
import Link from "next/link";

export type RekapPoin = {
  santri: {
    id: string;
    namaLengkap: string;
    nomorInduk: string;
  };
  totalPoin: number;
  totalReward: number;
  totalPunishment: number;
  jumlahRiwayat: number;
};

export const getPoinColumns = (
  activeTab: "prestasi" | "bermasalah"
): ColumnDef<RekapPoin>[] => [
  {
    id: "no",
    header: "No",
    cell: ({ row, table }) => {
      const sortedIndex = table.getSortedRowModel().rows.findIndex(r => r.id === row.id);
      const actualIndex = sortedIndex + 1;
      
      const isTop3 = activeTab === "prestasi" && actualIndex <= 3;
      const isBottom3 = activeTab === "bermasalah" && actualIndex <= 3;

      return (
        <div className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${
          isTop3 ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm" :
          isBottom3 ? "bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-sm" :
          "bg-slate-100 text-slate-600"
        }`}>
          {actualIndex}
        </div>
      );
    }
  },
  {
    accessorKey: "santri.namaLengkap",
    id: "namaLengkap",
    header: "Nama Santri",
    cell: ({ row, table }) => {
      const item = row.original;
      const sortedIndex = table.getSortedRowModel().rows.findIndex(r => r.id === row.id);
      const actualIndex = sortedIndex + 1;
      
      const isTop3 = activeTab === "prestasi" && actualIndex <= 3;
      const isBottom3 = activeTab === "bermasalah" && actualIndex <= 3;

      return (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">{item.santri.namaLengkap}</span>
            {isTop3 && <Medal className="w-4 h-4 text-emerald-500" />}
            {isBottom3 && <AlertOctagon className="w-4 h-4 text-rose-500" />}
          </div>
          <div className="text-xs text-slate-500">NIS: {item.santri.nomorInduk}</div>
        </div>
      );
    }
  },
  {
    accessorKey: "jumlahRiwayat",
    header: () => <div className="text-center">Histori</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">{row.original.jumlahRiwayat}x</span>
      </div>
    )
  },
  {
    accessorKey: "totalReward",
    header: () => <div className="text-center text-emerald-600">+ Reward</div>,
    cell: ({ row }) => (
      <div className="text-center font-bold text-emerald-600">
        {row.original.totalReward > 0 ? `+${row.original.totalReward}` : '-'}
      </div>
    )
  },
  {
    accessorKey: "totalPunishment",
    header: () => <div className="text-center text-rose-600">- Punishment</div>,
    cell: ({ row }) => (
      <div className="text-center font-bold text-rose-600">
        {row.original.totalPunishment > 0 ? `-${row.original.totalPunishment}` : '-'}
      </div>
    )
  },
  {
    accessorKey: "totalPoin",
    header: () => <div className="text-center">Poin Akhir</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <span className={`text-lg font-black ${row.original.totalPoin >= 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {row.original.totalPoin}
        </span>
      </div>
    )
  },
  {
    id: "aksi",
    header: () => <div className="text-center">Aksi</div>,
    cell: ({ row }) => (
      <div className="text-center">
        <Link 
          href={`/poin/${row.original.santri.id}`}
          className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md font-medium text-xs hover:bg-slate-100 transition-colors shadow-sm"
        >
          Lihat / Input
        </Link>
      </div>
    )
  }
];

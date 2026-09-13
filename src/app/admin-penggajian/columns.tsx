import { ColumnDef } from "@tanstack/react-table";

export const penggajianColumns: ColumnDef<any>[] = [
  {
    accessorKey: "namaLengkap",
    header: "NIP / Nama Guru",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div>
          <p className="font-bold text-slate-800">{item.namaLengkap}</p>
          <p className="text-xs text-slate-500">{item.nip}</p>
        </div>
      );
    }
  },
  {
    accessorKey: "jabatan",
    header: "Jabatan & Kontrak",
    cell: ({ row }) => {
      const jabatan = row.getValue("jabatan") as string;
      return (
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${jabatan === '-' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
          {jabatan === '-' ? 'Tidak Ada Kontrak Aktif' : jabatan}
        </span>
      );
    }
  },
  {
    accessorKey: "totalHadir",
    header: () => <div className="text-center">Total Hadir</div>,
    cell: ({ row }) => {
      return (
        <div className="text-center">
          <span className="inline-block min-w-8 py-1 rounded bg-slate-100 font-bold text-slate-700">
            {row.getValue("totalHadir")}
          </span>
        </div>
      );
    }
  },
  {
    accessorKey: "satuanKafalah",
    header: () => <div className="text-right">Satuan Kafalah</div>,
    cell: ({ row }) => {
      const val = row.getValue("satuanKafalah") as number;
      return (
        <div className="text-right text-slate-600">
          Rp {val.toLocaleString('id-ID')}
        </div>
      );
    }
  },
  {
    accessorKey: "totalGaji",
    header: () => <div className="text-right">Total Gaji</div>,
    cell: ({ row }) => {
      const val = row.getValue("totalGaji") as number;
      return (
        <div className="text-right font-bold text-emerald-600">
          Rp {val.toLocaleString('id-ID')}
        </div>
      );
    }
  }
];

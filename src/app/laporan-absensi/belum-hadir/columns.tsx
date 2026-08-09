import { ColumnDef } from "@tanstack/react-table";

export const getBelumHadirColumns = (): ColumnDef<any>[] => [
  {
    id: "no",
    header: "No",
    cell: ({ row }) => <div className="text-sm text-slate-500 font-medium">{row.index + 1}</div>,
  },
  {
    accessorKey: "namaLengkap",
    header: "Nama Santri",
    cell: ({ row }) => <div className="text-sm font-bold text-slate-800">{row.getValue("namaLengkap")}</div>,
  },
  {
    accessorKey: "nomorInduk",
    header: "NIS",
    cell: ({ row }) => <div className="text-sm text-slate-500 font-medium">{row.getValue("nomorInduk")}</div>,
  },
  {
    accessorKey: "halaqoh",
    header: "Halaqoh",
    cell: ({ row }) => <div className="text-sm text-slate-600">{row.getValue("halaqoh") || "-"}</div>,
  },
  {
    accessorKey: "sesi",
    header: "Sesi",
    cell: ({ row }) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
        {(row.getValue("sesi") as string) || "-"}
      </span>
    ),
  }
];

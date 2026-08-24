import { ColumnDef } from "@tanstack/react-table";
import { MessageCircle } from "lucide-react";

export const getBelumHadirColumns = (handleKirimPesan: (idSantri: string, statusPesan: string | null) => void): ColumnDef<any>[] => [
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
  },
  {
    id: "aksi",
    header: "Aksi",
    cell: ({ row }) => {
      const statusPesan = row.original.statusPesan;
      
      let iconColor = "text-slate-300"; // default if not sent
      let tooltip = "Kirim Pesan WhatsApp (Belum dikirim)";
      
      if (statusPesan === "terkirim" || statusPesan === "sent" || statusPesan === "delivered") {
        iconColor = "text-blue-500";
        tooltip = "Sudah dikirim (Terkirim)";
      } else if (statusPesan === "terbaca" || statusPesan === "read") {
        iconColor = "text-green-500";
        tooltip = "Sudah dibaca";
      } else if (statusPesan === "pending") {
        iconColor = "text-slate-500";
        tooltip = "Pending";
      } else if (statusPesan === "gagal" || statusPesan === "failed" || statusPesan === "disconnect") {
        iconColor = "text-red-500";
        tooltip = "Gagal terkirim";
      }

      return (
        <button 
          onClick={() => handleKirimPesan(row.original.id, statusPesan)}
          title={tooltip}
          className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${iconColor}`}
        >
          <MessageCircle className="w-5 h-5" />
        </button>
      );
    }
  }
];

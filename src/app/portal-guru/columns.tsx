import { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, ImageIcon, MessageCircle } from "lucide-react";

export const getIzinHariIniColumns = (
  onOpenDetailModal: (item: any) => void
): ColumnDef<any>[] => [
  {
    accessorKey: "santri.namaLengkap",
    id: "namaLengkap",
    header: "SANTRI",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div 
          className="align-middle cursor-pointer group"
          onClick={() => onOpenDetailModal(item)}
          title="Lihat detail izin"
        >
          <p className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{item.santri.namaLengkap}</p>
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
          row.original.kategori === 'Sakit' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {(row.original.kategori as string).toUpperCase()}
        </span>
      </div>
    )
  },
  {
    accessorKey: "keterangan",
    header: "KETERANGAN",
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div 
          className="align-middle max-w-[200px] cursor-pointer group" 
          onClick={() => onOpenDetailModal(item)}
        >
          <p className="text-slate-600 italic truncate text-xs group-hover:text-indigo-600 transition-colors" title="Lihat detail izin">"{item.keterangan}"</p>
        </div>
      );
    }
  },
  {
    id: "bukti",
    header: () => <div className="text-center">BUKTI</div>,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="text-center align-middle">
          {item.buktiUrl ? (
            <button 
              onClick={() => onOpenDetailModal(item)}
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
      );
    }
  }
];

export const getBelumHadirHariIniColumns = (handleKirimPesan: (idSantri: string, statusPesan: string | null) => void): ColumnDef<any>[] => [
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
    id: "aksi",
    header: "AKSI",
    cell: ({ row }) => {
      const statusPesan = row.original.statusPesan;
      
      let iconColor = "text-slate-300";
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
        <div className="flex justify-end pr-2">
          <button 
            onClick={() => handleKirimPesan(row.original.id, statusPesan)}
            title={tooltip}
            className={`p-2 rounded-full hover:bg-slate-100 transition-colors ${iconColor}`}
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      );
    }
  }
];

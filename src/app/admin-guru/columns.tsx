import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit, Camera, QrCode, Briefcase, Badge as BadgeIcon } from "lucide-react";
import { DataTableColumnHeader } from "@/components/ui/data-table/data-table-column-header";

export const getGuruColumns = ({
  handleDownloadQR,
  setFaceRegistrationGuru,
  setEditingData,
  setIsModalOpen,
  setKontrakGuru,
  handleCetakIdCard,
}: {
  handleDownloadQR: (guru: any) => void;
  setFaceRegistrationGuru: (guru: {id: string, namaLengkap: string}) => void;
  setEditingData: (guru: any) => void;
  setIsModalOpen: (open: boolean) => void;
  setKontrakGuru: (guru: any) => void;
  handleCetakIdCard: (guru: any) => void;
}): ColumnDef<any>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nip",
    header: ({ column }) => <DataTableColumnHeader column={column} label="NIP" />,
  },
  {
    accessorKey: "namaLengkap",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Nama Lengkap" />,
  },
  {
    accessorKey: "kontakWa",
    header: ({ column }) => <DataTableColumnHeader column={column} label="No. WA" />,
  },
  {
    accessorKey: "statusAktif",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Status" />,
    cell: ({ row }) => {
      const isActive = row.getValue("statusAktif") as boolean;
      return (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {isActive ? 'AKTIF' : 'NON-AKTIF'}
        </span>
      );
    }
  },
  {
    accessorKey: "tanggalAktif",
    header: ({ column }) => <DataTableColumnHeader column={column} label="Tanggal Aktif" />,
    cell: ({ row }) => {
      const tgl = row.getValue("tanggalAktif") as string;
      if (!tgl) return <span>-</span>;
      try {
        const [y, m, d] = tgl.split("-");
        if (y && m && d) return <span>{`${d}:${m}:${y}`}</span>;
        return <span>{tgl}</span>;
      } catch (e) {
        return <span>{tgl}</span>;
      }
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex items-center gap-2 justify-end">
          <button 
            onClick={() => handleCetakIdCard(item)} 
            className="text-slate-400 hover:text-emerald-600"
            title="Cetak ID Card"
          >
            <BadgeIcon className="w-4 h-4 inline" />
          </button>
          {/* Wajah registration disabled
          <button 
            onClick={() => setFaceRegistrationGuru({ id: item.id, namaLengkap: item.namaLengkap })}
            className={`text-slate-400 hover:text-blue-600`}
            title={item.hasFaceData ? "Wajah Sudah Terdaftar" : "Daftarkan Wajah"}
          >
            <Camera className={`w-4 h-4 inline ${item.hasFaceData ? 'text-blue-500' : ''}`} />
          </button>
          */}
          <button onClick={() => handleDownloadQR(item)} className="text-slate-400 hover:text-slate-700" title="Unduh QR Code">
            <QrCode className="w-4 h-4 inline" />
          </button>
          <button onClick={() => { setEditingData(item); setIsModalOpen(true); }} className="text-emerald-600 hover:text-emerald-800" title="Edit">
            <Edit className="w-4 h-4 inline" />
          </button>
          <button onClick={() => setKontrakGuru(item)} className="text-amber-600 hover:text-amber-800" title="Kelola Kontrak & Kafalah">
            <Briefcase className="w-4 h-4 inline" />
          </button>
        </div>
      );
    }
  }
];


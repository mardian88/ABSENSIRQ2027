import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Edit2, Trash2, Camera, QrCode, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const getSantriColumns = ({
  halaqohList,
  handleHalaqohChange,
  handleJadikanAlumni,
  downloadQR,
  setFaceRegistrationSantri,
  handleEdit,
  handleDelete,
}: {
  halaqohList: any[];
  handleHalaqohChange: (id: string, newIdHalaqoh: string) => void;
  handleJadikanAlumni: (id: string) => void;
  downloadQR: (qr: string, filename: string) => void;
  setFaceRegistrationSantri: (santri: {id: string, namaLengkap: string}) => void;
  handleEdit: (santri: any) => void;
  handleDelete: (id: string) => void;
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
    accessorKey: "nomorInduk",
    header: "NIS",
  },
  {
    accessorKey: "namaLengkap",
    header: "Nama Lengkap",
    cell: ({ row }) => {
      const nama = row.getValue("namaLengkap") as string;
      return (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
            {nama.charAt(0)}
          </div>
          {nama}
        </div>
      );
    },
  },
  {
    accessorKey: "idHalaqoh",
    header: "Halaqoh",
    cell: ({ row }) => {
      const id = row.original.id;
      const idHalaqoh = row.getValue("idHalaqoh") as string;
      return (
        <select
          value={idHalaqoh || ""}
          onChange={(e) => handleHalaqohChange(id, e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded px-2 py-1 focus:ring-emerald-500 focus:border-emerald-500"
        >
          <option value="">- Tidak Ada -</option>
          {halaqohList.map((h) => (
            <option key={h.id} value={h.id}>{h.namaHalaqoh}</option>
          ))}
        </select>
      );
    },
  },
  {
    accessorKey: "kontakOrtu",
    header: "Kontak Wali",
    cell: ({ row }) => {
      const kontak = row.getValue("kontakOrtu") as string;
      const qr = row.original.kodeQr;
      return (
        <div className="flex flex-col">
          <span>{kontak}</span>
          <span className="text-xs text-slate-400 font-mono mt-1">QR: {qr || "Belum Ada"}</span>
        </div>
      );
    }
  },
  {
    accessorKey: "statusSantri",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("statusSantri") as string;
      return (
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {status === 'aktif' ? 'Aktif' : 'Non-Aktif'}
        </span>
      );
    }
  },
  {
    id: "actions",
    header: () => <div className="text-right">Aksi</div>,
    cell: ({ row }) => {
      const s = row.original;
      return (
        <div className="flex items-center gap-1 justify-end">
          <button 
            onClick={() => handleJadikanAlumni(s.id)} 
            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Jadikan Alumni"
          >
            <GraduationCap className="w-4 h-4" />
          </button>
          <button 
            onClick={() => downloadQR(s.kodeQr || s.nomorInduk, `QR_${s.nomorInduk}_${s.namaLengkap.replace(/\s+/g, '_')}`)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Download QR"
          >
            <QrCode className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setFaceRegistrationSantri({ id: s.id, namaLengkap: s.namaLengkap })}
            className={`p-2 rounded-lg transition-colors ${s.hasFaceData ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
            title={s.hasFaceData ? "Wajah Sudah Terdaftar" : "Daftarkan Wajah"}
          >
            <Camera className="w-4 h-4" />
          </button>
          <button onClick={() => handleEdit(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => handleDelete(s.id)} 
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      );
    }
  }
];

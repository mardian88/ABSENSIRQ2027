"use client";

import { useState } from "react";
import { Plus, Search, Trash2, Edit, ChevronLeft, ChevronRight, UserCheck, Briefcase, Camera, QrCode } from "lucide-react";
import { addGuru, updateGuru, deleteGurus } from "./actions";
import { showError, showSuccess, showConfirm } from "@/lib/sweetalert";
import { RegisterWajahGuruModal } from "./RegisterWajahGuruModal";
import { KontrakGuruModal } from "./KontrakGuruModal";
import QRCode from "qrcode";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getGuruColumns } from "./columns";
import { DatePicker } from "@/components/ui/date-picker";

export function AdminGuruClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [rowSelection, setRowSelection] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [faceRegistrationGuru, setFaceRegistrationGuru] = useState<{id: string, namaLengkap: string} | null>(null);
  const [kontrakGuru, setKontrakGuru] = useState<any>(null);
  const [tanggalLahir, setTanggalLahir] = useState<Date | undefined>(undefined);

  const selectedIds = Object.keys(rowSelection)
    .filter(k => (rowSelection as any)[k])
    .map(k => data[parseInt(k)]?.id)
    .filter(Boolean);

  const handleDownloadQR = async (guru: any) => {
    try {
      // Format QR sama dengan santri lama: ambil dari nip atau kodeQr
      const qrText = guru.kodeQr || guru.nip;
      const dataUrl = await QRCode.toDataURL(qrText, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' }
      });
      const link = document.createElement('a');
      link.download = `QR-Guru-${guru.namaLengkap.replace(/\s+/g, '-')}-${guru.nip}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      showError("Gagal", "Gagal membuat QR Code");
    }
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await showConfirm("Hapus Data?", `Yakin ingin menghapus ${selectedIds.length} data guru? Data terkait (kontrak, absensi) juga bisa terhapus.`);
    if (confirmed) {
      const res = await deleteGurus(selectedIds);
      if (res.success) {
        showSuccess("Terhapus", "Data berhasil dihapus.");
        setData(prev => prev.filter(x => !selectedIds.includes(x.id)));
        setRowSelection({});
      } else {
        showError("Gagal", res.message || "Gagal menghapus data.");
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const payload: any = Object.fromEntries(formData.entries());
    
    // Konversi statusAktif ke boolean
    payload.statusAktif = payload.statusAktif === 'true';

    let res;
    if (editingData) {
      res = await updateGuru(editingData.id, payload);
      if (res.success) {
        showSuccess("Tersimpan", "Data berhasil diubah.");
        setData(prev => prev.map(x => x.id === editingData.id ? { ...x, ...payload } : x));
        setIsModalOpen(false);
      } else {
        showError("Gagal", res.message);
      }
    } else {
      res = await addGuru(payload);
      if (res.success) {
        showSuccess("Tersimpan", "Data guru baru berhasil ditambahkan.");
        // Karena ID baru ada di server, paling aman reload dari server, 
        // tapi untuk sementara kita reload halaman atau gunakan data dummy
        window.location.reload();
      } else {
        showError("Gagal", res.message);
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Data Pengurus / Guru</h1>
          <p className="text-slate-500 mt-1">Kelola data induk pengurus dan karyawan (HRIS).</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-lg font-medium transition-colors">
              <Trash2 className="w-4 h-4" />
              <span>Hapus ({selectedIds.length})</span>
            </button>
          )}
          <button 
            onClick={() => { setEditingData(null); setTanggalLahir(undefined); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      <DataTable sortColumn=nip
        columns={getGuruColumns({
          handleDownloadQR,
          setFaceRegistrationGuru,
          setEditingData: (data) => {
            setEditingData(data);
            setTanggalLahir(data?.tanggalLahir ? new Date(data.tanggalLahir) : undefined);
          },
          setIsModalOpen,
          setKontrakGuru,
        })}
        data={data}
        searchKey="namaLengkap"
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold">{editingData ? 'Edit Data' : 'Tambah Data'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">NIP / ID</label>
                <input type="text" name="nip" required defaultValue={editingData?.nip} className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nama Lengkap</label>
                <input type="text" name="namaLengkap" required defaultValue={editingData?.namaLengkap} className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nomor WA</label>
                <input type="text" name="kontakWa" required defaultValue={editingData?.kontakWa} className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tempat Lahir</label>
                  <input type="text" name="tempatLahir" defaultValue={editingData?.tempatLahir} className="w-full p-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Lahir</label>
                  <DatePicker name="tanggalLahir" date={tanggalLahir} setDate={setTanggalLahir} placeholder="DD/MM/YYYY" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alamat</label>
                <textarea name="alamat" rows={2} defaultValue={editingData?.alamat} className="w-full p-2 border border-slate-300 rounded-lg"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select name="statusAktif" defaultValue={editingData ? String(editingData.statusAktif) : "true"} className="w-full p-2 border border-slate-300 rounded-lg">
                  <option value="true">Aktif</option>
                  <option value="false">Non-Aktif</option>
                </select>
              </div>
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {faceRegistrationGuru && (
        <RegisterWajahGuruModal 
          isOpen={faceRegistrationGuru !== null}
          guru={faceRegistrationGuru}
          onClose={() => setFaceRegistrationGuru(null)}
        />
      )}

      {kontrakGuru && (
        <KontrakGuruModal 
          isOpen={kontrakGuru !== null}
          guru={kontrakGuru}
          onClose={() => setKontrakGuru(null)}
        />
      )}
    </div>
  );
}

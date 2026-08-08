"use client";

import { useState } from "react";
import { Plus, Search, Trash2, Edit, ChevronLeft, ChevronRight, UserCheck, Briefcase, Camera, QrCode } from "lucide-react";
import { addGuru, updateGuru, deleteGurus } from "./actions";
import { showError, showSuccess, showConfirm } from "@/lib/sweetalert";
import { RegisterWajahGuruModal } from "./RegisterWajahGuruModal";
import { KontrakGuruModal } from "./KontrakGuruModal";
import QRCode from "qrcode";

export function AdminGuruClient({ initialData }: { initialData: any[] }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [faceRegistrationGuru, setFaceRegistrationGuru] = useState<{id: string, namaLengkap: string} | null>(null);
  const [kontrakGuru, setKontrakGuru] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredData = data.filter(g => 
    g.namaLengkap.toLowerCase().includes(search.toLowerCase()) || 
    g.nip.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(paginatedData.map(d => d.id));
    else setSelectedIds([]);
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

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
        setSelectedIds([]);
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
            onClick={() => { setEditingData(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Data</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari NIP atau Nama..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-xs border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" onChange={handleSelectAll} checked={selectedIds.length > 0 && selectedIds.length === paginatedData.length} />
                </th>
                <th className="px-4 py-3">NIP</th>
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">No. WA</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.length > 0 ? paginatedData.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" checked={selectedIds.includes(item.id)} onChange={() => handleSelect(item.id)} />
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.nip}</td>
                  <td className="px-4 py-3">{item.namaLengkap}</td>
                  <td className="px-4 py-3">{item.kontakWa}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${item.statusAktif ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {item.statusAktif ? 'AKTIF' : 'NON-AKTIF'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button 
                      onClick={() => setFaceRegistrationGuru({ id: item.id, namaLengkap: item.namaLengkap })}
                      className={`text-slate-400 hover:text-blue-600 mr-2`}
                      title={item.hasFaceData ? "Wajah Sudah Terdaftar" : "Daftarkan Wajah"}
                    >
                      <Camera className={`w-4 h-4 inline ${item.hasFaceData ? 'text-blue-500' : ''}`} />
                    </button>
                    <button onClick={() => handleDownloadQR(item)} className="text-slate-400 hover:text-slate-700 mr-2" title="Unduh QR Code">
                      <QrCode className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => { setEditingData(item); setIsModalOpen(true); }} className="text-emerald-600 hover:text-emerald-800" title="Edit">
                      <Edit className="w-4 h-4 inline" />
                    </button>
                    <button onClick={() => setKontrakGuru(item)} className="text-amber-600 hover:text-amber-800 ml-2" title="Kelola Kontrak & Kafalah">
                      <Briefcase className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    Data tidak ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Halaman {currentPage} dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md border border-slate-300 disabled:opacity-50 hover:bg-slate-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

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
                  <input type="date" name="tanggalLahir" defaultValue={editingData?.tanggalLahir} className="w-full p-2 border border-slate-300 rounded-lg" />
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

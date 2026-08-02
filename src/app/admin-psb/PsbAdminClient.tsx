"use client";

import { useState } from "react";
import { UserPlus, CheckCircle, XCircle, Search, Clock, Eye, X } from "lucide-react";
import { showConfirm } from "@/lib/sweetalert";
import { terimaPendaftar, tolakPendaftar, markAsRead, deletePendaftar, resetPendaftar } from "./actions";
import { formatDateID } from "@/lib/date";

export function PsbAdminClient({ initialData }: { initialData: any[] }) {
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPendaftar, setSelectedPendaftar] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleTerima = async (id: string) => {
    const confirmed = await showConfirm("Terima pendaftar ini sebagai santri aktif?", "", "Ya, Terima", false);
    if (!confirmed) return;
    setIsProcessing(true);
    await terimaPendaftar(id);
    setIsProcessing(false);
    setSelectedPendaftar(null);
  };

  const handleTolak = async (id: string) => {
    const confirmed = await showConfirm("Tolak pendaftar ini?", "", "Ya, Tolak");
    if (!confirmed) return;
    setIsProcessing(true);
    await tolakPendaftar(id);
    setIsProcessing(false);
    setSelectedPendaftar(null);
  };

  const filtered = initialData.filter(d => 
    d.namaLengkap.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filtered.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDetail = async (p: any) => {
    setSelectedPendaftar(p);
    if (!p.isRead) {
      await markAsRead(p.id);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await showConfirm(`Hapus ${selectedIds.length} data terpilih?`, "Data tidak dapat dikembalikan.", "Ya, Hapus", false);
    if (!confirmed) return;
    setIsProcessing(true);
    await deletePendaftar(selectedIds);
    setSelectedIds([]);
    setIsProcessing(false);
  };

  const handleReset = async () => {
    const confirmed = await showConfirm("Reset semua data PSB?", "Semua data pendaftar akan dihapus secara permanen.", "Ya, Reset Semua", false);
    if (!confirmed) return;
    setIsProcessing(true);
    await resetPendaftar();
    setSelectedIds([]);
    setIsProcessing(false);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Daftar Calon Santri (PSB)</h2>
        <p className="text-slate-500 text-sm mt-1">Review dan setujui pendaftar masuk ke database utama.</p>
      </div>

      <div className="mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <input 
          type="text"
          placeholder="Cari nama pendaftar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
        />
        <div className="flex gap-2 w-full md:w-auto">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleDeleteSelected}
              disabled={isProcessing}
              className="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 font-semibold text-sm disabled:opacity-50"
            >
              Hapus Terpilih ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={handleReset}
            disabled={isProcessing || initialData.length === 0}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-semibold text-sm disabled:opacity-50"
          >
            Reset Data
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-y border-slate-200">
              <th className="p-4 w-10">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="p-4 font-semibold text-slate-700">Tanggal Daftar</th>
              <th className="p-4 font-semibold text-slate-700">Nama Lengkap</th>
              <th className="p-4 font-semibold text-slate-700">Usia/Gender</th>
              <th className="p-4 font-semibold text-slate-700">Kontak Ortu</th>
              <th className="p-4 font-semibold text-slate-700">Status</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400">
                  Belum ada pendaftar baru.
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} className={`hover:bg-slate-50 transition-colors ${!p.isRead ? 'bg-orange-50/30' : ''}`}>
                  <td className="p-4">
                    <input 
                      type="checkbox"
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      checked={selectedIds.includes(p.id)}
                      onChange={() => handleSelect(p.id)}
                    />
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {formatDateID(p.tanggalDaftar)}
                  </td>
                  <td className="p-4 font-medium text-slate-800">
                    {p.namaLengkap}
                    {!p.isRead && <span className="ml-2 inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>}
                  </td>
                  <td className="p-4 text-sm text-slate-600">
                    {p.jenisKelamin?.substring(0,1)} - {p.tanggalLahir ? (new Date().getFullYear() - new Date(p.tanggalLahir).getFullYear()) : '?'} th
                  </td>
                  <td className="p-4 text-slate-600">{p.kontakOrtu}</td>
                  <td className="p-4">
                    {p.status === 'menunggu' && (
                      <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full">
                         <Clock className="w-3 h-3"/> Menunggu
                      </span>
                    )}
                    {p.status === 'diterima' && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                         <CheckCircle className="w-3 h-3"/> Diterima
                      </span>
                    )}
                    {p.status === 'ditolak' && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded-full">
                         <XCircle className="w-3 h-3"/> Ditolak
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDetail(p)}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium text-sm inline-flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4"/> Detail
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail */}
      {selectedPendaftar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Detail Pendaftar</h3>
              <button onClick={() => setSelectedPendaftar(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Identitas Santri */}
              <div>
                <h4 className="font-bold text-emerald-700 border-b pb-2 mb-3">A. Identitas Calon Santri</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500 block">Nama Lengkap:</span> <span className="font-semibold">{selectedPendaftar.namaLengkap}</span></div>
                  <div><span className="text-slate-500 block">Tempat, Tgl Lahir:</span> <span className="font-semibold">{selectedPendaftar.tempatLahir}, {formatDateID(selectedPendaftar.tanggalLahir)}</span></div>
                  <div><span className="text-slate-500 block">Jenis Kelamin:</span> <span className="font-semibold">{selectedPendaftar.jenisKelamin}</span></div>
                  <div><span className="text-slate-500 block">Alamat Lengkap:</span> <span className="font-semibold">{selectedPendaftar.alamatLengkap}</span></div>
                  <div><span className="text-slate-500 block">Alamat Domisili:</span> <span className="font-semibold">{selectedPendaftar.isAlamatDomisiliSama ? '(Sama dengan KTP)' : selectedPendaftar.alamatDomisili}</span></div>
                </div>
              </div>

              {/* Pendidikan */}
              <div>
                <h4 className="font-bold text-emerald-700 border-b pb-2 mb-3">B. Pendidikan & Kegiatan</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500 block">Sekolah:</span> <span className="font-semibold">{selectedPendaftar.jenjangSekolah === 'Lainnya' ? selectedPendaftar.jenjangSekolahLainnya : selectedPendaftar.jenjangSekolah} - {selectedPendaftar.namaSekolah} (Kelas {selectedPendaftar.kelasSekolah})</span></div>
                  <div><span className="text-slate-500 block">Kegiatan Les:</span> <span className="font-semibold">{selectedPendaftar.ikutLes ? `Ya (${selectedPendaftar.hariLes} | ${selectedPendaftar.jamLesMulai} - ${selectedPendaftar.jamLesSelesai})` : 'Tidak'}</span></div>
                </div>
              </div>

              {/* Identitas Ortu */}
              <div>
                <h4 className="font-bold text-emerald-700 border-b pb-2 mb-3">C. Identitas Orang Tua</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500 block">Nama Ayah:</span> <span className="font-semibold">{selectedPendaftar.namaAyah}</span></div>
                  <div><span className="text-slate-500 block">Pekerjaan Ayah:</span> <span className="font-semibold">{selectedPendaftar.pekerjaanAyah === 'Lainnya' ? selectedPendaftar.pekerjaanAyahLainnya : selectedPendaftar.pekerjaanAyah} {selectedPendaftar.instansiAyah ? `(${selectedPendaftar.instansiAyah})` : ''}</span></div>
                  <div><span className="text-slate-500 block">Nama Ibu:</span> <span className="font-semibold">{selectedPendaftar.namaIbu}</span></div>
                  <div><span className="text-slate-500 block">Pekerjaan Ibu:</span> <span className="font-semibold">{selectedPendaftar.pekerjaanIbu === 'Lainnya' ? selectedPendaftar.pekerjaanIbuLainnya : selectedPendaftar.pekerjaanIbu} {selectedPendaftar.instansiIbu ? `(${selectedPendaftar.instansiIbu})` : ''}</span></div>
                  <div className="md:col-span-2">
                    <span className="text-slate-500 block">Kontak (WhatsApp):</span> 
                    <span className="font-bold text-emerald-600 text-base">{selectedPendaftar.kontakOrtu}</span>
                  </div>
                </div>
              </div>

              {/* Capaian */}
              <div>
                <h4 className="font-bold text-emerald-700 border-b pb-2 mb-3">D. Capaian</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div><span className="text-slate-500 block">Capaian Mengaji:</span> <span className="font-semibold">{selectedPendaftar.sudahMengaji ? `${selectedPendaftar.bukuMengaji} - ${selectedPendaftar.capaianMengaji}` : 'Belum'}</span></div>
                  <div><span className="text-slate-500 block">Capaian Hafalan:</span> <span className="font-semibold">{selectedPendaftar.sudahMenghafal ? selectedPendaftar.capaianHafalan : 'Belum'}</span></div>
                </div>
              </div>

              {/* Info */}
              <div>
                <h4 className="font-bold text-emerald-700 border-b pb-2 mb-3">E. Sumber Informasi</h4>
                <div className="text-sm">
                  <span className="font-semibold">{selectedPendaftar.sumberInfo}</span>
                </div>
              </div>

            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              {selectedPendaftar.status === 'menunggu' && (
                <>
                  <button 
                    onClick={() => handleTolak(selectedPendaftar.id)}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 font-bold disabled:opacity-50"
                  >
                    Tolak
                  </button>
                  <button 
                    onClick={() => handleTerima(selectedPendaftar.id)}
                    disabled={isProcessing}
                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-bold disabled:opacity-50"
                  >
                    Terima Pendaftar
                  </button>
                </>
              )}
              {selectedPendaftar.status !== 'menunggu' && (
                <button 
                  onClick={() => setSelectedPendaftar(null)}
                  className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-bold"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

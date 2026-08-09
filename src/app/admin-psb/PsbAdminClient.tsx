"use client";

import { useState } from "react";
import { UserPlus, CheckCircle, XCircle, Search, Clock, Eye, X } from "lucide-react";
import { showConfirm } from "@/lib/sweetalert";
import { terimaPendaftar, tolakPendaftar, markAsRead, deletePendaftar, resetPendaftar } from "./actions";
import { formatDateID } from "@/lib/date";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getPsbColumns } from "./columns";

export function PsbAdminClient({ initialData }: { initialData: any[] }) {
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPendaftar, setSelectedPendaftar] = useState<any>(null);
  const [rowSelection, setRowSelection] = useState({});

  const selectedIds = Object.keys(rowSelection)
    .filter(k => (rowSelection as any)[k])
    .map(k => initialData[parseInt(k)]?.id)
    .filter(Boolean);

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
    setRowSelection({});
    setIsProcessing(false);
  };

  const handleReset = async () => {
    const confirmed = await showConfirm("Reset semua data PSB?", "Semua data pendaftar akan dihapus secara permanen.", "Ya, Reset Semua", false);
    if (!confirmed) return;
    setIsProcessing(true);
    await resetPendaftar();
    setRowSelection({});
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

      <DataTable
        columns={getPsbColumns({ handleDetail })}
        data={initialData}
        searchKey="namaLengkap"
        rowSelection={rowSelection}
        onRowSelectionChange={setRowSelection}
      />

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

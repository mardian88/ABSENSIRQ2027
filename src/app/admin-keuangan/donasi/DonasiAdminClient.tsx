"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Edit, Trash2, CheckCircle, XCircle, Search, Archive, Heart, Clock, RotateCcw } from "lucide-react";
import { formatRp } from "@/lib/utils";
import { showConfirm, showSuccess, showError, showPrompt } from "@/lib/sweetalert";
import { useRouter } from "next/navigation";
import { tambahProgram, editProgram, hapusProgram, verifikasiDonasi, tolakDonasi, hapusTransaksiDonasi, resetProgramDonasi, uploadImageToCloudinaryDonasi } from "./actions";

export default function DonasiAdminClient({ initialPrograms, initialTransaksi }: { initialPrograms: any[], initialTransaksi: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'program' | 'verifikasi' | 'riwayat'>('program');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [programs, setPrograms] = useState(initialPrograms);
  const [transaksis, setTransaksis] = useState(initialTransaksi);

  useEffect(() => {
    setPrograms(initialPrograms);
    setTransaksis(initialTransaksi);
  }, [initialPrograms, initialTransaksi]);

  useEffect(() => {
    const saved = localStorage.getItem('donasi_admin_tab');
    if (saved === 'program' || saved === 'verifikasi' || saved === 'riwayat') {
      setActiveTab(saved);
    }
  }, []);

  const changeTab = (tab: 'program' | 'verifikasi' | 'riwayat') => {
    setActiveTab(tab);
    localStorage.setItem('donasi_admin_tab', tab);
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    judul: '',
    deskripsi: '',
    targetNominal: 0,
    isAktif: true,
    urlGambar: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setFormData({ id: '', judul: '', deskripsi: '', targetNominal: 0, isAktif: true, urlGambar: '' });
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (p: any) => {
    setFormData({
      id: p.id,
      judul: p.judul,
      deskripsi: p.deskripsi || '',
      targetNominal: p.targetNominal,
      isAktif: p.isAktif,
      urlGambar: p.urlGambar || ''
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleSaveProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.targetNominal <= 0) {
      showError("Gagal", "Target nominal harus lebih dari 0");
      return;
    }

    setLoading(true);
    try {
      let finalUrl = formData.urlGambar;
      if (imageFile) {
        const data = new FormData();
        data.append("file", imageFile);
        const uploadedUrl = await uploadImageToCloudinaryDonasi(data);
        if (uploadedUrl) finalUrl = uploadedUrl;
      }

      let res;
      if (formData.id) {
        res = await editProgram(formData.id, formData.judul, formData.deskripsi, formData.targetNominal, formData.isAktif, finalUrl);
      } else {
        res = await tambahProgram(formData.judul, formData.deskripsi, formData.targetNominal, finalUrl);
      }

      if (res.success) {
        await showSuccess("Berhasil", res.message);
        setIsModalOpen(false);
        router.refresh();
      } else {
        showError("Gagal", res.message);
      }
    } catch (err: any) {
      showError("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProgram = async (id: string) => {
    const pwd = await showPrompt("Hapus Program Permanen?", "password", "Hapus");
    if (pwd !== null) {
      if (pwd !== "rqm") {
        showError("Gagal", "Password salah!");
        return;
      }
      setLoading(true);
      const res = await hapusProgram(id);
      setLoading(false);
      if (res.success) {
        await showSuccess("Terhapus", res.message);
        router.refresh();
      } else {
        showError("Gagal", res.message);
      }
    }
  };

  const handleResetProgram = async (id: string) => {
    const pwd = await showPrompt("Reset nominal dan riwayat ke 0? Ini akan menghapus permanen data komentar & donatur untuk program ini.", "password", "Reset");
    if (pwd !== null) {
      if (pwd !== "rqm") {
        showError("Gagal", "Password salah!");
        return;
      }
      setLoading(true);
      const res = await resetProgramDonasi(id);
      setLoading(false);
      if (res.success) {
        await showSuccess("Berhasil Reset", res.message);
        router.refresh();
      } else {
        showError("Gagal", res.message);
      }
    }
  };

  const handleVerifikasi = async (id: string) => {
    if (await showConfirm("Verifikasi Wakaf?", "Tandai Wakaf ini sebagai selesai/terima uang?")) {
      setLoading(true);
      const res = await verifikasiDonasi(id);
      setLoading(false);
      if (res.success) {
        await showSuccess("Berhasil", res.message);
        router.refresh();
      } else {
        showError("Gagal", res.message);
      }
    }
  };

  const handleTolak = async (id: string) => {
    if (await showConfirm("Tolak Wakaf?", "Wakaf ini akan dibatalkan.")) {
      setLoading(true);
      const res = await tolakDonasi(id);
      setLoading(false);
      if (res.success) {
        await showSuccess("Berhasil", res.message);
        router.refresh();
      } else {
        showError("Gagal", res.message);
      }
    }
  };

  const handleDeleteTransaksi = async (t: any) => {
    const pwd = await showPrompt(`Hapus Wakaf Permanen dari ${t.isAnonim ? 'Hamba Allah' : t.namaSantri}?`, "password", "Hapus");
    if (pwd !== null) {
      if (pwd !== "rqm") {
        showError("Gagal", "Password salah!");
        return;
      }
      setLoading(true);
      const res = await hapusTransaksiDonasi(t.id);
      setLoading(false);
      if (res.success) {
        await showSuccess("Terhapus", res.message);
        router.refresh();
      } else {
        showError("Gagal", res.message);
      }
    }
  };

  const filteredPrograms = programs.filter(p => p.judul.toLowerCase().includes(searchQuery.toLowerCase()));
  const transaksisFiltered = transaksis.filter(t => 
    t.namaSantri?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.judulProgram?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const txMenunggu = transaksisFiltered.filter(t => t.status === 'menunggu');
  const txRiwayat = transaksisFiltered.filter(t => t.status !== 'menunggu');

  return (
    <div className="space-y-6">
      <div className="flex border-b border-slate-200">
        <button onClick={() => changeTab('program')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'program' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Program Wakaf
        </button>
        <button onClick={() => changeTab('verifikasi')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'verifikasi' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Verifikasi ({txMenunggu.length})
        </button>
        <button onClick={() => changeTab('riwayat')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'riwayat' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Riwayat
        </button>
      </div>

      {activeTab === 'program' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> Buat Program
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPrograms.map(item => (
              <div key={item.id} className={`p-4 border rounded-xl flex gap-4 bg-white ${!item.isAktif ? 'opacity-60' : ''}`}>
                <div className="w-20 h-20 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                  {item.urlGambar ? <img src={item.urlGambar} alt={item.judul} className="w-full h-full object-cover" /> : <Archive className="w-8 h-8 text-slate-400" />}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-slate-800 line-clamp-2">{item.judul}</h3>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => handleResetProgram(item.id)} className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg" title="Reset Donasi"><RotateCcw className="w-4 h-4" /></button>
                        <button onClick={() => handleEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteProgram(item.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.deskripsi}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-slate-500">Terkumpul</p>
                    <p className="font-bold text-emerald-600">{formatRp(item.terkumpul)} <span className="text-xs font-normal text-slate-400">/ {formatRp(item.targetNominal)}</span></p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(100, (item.terkumpul/item.targetNominal)*100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(activeTab === 'verifikasi' || activeTab === 'riwayat') && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="search"
              name="search_query_donasi"
              autoComplete="off"
              data-lpignore="true"
              data-1p-ignore="true"
              data-bwignore="true"
              placeholder="Cari santri atau program..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-emerald-500"
            />
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="p-4 py-3">Tanggal</th>
                  <th className="p-4 py-3">Santri/Anonim</th>
                  <th className="p-4 py-3">Program Wakaf</th>
                  <th className="p-4 py-3">Nominal & Doa</th>
                  <th className="p-4 py-3">Status</th>
                  <th className="p-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeTab === 'verifikasi' ? txMenunggu : txRiwayat).map(t => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-500">
                      {new Date(t.waktuDibuat).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-4">
                      {t.isAnonim ? (
                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">Hamba Allah</span>
                      ) : (
                        <>
                          <p className="font-bold text-slate-800">{t.namaSantri}</p>
                          <p className="text-xs text-slate-500">{t.nis}</p>
                        </>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-slate-700 max-w-[200px] line-clamp-2">{t.judulProgram}</p>
                      <p className="text-xs text-slate-500">Metode: {t.metode}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-emerald-600">{formatRp(t.nominal)}</p>
                      {t.doa && <p className="text-xs text-slate-500 mt-1 italic max-w-[200px]">"{t.doa}"</p>}
                    </td>
                    <td className="p-4">
                      {t.status === 'menunggu' && <span className="flex items-center gap-1 text-amber-600 text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Menunggu</span>}
                      {t.status === 'terverifikasi' && <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold"><CheckCircle className="w-3.5 h-3.5" /> Berhasil</span>}
                      {t.status === 'dibatalkan' && <span className="flex items-center gap-1 text-rose-600 text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> Dibatalkan</span>}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        {activeTab === 'verifikasi' && (
                          <>
                            <button onClick={() => handleVerifikasi(t.id)} disabled={loading} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50">Terima</button>
                            <button onClick={() => handleTolak(t.id)} disabled={loading} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-100 disabled:opacity-50">Tolak</button>
                          </>
                        )}
                        <button onClick={() => handleDeleteTransaksi(t)} disabled={loading} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50" title="Hapus Permanen">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(activeTab === 'verifikasi' ? txMenunggu : txRiwayat).length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 bg-slate-50/50">
                      Tidak ada data transaksi.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form Program */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{formData.id ? 'Edit Program Wakaf' : 'Tambah Program Wakaf'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveProgram} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Gambar Program</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                    {imageFile ? (
                      <img src={URL.createObjectURL(imageFile)} alt="Preview" className="w-full h-full object-cover" />
                    ) : formData.urlGambar ? (
                      <img src={formData.urlGambar} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Heart className="w-6 h-6 text-slate-300" />
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setImageFile(e.target.files[0]);
                      }
                    }}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Judul Program</label>
                <input required type="text" value={formData.judul} onChange={e => setFormData({...formData, judul: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-500" placeholder="Bantu Santri..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Target Nominal (Rp)</label>
                <input required type="number" min="0" value={formData.targetNominal} onChange={e => setFormData({...formData, targetNominal: Number(e.target.value)})} className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Deskripsi & Ajakan</label>
                <textarea rows={3} value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className="w-full p-2.5 rounded-lg border border-slate-200 outline-none focus:border-emerald-500 resize-none" placeholder="Deskripsi singkat..."></textarea>
              </div>
              
              {formData.id && (
                <div className="flex items-center gap-2 mt-2">
                  <input type="checkbox" id="isAktif" checked={formData.isAktif} onChange={e => setFormData({...formData, isAktif: e.target.checked})} className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500" />
                  <label htmlFor="isAktif" className="text-sm font-medium text-slate-700">Program Aktif (Terbuka untuk Wakaf)</label>
                </div>
              )}

              <div className="pt-2">
                <button type="submit" disabled={loading} className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50">
                  {loading ? 'Menyimpan...' : 'Simpan Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


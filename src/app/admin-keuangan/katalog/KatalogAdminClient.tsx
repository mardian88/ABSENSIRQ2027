"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Edit, Trash2, CheckCircle, XCircle, Search, Clock, Archive, Upload } from "lucide-react";
import { tambahKatalog, editKatalog, hapusKatalog, selesaikanPesanan, batalkanPesanan, uploadImageToCloudinaryKebutuhan, hapusPesanan } from "./actions";
import { formatRp } from "@/lib/utils";
import { showConfirm, showSuccess, showError, showPrompt } from "@/lib/sweetalert";
import { useRouter } from "next/navigation";

export default function KatalogAdminClient({ initialKatalog, initialPesanan }: { initialKatalog: any[], initialPesanan: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pesanan' | 'katalog' | 'riwayat'>('pesanan');
  const [katalog, setKatalog] = useState(initialKatalog);
  const [pesanan, setPesanan] = useState(initialPesanan);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setKatalog(initialKatalog);
    setPesanan(initialPesanan);
  }, [initialKatalog, initialPesanan]);

  // Form states for Katalog
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nama, setNama] = useState('');
  const [deskripsi, setDeskripsi] = useState('');
  const [kategori, setKategori] = useState<'gratis' | 'berbayar'>('gratis');
  const [harga, setHarga] = useState(0);
  const [stok, setStok] = useState(0);
  const [urlGambar, setUrlGambar] = useState('');
  const [isAktif, setIsAktif] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetForm = () => {
    setEditId(null);
    setNama('');
    setDeskripsi('');
    setKategori('gratis');
    setHarga(0);
    setStok(0);
    setUrlGambar('');
    setIsAktif(true);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleEditClick = (item: any) => {
    setEditId(item.id);
    setNama(item.nama);
    setDeskripsi(item.deskripsi);
    setKategori(item.kategori);
    setHarga(item.harga);
    setStok(item.stok);
    setUrlGambar(item.urlGambar || '');
    setIsAktif(item.isAktif);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsModalOpen(true);
  };

  const handleSubmitKatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let finalUrl = urlGambar;

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        finalUrl = await uploadImageToCloudinaryKebutuhan(formData);
      }

      let res;
      if (editId) {
        res = await editKatalog(editId, nama, deskripsi, kategori, harga, stok, finalUrl, isAktif);
      } else {
        res = await tambahKatalog(nama, deskripsi, kategori, harga, stok, finalUrl);
      }
      
      setLoading(false);
      if (res.success) {
        await showSuccess("Berhasil", res.message);
        setIsModalOpen(false);
        router.refresh();
      } else {
        showError("Gagal", res.message);
      }
    } catch (err: any) {
      setLoading(false);
      showError("Gagal", "Terjadi kesalahan: " + err.message);
    }
  };

  const handleDeleteKatalog = async (id: string) => {
    const pwd = await showPrompt("Hapus Barang Permanen?", "password", "Hapus");
    if (pwd !== null) {
      if (pwd !== "rqm") {
        showError("Gagal", "Password salah!");
        return;
      }
      setLoading(true);
      const res = await hapusKatalog(id);
      setLoading(false);
      if (res.success) {
        await showSuccess("Terhapus", "Barang beserta riwayat dan gambarnya berhasil dihapus");
        router.refresh();
      } else {
        showError("Gagal", res.message);
      }
    }
  };

  const handleSelesaikan = async (id: string) => {
    if (await showConfirm("Selesaikan Pesanan?", "Tandai pesanan ini sudah selesai diserahkan ke santri?", "Ya, Selesaikan", false)) {
      setLoading(true);
      const res = await selesaikanPesanan(id);
      setLoading(false);
      if (res.success) {
        router.refresh();
      } else {
        showError("Gagal", res.message);
      }
    }
  };

  const handleBatalkan = async (id: string) => {
    const alasan = await showPrompt("Batalkan Pesanan", "text", "Ya, Batalkan");
    if (alasan) {
      setLoading(true);
      const res = await batalkanPesanan(id, alasan);
      setLoading(false);
      if (res.success) {
        await showSuccess("Berhasil", res.message);
        router.refresh();
      } else {
        showError("Gagal", res.message);
      }
    }
  };

  const handleDeletePesanan = async (id: string) => {
    const pwd = await showPrompt("Hapus Pesanan Permanen?", "password", "Hapus");
    if (pwd !== null) {
      if (pwd !== "rqm") {
        showError("Gagal", "Password salah!");
        return;
      }
      setLoading(true);
      const res = await hapusPesanan(id);
      setLoading(false);
      if (res.success) {
        await showSuccess("Terhapus", res.message);
        router.refresh();
      } else {
        showError("Gagal", res.message);
      }
    }
  };

  const pesananMenunggu = pesanan.filter(p => p.status === 'menunggu');
  const pesananSelesai = pesanan.filter(p => p.status !== 'menunggu');

  const filteredPesananMasuk = pesananMenunggu.filter(p => p.namaSantri.toLowerCase().includes(searchQuery.toLowerCase()) || p.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredRiwayat = pesananSelesai.filter(p => p.namaSantri.toLowerCase().includes(searchQuery.toLowerCase()) || p.namaBarang.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Kebutuhan Santri</h1>
          <p className="text-slate-500 text-sm">Kelola pesanan dan katalog barang santri.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button onClick={() => setActiveTab('pesanan')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'pesanan' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Pesanan Masuk ({pesananMenunggu.length})
        </button>
        <button onClick={() => setActiveTab('katalog')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'katalog' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Katalog Barang
        </button>
        <button onClick={() => setActiveTab('riwayat')} className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${activeTab === 'riwayat' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
          Riwayat
        </button>
      </div>

      {activeTab === 'katalog' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> Tambah Barang
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {katalog.map(item => (
              <div key={item.id} className={`p-4 border rounded-xl flex gap-4 bg-white ${!item.isAktif ? 'opacity-60' : ''}`}>
                <div className="w-20 h-20 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                  {item.urlGambar ? <img src={item.urlGambar} alt={item.nama} className="w-full h-full object-cover" /> : <Archive className="w-8 h-8 text-slate-400" />}
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-slate-800 line-clamp-1">{item.nama}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap ${item.kategori === 'gratis' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.kategori === 'gratis' ? 'Gratis' : 'Berbayar'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Stok: <span className="font-bold">{item.stok}</span></p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{item.deskripsi}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-slate-800">{item.kategori === 'berbayar' ? formatRp(item.harga) : '-'}</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditClick(item)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteKatalog(item.id)} className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {katalog.length === 0 && <div className="col-span-full text-center py-10 text-slate-500">Katalog kosong</div>}
          </div>
        </div>
      )}

      {(activeTab === 'pesanan' || activeTab === 'riwayat') && (
        <div className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari santri atau barang..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="p-4 py-3">Tanggal Pesan</th>
                  <th className="p-4 py-3">Santri</th>
                  <th className="p-4 py-3">Barang</th>
                  <th className="p-4 py-3">Kategori</th>
                  <th className="p-4 py-3">Status</th>
                  <th className="p-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeTab === 'pesanan' ? filteredPesananMasuk : filteredRiwayat).map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4 text-slate-500">
                      {new Date(p.waktuPesan).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{p.namaSantri}</p>
                      <p className="text-xs text-slate-500">{p.nis}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-slate-700">{p.namaBarang}</p>
                      {p.kategori === 'berbayar' && <p className="text-xs text-slate-500 font-medium">{formatRp(p.hargaSaatPesan)}</p>}
                    </td>
                    <td className="p-4">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${p.kategori === 'gratis' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.kategori === 'gratis' ? 'Gratis' : 'Berbayar'}
                      </span>
                    </td>
                    <td className="p-4">
                      {p.status === 'menunggu' && <span className="flex items-center gap-1 text-amber-600 text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Menunggu</span>}
                      {p.status === 'selesai' && <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold"><CheckCircle className="w-3.5 h-3.5" /> Selesai</span>}
                      {p.status === 'dibatalkan' && (
                        <div>
                          <span className="flex items-center gap-1 text-rose-600 text-xs font-bold"><XCircle className="w-3.5 h-3.5" /> Dibatalkan</span>
                          {p.keterangan && <p className="text-[10px] text-slate-500 mt-1 max-w-[150px] italic">"{p.keterangan}"</p>}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        {activeTab === 'pesanan' && (
                          <>
                            <button onClick={() => handleSelesaikan(p.id)} disabled={loading} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 disabled:opacity-50">Selesaikan</button>
                            <button onClick={() => handleBatalkan(p.id)} disabled={loading} className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-100 disabled:opacity-50">Batal</button>
                          </>
                        )}
                        <button onClick={() => handleDeletePesanan(p.id)} disabled={loading} className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50" title="Hapus Permanen">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(activeTab === 'pesanan' ? filteredPesananMasuk : filteredRiwayat).length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 bg-slate-50/50">
                      Tidak ada data pesanan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Form Katalog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">{editId ? 'Edit Barang' : 'Tambah Barang'}</h3>
            </div>
            <div className="overflow-y-auto p-6 flex-1">
              <form id="katalogForm" onSubmit={handleSubmitKatalog} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Barang</label>
                  <input type="text" required value={nama} onChange={e=>setNama(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi Singkat</label>
                  <textarea rows={2} value={deskripsi} onChange={e=>setDeskripsi(e.target.value)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                    <select value={kategori} onChange={e=>setKategori(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      <option value="gratis">Gratis</option>
                      <option value="berbayar">Berbayar</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stok Tersedia</label>
                    <input type="number" required value={stok} onChange={e=>setStok(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Harga (Rp)</label>
                  <input type="number" required={kategori === 'berbayar'} disabled={kategori === 'gratis'} value={harga} onChange={e=>setHarga(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gambar Barang (Opsional)</label>
                  {urlGambar && !selectedFile && (
                    <div className="mb-2 relative w-16 h-16 rounded overflow-hidden border">
                      <img src={urlGambar} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-slate-100 border border-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-200 font-medium flex items-center gap-2">
                      <Upload className="w-4 h-4" /> {selectedFile ? selectedFile.name : (urlGambar ? 'Ganti Gambar' : 'Pilih File')}
                    </button>
                    {selectedFile && <button type="button" onClick={() => setSelectedFile(null)} className="text-xs text-rose-500">Batal</button>}
                  </div>
                  <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }} />
                  <p className="text-[10px] text-slate-500 mt-1">Gambar akan diunggah secara otomatis ke Cloudinary.</p>
                </div>
                {editId && (
                  <div className="flex items-center gap-2 pt-2">
                    <input type="checkbox" id="isAktif" checked={isAktif} onChange={e=>setIsAktif(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded" />
                    <label htmlFor="isAktif" className="text-sm font-medium text-slate-700">Barang Aktif (Tersedia)</label>
                  </div>
                )}
              </form>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium">Batal</button>
              <button form="katalogForm" type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
                {loading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

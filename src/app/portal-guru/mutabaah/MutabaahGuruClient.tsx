"use client";

import { useState } from "react";
import { ArrowLeft, BookOpen, Clock, Plus, Search, Pencil, Trash2, MessageSquare, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { tambahSetoranMutabaah, editMutabaahGuru, hapusMutabaahGuru } from "./actions";
import { showSuccess, showError, showConfirm } from "@/lib/sweetalert";
import { logoutGuru } from "../actions";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getMutabaahRiwayatColumns } from "./columns";

export function MutabaahGuruClient({ profil, listSantri, riwayat }: { profil: any, listSantri: any[], riwayat: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'input' | 'riwayat'>('input');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [idSantri, setIdSantri] = useState("");
  const [jenis, setJenis] = useState<'mengaji'|'hafalan'>('mengaji');
  const [capaian, setCapaian] = useState("");
  const [catatanGuru, setCatatanGuru] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [editId, setEditId] = useState<string | null>(null);

  const handleLogout = async () => {
    await logoutGuru();
    router.push("/portal-guru/login");
  };

  const filteredSantri = listSantri.filter(s => s.namaLengkap.toLowerCase().includes(search.toLowerCase()) || s.nomorInduk.includes(search));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSantri || !capaian) return showError("Gagal", "Pilih santri dan isi capaian!");

    setLoading(true);
    let res;
    if (editId) {
      res = await editMutabaahGuru(editId, jenis, capaian, tanggal, catatanGuru);
    } else {
      res = await tambahSetoranMutabaah(idSantri, jenis, capaian, tanggal, catatanGuru);
    }
    setLoading(false);

    if (res.success) {
      showSuccess("Tersimpan!", res.message);
      setCapaian("");
      setCatatanGuru("");
      setEditId(null);
      setActiveTab('riwayat');
    } else {
      showError("Gagal", res.message);
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);
    setIdSantri(item.idSantri);
    setJenis(item.jenis);
    setCapaian(item.capaian);
    setTanggal(item.tanggal);
    setCatatanGuru(item.catatanGuru || "");
    setActiveTab('input');
  };

  const handleDelete = async (id: string) => {
    const confirm = await showConfirm("Hapus Setoran?", "Data yang dihapus tidak bisa dikembalikan.");
    if (confirm) {
      setLoading(true);
      const res = await hapusMutabaahGuru(id);
      setLoading(false);
      if (res.success) {
        showSuccess("Terhapus!", res.message);
      } else {
        showError("Gagal", res.message);
      }
    }
  };

  const resetForm = () => {
    setEditId(null);
    setIdSantri("");
    setJenis('mengaji');
    setCapaian("");
    setCatatanGuru("");
    setTanggal(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/portal-guru")} className="p-2 bg-emerald-800 hover:bg-emerald-900 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-lg md:text-xl">Mutabaah Santri</h1>
              <p className="text-emerald-100 text-xs md:text-sm truncate">Halaqah: {listSantri.length > 0 ? listSantri[0].namaHalaqoh : 'Belum Ada'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 bg-emerald-800/50 hover:bg-emerald-800 rounded-lg text-emerald-100 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 py-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-white rounded-xl shadow-sm overflow-x-auto">
          <button onClick={()=>{setActiveTab('input'); if(!editId) resetForm();}} className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'input' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Plus className="w-4 h-4 inline mr-2" /> {editId ? 'Edit Setoran' : 'Input Setoran'}
          </button>
          <button onClick={()=>{setActiveTab('riwayat'); resetForm();}} className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'riwayat' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Clock className="w-4 h-4 inline mr-2" /> Riwayat Input
          </button>
        </div>

        {activeTab === 'input' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5">
            <div className="flex justify-between items-center">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                {editId ? 'Edit Setoran Santri' : 'Catat Setoran Baru'}
              </h2>
              {editId && (
                <button type="button" onClick={resetForm} className="text-xs text-rose-500 hover:text-rose-700 font-medium bg-rose-50 px-3 py-1.5 rounded-lg">
                  Batal Edit
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                <input 
                  type="date" 
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Santri</label>
                <select 
                  value={idSantri}
                  onChange={e => setIdSantri(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  required
                  disabled={!!editId}
                >
                  <option value="" disabled>-- Pilih Nama Santri --</option>
                  {listSantri.map(s => (
                    <option key={s.id} value={s.id}>{s.namaLengkap} ({s.nomorInduk})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Setoran</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={jenis === 'mengaji'} onChange={() => setJenis('mengaji')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                    <span>Mengaji (Tilawah)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={jenis === 'hafalan'} onChange={() => setJenis('hafalan')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                    <span>Hafalan (Tahfidz)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Capaian / Batasan</label>
                <textarea 
                  value={capaian}
                  onChange={e => setCapaian(e.target.value)}
                  placeholder="Cth: Iqro 4 Hal 12-15 / Surah An-Naba Ayat 1-15"
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[100px]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan Guru (Opsional)</label>
                <textarea 
                  value={catatanGuru}
                  onChange={e => setCatatanGuru(e.target.value)}
                  placeholder="Cth: Tajwid perlu diperbaiki, hafalan lancar."
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[80px]"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Simpan Setoran')}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'riwayat' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
            <DataTable
              columns={getMutabaahRiwayatColumns(handleEdit, handleDelete)}
              data={riwayat}
              searchKey="namaSantri"
            />
          </div>
        )}

      </main>
    </div>
  );
}

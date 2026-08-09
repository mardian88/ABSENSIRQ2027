"use client";

import { useState } from "react";
import { LogOut, ArrowLeft, Plus, CheckCircle2, Search, BookOpen, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { tambahSetoranMutabaah } from "./actions";
import { showSuccess, showError } from "@/lib/sweetalert";
import { logoutGuru } from "../actions";

export function MutabaahGuruClient({ profil, listSantri, riwayat }: { profil: any, listSantri: any[], riwayat: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'input' | 'riwayat'>('input');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [idSantri, setIdSantri] = useState("");
  const [jenis, setJenis] = useState<'mengaji'|'hafalan'>('mengaji');
  const [capaian, setCapaian] = useState("");
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  const handleLogout = async () => {
    await logoutGuru();
    router.push("/portal-guru/login");
  };

  const filteredSantri = listSantri.filter(s => s.namaLengkap.toLowerCase().includes(search.toLowerCase()) || s.nomorInduk.includes(search));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSantri || !capaian) return showError("Gagal", "Pilih santri dan isi capaian!");

    setLoading(true);
    const res = await tambahSetoranMutabaah(idSantri, jenis, capaian, tanggal);
    setLoading(false);

    if (res.success) {
      showSuccess("Tersimpan!", res.message);
      setCapaian("");
      setActiveTab('riwayat');
    } else {
      showError("Gagal", res.message);
    }
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
          <button onClick={()=>setActiveTab('input')} className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'input' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Plus className="w-4 h-4 inline mr-2" /> Input Setoran
          </button>
          <button onClick={()=>setActiveTab('riwayat')} className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'riwayat' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Clock className="w-4 h-4 inline mr-2" /> Riwayat Input
          </button>
        </div>

        {activeTab === 'input' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 space-y-5">
            <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Catat Setoran Baru
            </h2>
            
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

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'Menyimpan...' : 'Simpan Setoran'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'riwayat' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari nama santri..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
            </div>
            
            <div className="divide-y divide-slate-100 max-h-[60vh] overflow-y-auto">
              {riwayat.filter(r => r.namaSantri.toLowerCase().includes(search.toLowerCase())).length > 0 ? (
                riwayat.filter(r => r.namaSantri.toLowerCase().includes(search.toLowerCase())).map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800">{item.namaSantri}</p>
                        <p className="text-xs text-slate-500">{new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold capitalize ${item.jenis === 'mengaji' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {item.jenis}
                      </span>
                    </div>
                    
                    <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 mt-1 text-sm text-slate-700">
                      {item.capaian}
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      {item.isSeenByOrtu ? (
                        <span className="text-emerald-600 text-xs flex items-center gap-1 font-medium"><CheckCircle2 className="w-3.5 h-3.5" /> Telah dicek Wali</span>
                      ) : (
                        <span className="text-slate-400 text-xs flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Belum dicek Wali</span>
                      )}
                    </div>
                    {item.catatanOrtu && (
                      <div className="text-xs text-slate-600 mt-1 italic border-l-2 border-emerald-300 pl-2">
                        Ortu: "{item.catatanOrtu}"
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  Belum ada riwayat setoran.
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

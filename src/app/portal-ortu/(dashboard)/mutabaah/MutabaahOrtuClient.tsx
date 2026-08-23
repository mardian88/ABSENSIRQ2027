"use client";

import { useState } from "react";
import { LogOut, ArrowLeft, CheckCircle2, Clock, CalendarCheck, BookOpen, User, PenTool, MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { tandaiTelahDilihat, tambahSetoranLiburOrtu } from "../../actions";
import { showSuccess, showError } from "@/lib/sweetalert";
import { DatePicker } from "@/components/ui/date-picker";

export function MutabaahOrtuClient({ profil, riwayat }: { profil: any, riwayat: any[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'riwayat' | 'liburan'>('riwayat');
  const [loading, setLoading] = useState(false);
  const [marked, setMarked] = useState<Record<string, boolean>>({});

  const [jenis, setJenis] = useState<'mengaji'|'hafalan'>('mengaji');
  const [capaian, setCapaian] = useState("");
  const [tanggal, setTanggal] = useState<Date | undefined>(new Date());

  

  const handleMarkSeen = async (id: string, catatan: string = "") => {
    setMarked(prev => ({ ...prev, [id]: true }));
    const res = await tandaiTelahDilihat(id, catatan);
    if (!res.success) {
      setMarked(prev => ({ ...prev, [id]: false }));
      showError("Gagal", res.message);
    } else {
      showSuccess("Telah Dilihat", "Terima kasih atas pantauannya.");
    }
  };

  const promptMarkSeen = (id: string) => {
    const catatan = window.prompt("Tambahkan catatan opsional (misal: 'Alhamdulillah', atau 'Kurang lancar di rumah'):");
    if (catatan !== null) {
      handleMarkSeen(id, catatan);
    }
  };

  const handleInputLiburan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!capaian || !tanggal) return showError("Gagal", "Harap isi capaian dan pilih tanggal.");
    
    setLoading(true);
    // Format tanggal ke YYYY-MM-DD
    const dateStr = `${tanggal.getFullYear()}-${String(tanggal.getMonth() + 1).padStart(2, '0')}-${String(tanggal.getDate()).padStart(2, '0')}`;
    const res = await tambahSetoranLiburOrtu(jenis, capaian, dateStr);
    setLoading(false);

    if (res.success) {
      showSuccess("Berhasil", res.message);
      setCapaian("");
      setActiveTab('riwayat');
    } else {
      showError("Gagal", res.message);
    }
  };

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      <div className="sticky top-0 z-30 bg-slate-50 pt-6 px-6 pb-4 shadow-sm border-b border-slate-100 mb-6 flex flex-col gap-4">
        <div className="max-w-5xl mx-auto w-full flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Mutabaah Santri</h1>
            <p className="text-slate-500">Pantau capaian mengaji dan hafalan</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 p-1 bg-white rounded-xl shadow-sm overflow-x-auto">
            <button onClick={()=>setActiveTab('riwayat')} className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center justify-center gap-2 ${activeTab === 'riwayat' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <CalendarCheck className="w-4 h-4" /> Riwayat Mutabaah
            </button>
            <button onClick={()=>setActiveTab('liburan')} className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-colors flex items-center justify-center gap-2 ${activeTab === 'liburan' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>
              <PenTool className="w-4 h-4" /> Input Mandiri (Liburan)
            </button>
          </div>
        </div>
      </div>

      <main className="space-y-6 max-w-5xl mx-auto w-full px-6">

        {activeTab === 'riwayat' && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">Catatan Capaian Harian</h2>
            {riwayat.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {riwayat.map((item) => (
                    <div key={item.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-bold capitalize ${item.jenis === 'mengaji' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                            {item.jenis}
                          </span>
                          <span className="text-xs font-medium text-slate-500">
                            {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </span>
                          {item.inputOleh === 'ortu' && (
                            <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700">Input Mandiri</span>
                          )}
                        </div>
                        
                        <p className="text-sm font-medium text-slate-800">
                          {item.capaian}
                        </p>
                        {item.catatanGuru && (
                          <div className="flex items-start gap-1 text-xs text-blue-600 mt-2 italic bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                            <MessageSquare className="w-4 h-4 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-semibold block mb-0.5">Catatan Pembimbing:</span>
                              "{item.catatanGuru}"
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-shrink-0">
                        {item.isSeenByOrtu || marked[item.id] ? (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100">
                              <CheckCircle2 className="w-4 h-4" /> Telah Dilihat
                            </div>
                            {item.catatanOrtu && (
                              <p className="text-xs text-slate-500 italic text-right max-w-[200px] truncate" title={item.catatanOrtu}>
                                "{item.catatanOrtu}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <button 
                            onClick={() => promptMarkSeen(item.id)}
                            className="w-full md:w-auto flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Tandai Telah Dilihat
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-700 mb-1">Belum Ada Catatan</h3>
                <p className="text-slate-500 text-sm">Belum ada riwayat mutabaah (setoran) yang tercatat untuk ananda.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'liburan' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div>
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-1">
                <PenTool className="w-5 h-5 text-emerald-600" />
                Input Mandiri di Rumah
              </h2>
              <p className="text-xs text-slate-500">Gunakan fitur ini untuk mencatat mutabaah anak Anda secara mandiri.</p>
            </div>
            
            {new Date().getDay() === 0 || new Date().getDay() === 6 ? (
              <form onSubmit={handleInputLiburan} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-1 py-1">
                    <DatePicker date={tanggal} setDate={setTanggal} placeholder="DD/MM/YYYY" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Capaian</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 p-3 rounded-xl flex-1">
                      <input type="radio" checked={jenis === 'mengaji'} onChange={() => setJenis('mengaji')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                      <span className="font-medium text-slate-700">Mengaji</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 p-3 rounded-xl flex-1">
                      <input type="radio" checked={jenis === 'hafalan'} onChange={() => setJenis('hafalan')} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                      <span className="font-medium text-slate-700">Hafalan</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Capaian</label>
                  <textarea 
                    value={capaian}
                    onChange={e => setCapaian(e.target.value)}
                    placeholder="Contoh: Muraja'ah Juz 30 / Tilawah Surah Al-Kahfi"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none min-h-[100px]"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Menyimpan...' : 'Simpan Capaian'}
                </button>
              </form>
            ) : (
              <div className="bg-orange-50 border border-orange-200 p-5 rounded-xl text-center">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-orange-800 mb-1">Fitur Terkunci</h3>
                <p className="text-sm text-orange-700">Fitur Input Mandiri hanya dibuka dan dapat diakses pada hari <b>Sabtu dan Ahad (Akhir Pekan)</b>.</p>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}

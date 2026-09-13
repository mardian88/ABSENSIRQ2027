"use client";

import { Search, CheckCircle, XCircle, Clock, History, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { getAudioSettings } from "@/app/pengaturan/actions";
import { recordAbsensiById } from "../actions";
import { KioskNav } from "@/components/KioskNav";
import { formatTimeID } from "@/lib/date";

type SantriData = {
  id: string;
  namaLengkap: string;
  nomorInduk: string;
  halaqoh: string | null;
  kategori: string;
  waktuMasuk: string | null;
  waktuPulang: string | null;
  statusHariIni: "belum_absen" | "sudah_masuk" | "sudah_pulang" | "izin" | "sakit";
};

type HistoryData = {
  idSantri: string;
  nama: string;
  waktuMasuk: string | null;
  waktuPulang: string | null;
  lastUpdateMs: number;
  pulangMs: number | null;
};

export function ManualAbsenClient({ initialData }: { initialData: SantriData[] }) {
  const [search, setSearch] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioConfig, setAudioConfig] = useState<any>(null);

  const [scanResult, setScanResult] = useState<{ nama: string; waktu: string; jenis: string } | null>(null);
  
  // State untuk menyimpan data santri & statusnya
  const [dataSantri, setDataSantri] = useState<SantriData[]>(initialData);
  const [history, setHistory] = useState<HistoryData[]>([]);

  useEffect(() => { getAudioSettings().then(setAudioConfig); }, []);
  
  // Load history from localStorage on mount & clean up old entries
  useEffect(() => {
    const saved = localStorage.getItem("manualAbsenHistory");
    if (saved) {
      try {
        const parsed: HistoryData[] = JSON.parse(saved);
        const now = Date.now();
        const sixHoursMs = 6 * 60 * 60 * 1000;
        
        const validHistory = parsed.filter(h => {
          if (h.pulangMs && (now - h.pulangMs > sixHoursMs)) {
            return false;
          }
          return true;
        });
        
        setHistory(validHistory);
        if (validHistory.length !== parsed.length) {
          localStorage.setItem("manualAbsenHistory", JSON.stringify(validHistory));
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const searchResults = search.length >= 2 
    ? dataSantri.filter(s => 
        s.namaLengkap.toLowerCase().includes(search.toLowerCase()) || 
        (s.nomorInduk && s.nomorInduk.toLowerCase().includes(search.toLowerCase())) ||
        (s.halaqoh && s.halaqoh.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 5) // Tampilkan maksimal 5 hasil
    : [];

  const handleAbsen = async (idSantri: string, jenisAbsen: 'masuk' | 'pulang') => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    // Tampilkan animasi instan
    const targetSantri = dataSantri.find(s => s.id === idSantri);
    const namaSantri = targetSantri ? targetSantri.namaLengkap : "Santri";
    
    setScanResult({
      nama: `Memproses ${namaSantri}...`,
      waktu: "Mohon tunggu...",
      jenis: "processing"
    });

    try {
      const res = await recordAbsensiById(idSantri, jenisAbsen, 'manual', 'hadir');
      
      if (res.success) {
        const waktuAbsen = res.data?.waktu || formatTimeID(new Date());
        
        if (audioConfig) {
          if (jenisAbsen === 'masuk' && audioConfig.isAudioMasukAktif && audioConfig.urlAudioMasuk) {
            new Audio(audioConfig.urlAudioMasuk).play().catch(() => {});
          } else if (jenisAbsen === 'pulang' && audioConfig.isAudioPulangAktif && audioConfig.urlAudioPulang) {
            new Audio(audioConfig.urlAudioPulang).play().catch(() => {});
          }
        }

        setScanResult({
          nama: res.data?.namaLengkap || namaSantri,
          waktu: waktuAbsen,
          jenis: jenisAbsen
        });

        // Update main data list in real-time
        setDataSantri(prev => prev.map(s => {
          if (s.id === idSantri) {
            const dateStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' });
            return {
              ...s,
              statusHariIni: jenisAbsen === 'masuk' ? 'sudah_masuk' : 'sudah_pulang',
              waktuMasuk: jenisAbsen === 'masuk' ? dateStr : s.waktuMasuk,
              waktuPulang: jenisAbsen === 'pulang' ? dateStr : s.waktuPulang
            };
          }
          return s;
        }));

        // Update history (masih dipertahankan sbg riwayat log admin ini)
        setHistory(prev => {
          const nowMs = Date.now();
          const existingIndex = prev.findIndex(h => h.idSantri === idSantri);
          let updatedItem: HistoryData;

          if (existingIndex >= 0) {
            const existing = prev[existingIndex];
            updatedItem = {
              ...existing,
              waktuMasuk: jenisAbsen === 'masuk' ? waktuAbsen : existing.waktuMasuk,
              waktuPulang: jenisAbsen === 'pulang' ? waktuAbsen : existing.waktuPulang,
              lastUpdateMs: nowMs,
              pulangMs: jenisAbsen === 'pulang' ? nowMs : existing.pulangMs
            };
            const filtered = prev.filter(h => h.idSantri !== idSantri);
            const newHistory = [updatedItem, ...filtered].slice(0, 5);
            localStorage.setItem("manualAbsenHistory", JSON.stringify(newHistory));
            return newHistory;
          } else {
            updatedItem = {
              idSantri,
              nama: res.data?.namaLengkap || namaSantri,
              waktuMasuk: jenisAbsen === 'masuk' ? waktuAbsen : null,
              waktuPulang: jenisAbsen === 'pulang' ? waktuAbsen : null,
              lastUpdateMs: nowMs,
              pulangMs: jenisAbsen === 'pulang' ? nowMs : null
            };
            const newHistory = [updatedItem, ...prev].slice(0, 5);
            localStorage.setItem("manualAbsenHistory", JSON.stringify(newHistory));
            return newHistory;
          }
        });
        
        setSearch("");
        
      } else {
        if (audioConfig?.isAudioGagalAktif && audioConfig?.urlAudioGagal) {
          new Audio(audioConfig.urlAudioGagal).play().catch(() => {});
        }
        setScanResult({
          nama: (res as any).message || "Gagal absen",
          waktu: formatTimeID(new Date()),
          jenis: "error"
        });
      }
    } catch (e: any) {
      setScanResult({
        nama: e.message || "Gagal Server",
        waktu: formatTimeID(new Date()),
        jenis: "error"
      });
    } finally {
      setTimeout(() => {
        setScanResult(null);
        setIsProcessing(false);
      }, 1000); // 1 detik saja
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center pt-8 pb-12 px-4 relative">
      <KioskNav />
      
      <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative mt-4">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <h1 className="text-2xl font-bold text-white relative z-10 mb-2">Absensi Manual</h1>
          <p className="text-slate-300 text-sm relative z-10">Cari nama santri untuk absen masuk/pulang</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-11 pr-4 py-4 bg-slate-50 border-slate-200 rounded-2xl text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium placeholder:font-normal placeholder:text-slate-400"
              placeholder="Ketik minimal 2 huruf..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              disabled={isProcessing}
            />
          </div>

          <div className="space-y-4">
            {search.length >= 2 ? (
              <>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Hasil Pencarian
                </div>
                {searchResults.length > 0 ? (
                  searchResults.map((santri) => (
                    <div key={santri.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-sm gap-3">
                      <div>
                        <h3 className="font-bold text-slate-800">{santri.namaLengkap}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{santri.nomorInduk || '-'} • {santri.halaqoh || 'Belum Ada Halaqoh'}</p>
                        
                        {(santri.waktuMasuk || santri.waktuPulang) && (
                          <div className="flex items-center gap-3 text-[10px] md:text-xs mt-1.5 text-slate-500">
                            {santri.waktuMasuk && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Msk: {santri.waktuMasuk}</span>
                              </div>
                            )}
                            {santri.waktuPulang && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Plg: {santri.waktuPulang}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {santri.statusHariIni === 'belum_absen' && (
                          <button 
                            onClick={() => handleAbsen(santri.id, 'masuk')}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg font-bold transition-all text-xs disabled:opacity-50 border border-emerald-200"
                          >
                            Masuk
                          </button>
                        )}

                        {santri.statusHariIni === 'sudah_masuk' && (
                          <button 
                            onClick={() => handleAbsen(santri.id, 'pulang')}
                            disabled={isProcessing}
                            className="px-4 py-2 bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white rounded-lg font-bold transition-all text-xs disabled:opacity-50 border border-amber-200"
                          >
                            Pulang
                          </button>
                        )}

                        {santri.statusHariIni === 'sudah_pulang' && (
                          <span className="px-3 py-1.5 rounded bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider">
                            Selesai
                          </span>
                        )}

                        {(santri.statusHariIni === 'izin' || santri.statusHariIni === 'sakit') && (
                          <span className="px-3 py-1.5 rounded bg-blue-100 text-blue-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {santri.statusHariIni}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    Tidak ditemukan kecocokan
                  </div>
                )}
              </>
            ) : (
              // TAMPILAN HISTORY (JIKA TIDAK MENCARI)
              <>
                <div className="flex items-center gap-2 mb-2 text-slate-500 mt-2">
                  <History className="w-4 h-4" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider">Log Riwayat Anda (5 Data)</h2>
                </div>
                
                {history.length > 0 ? (
                  history.map((item) => {
                    const isPulang = item.waktuPulang !== null;
                    return (
                      <div key={item.idSantri} className={`flex flex-row items-center justify-between p-3 rounded-xl border transition-colors ${isPulang ? 'bg-slate-50 border-slate-200' : 'bg-emerald-50/30 border-emerald-100'}`}>
                        <div className="min-w-0 flex-1">
                          <h3 className={`font-bold text-sm truncate ${isPulang ? 'text-slate-600' : 'text-emerald-900'}`}>{item.nama}</h3>
                          <div className={`flex items-center gap-3 text-xs mt-1 ${isPulang ? 'text-slate-500' : 'text-emerald-700'}`}>
                            {item.waktuMasuk && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Masuk: {item.waktuMasuk}</span>
                              </div>
                            )}
                            {item.waktuPulang && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Pulang: {item.waktuPulang}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2 ml-2">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${isPulang ? 'bg-slate-200 text-slate-600' : 'bg-emerald-200 text-emerald-800'}`}>
                            {isPulang ? 'Selesai' : 'Baru Saja'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <p className="text-sm font-medium">Belum ada riwayat aktivitas.</p>
                    <p className="text-[11px] mt-1">Cari nama santri di atas untuk melakukan absen.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notifikasi Pop-up */}
      {scanResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className={`bg-gradient-to-br rounded-3xl p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center transform transition-all animate-in zoom-in-95 duration-200 ${
            scanResult.jenis === 'error' ? 'from-rose-500 to-rose-600 shadow-rose-500/20' : 
            scanResult.jenis === 'processing' ? 'from-slate-700 to-slate-800 shadow-slate-900/20' :
            'from-emerald-400 to-emerald-600 shadow-emerald-500/20'
          }`}>
            <div className="bg-white/20 p-4 rounded-full mb-6 backdrop-blur-md">
              {scanResult.jenis === 'error' ? (
                <XCircle className="w-16 h-16 text-white" />
              ) : scanResult.jenis === 'processing' ? (
                <Clock className="w-16 h-16 text-white animate-pulse" />
              ) : (
                <CheckCircle className="w-16 h-16 text-white" />
              )}
            </div>
            
            <div>
              <p className="text-white/80 text-xs font-bold tracking-widest uppercase mb-2">
                {scanResult.jenis === 'error' ? 'Gagal' : scanResult.jenis === 'processing' ? 'Mohon Tunggu' : scanResult.jenis === 'masuk' ? 'Berhasil Masuk' : 'Berhasil Pulang'}
              </p>
              <h3 className="text-white font-black text-2xl tracking-tight leading-tight mb-2">{scanResult.nama}</h3>
              {scanResult.waktu && <p className="text-white/80 text-sm font-medium">{scanResult.waktu}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

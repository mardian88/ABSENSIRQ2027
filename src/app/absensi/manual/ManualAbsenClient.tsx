"use client";

import { Search, CheckCircle, XCircle, Clock, History } from "lucide-react";
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
  
  const playAudioResult = (success: boolean, jenis: string) => {
    if (!audioConfig) {
      if (success) new Audio('/notif/berhasil.wav').play().catch(() => {});
      else new Audio('/notif/gagal.wav').play().catch(() => {});
      return;
    }
    try {
      if (success) {
        if (jenis === 'masuk' && audioConfig.isAudioMasukAktif && audioConfig.urlAudioMasuk) {
          new Audio(audioConfig.urlAudioMasuk).play().catch(() => {});
        } else if (jenis === 'pulang' && audioConfig.isAudioPulangAktif && audioConfig.urlAudioPulang) {
          new Audio(audioConfig.urlAudioPulang).play().catch(() => {});
        } else if ((jenis === 'masuk' && audioConfig.isAudioMasukAktif) || (jenis === 'pulang' && audioConfig.isAudioPulangAktif)) {
          new Audio('/notif/berhasil.wav').play().catch(() => {});
        }
      } else {
        if (audioConfig.isAudioGagalAktif && audioConfig.urlAudioGagal) {
          new Audio(audioConfig.urlAudioGagal).play().catch(() => {});
        } else if (audioConfig.isAudioGagalAktif) {
          new Audio('/notif/gagal.wav').play().catch(() => {});
        }
      }
    } catch (e) {}
  };

  useEffect(() => { getAudioSettings().then(setAudioConfig); }, []);
  const [scanResult, setScanResult] = useState<{ nama: string; waktu: string; jenis: string } | null>(null);
  
  // State untuk menyimpan history absen sesi ini
  const [history, setHistory] = useState<HistoryData[]>([]);

  // Load history from localStorage on mount & clean up old entries
  useEffect(() => {
    const saved = localStorage.getItem("manualAbsenHistory");
    if (saved) {
      try {
        const parsed: HistoryData[] = JSON.parse(saved);
        const now = Date.now();
        const sixHoursMs = 6 * 60 * 60 * 1000;
        
        // Filter history: hilangkan yang sudah pulang lebih dari 6 jam
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

  // Filter santri, batas maksimal 5 jika ada pencarian, kosong jika tidak mencari
  const isSearching = search.trim().length > 0;
  const filteredSantri = isSearching 
    ? initialData.filter((s) => 
        s.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
        (s.nomorInduk && s.nomorInduk.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 5) // Tampilkan maksimal 5 hasil
    : [];

  const handleAbsen = async (idSantri: string, jenisAbsen: 'masuk' | 'pulang') => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const targetSantri = initialData.find(s => s.id === idSantri);
    const namaSantri = targetSantri ? targetSantri.namaLengkap : "Santri";

    try {
      const res = await recordAbsensiById(idSantri, jenisAbsen, 'manual', 'hadir');
      if (res.success) {
         new Audio('/notif/berhasil.wav').play().catch(e => console.error("Audio error:", e));
         
         const waktuAbsen = res.data?.waktu || formatTimeID(new Date());
         
         setScanResult({
           nama: res.data?.namaLengkap || namaSantri,
           waktu: waktuAbsen,
           jenis: jenisAbsen
         });

         // Update history
         setHistory(prev => {
           const nowMs = Date.now();
           // Cari apakah santri ini sudah ada di history
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
             // Hapus yang lama agar yang baru bisa ditaruh di paling atas
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
         
         // Bersihkan pencarian setelah berhasil
         setSearch("");

      } else {
         setScanResult({
           nama: res.message || "Gagal mencatat absensi",
           waktu: formatTimeID(new Date()),
           jenis: "error"
         });
      }
    } catch (e) {
      console.error(e);
      setScanResult({
        nama: "Terjadi kesalahan sistem",
        waktu: formatTimeID(new Date()),
        jenis: "error"
      });
    } finally {
      setTimeout(() => {
        setScanResult(null);
        setIsProcessing(false);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      <KioskNav />
      <div className="p-4 md:p-8 space-y-4 max-w-3xl mx-auto pt-20 md:pt-24 z-10 relative">
        <div className="flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900">Absensi Manual</h1>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari nama atau NIS (Nomor Induk)..."
              className="w-full pl-10 pr-3 py-2 md:py-3 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-sm bg-slate-50 focus:bg-white shadow-inner focus:shadow-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            {isSearching ? (
              // TAMPILAN HASIL PENCARIAN
              <>
                <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Hasil Pencarian</h2>
                {filteredSantri.map((santri) => (
                  <div key={santri.id} className="flex flex-row items-center justify-between p-2 md:p-3 rounded-lg border border-slate-100 hover:border-slate-300 transition-all hover:shadow-sm bg-white gap-2 group">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800 text-sm md:text-base group-hover:text-blue-600 transition-colors truncate">{santri.namaLengkap}</h3>
                      <p className="text-slate-500 text-[10px] md:text-xs truncate">NIS: <span className="font-medium text-slate-700">{santri.nomorInduk || '-'}</span> • Halaqoh: {santri.halaqoh || '-'}</p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                        <button 
                          onClick={() => handleAbsen(santri.id, 'masuk')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 md:px-4 md:py-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-md font-bold transition-all text-[11px] md:text-xs disabled:opacity-50 shadow-sm border border-emerald-200 hover:border-emerald-600"
                        >
                          Masuk
                        </button>
                        <button 
                          onClick={() => handleAbsen(santri.id, 'pulang')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 md:px-4 md:py-2 bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white rounded-md font-bold transition-all text-[11px] md:text-xs disabled:opacity-50 shadow-sm border border-amber-200 hover:border-amber-500"
                        >
                          Pulang
                        </button>
                    </div>
                  </div>
                ))}
                
                {filteredSantri.length === 0 && (
                  <div className="text-center py-6 text-slate-400">
                    <p className="text-sm font-medium">Santri tidak ditemukan.</p>
                  </div>
                )}
              </>
            ) : (
              // TAMPILAN HISTORY (JIKA TIDAK MENCARI)
              <>
                <div className="flex items-center gap-2 mb-2 text-slate-500">
                  <History className="w-4 h-4" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider">History Terakhir (5 Data)</h2>
                </div>
                
                {history.length > 0 ? (
                  history.map((item) => {
                    const isPulang = item.waktuPulang !== null;
                    return (
                      <div key={item.idSantri} className={`flex flex-row items-center justify-between p-2 md:p-3 rounded-lg border transition-colors
                        ${isPulang ? 'bg-slate-100 border-slate-200 opacity-70' : 'bg-emerald-50/50 border-emerald-100'}`}>
                        <div className="min-w-0 flex-1">
                          <h3 className={`font-bold text-sm truncate ${isPulang ? 'text-slate-600' : 'text-emerald-900'}`}>{item.nama}</h3>
                          <div className={`flex items-center gap-3 text-[10px] md:text-xs mt-0.5 ${isPulang ? 'text-slate-500' : 'text-emerald-700'}`}>
                            {item.waktuMasuk && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Masuk: {item.waktuMasuk}</span>
                              </div>
                            )}
                            {item.waktuPulang && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Pulang: {item.waktuPulang}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          {!isPulang && (
                            <button
                              onClick={() => handleAbsen(item.idSantri, 'pulang')}
                              disabled={isProcessing}
                              className="px-3 py-1 bg-amber-100 hover:bg-amber-500 text-amber-700 hover:text-white rounded font-bold transition-colors text-[10px] uppercase tracking-wider shadow-sm border border-amber-200 disabled:opacity-50"
                            >
                              Pulang
                            </button>
                          )}
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider 
                            ${isPulang ? 'bg-slate-200 text-slate-600' : 'bg-emerald-200 text-emerald-800'}`}>
                            {isPulang ? 'Selesai' : 'Hadir'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    <p className="text-sm">Belum ada history absen di sesi ini.</p>
                    <p className="text-[10px] mt-1">Gunakan pencarian di atas untuk mulai absen.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Efek Kilat Latar (Flash Effect) */}
      {scanResult && scanResult.jenis !== 'error' && (
        <div className={`fixed inset-0 mix-blend-overlay z-40 animate-in fade-in duration-300 pointer-events-none
          ${scanResult.jenis === 'masuk' ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}></div>
      )}

      {/* Notifikasi Hasil Absen */}
      {scanResult && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-in zoom-in-90 fade-in duration-200 pointer-events-none">
          <div className={`backdrop-blur-xl px-6 py-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border flex flex-col items-center gap-3 text-center transform transition-all
            ${scanResult.jenis === 'error' ? 'bg-rose-950/80 border-rose-500/30' : scanResult.jenis === 'masuk' ? 'bg-emerald-950/80 border-emerald-500/30' : 'bg-amber-950/80 border-amber-500/30'}`}>
            
            <div className={`p-2.5 rounded-full ${scanResult.jenis === 'error' ? 'bg-rose-500/20 text-rose-400' : scanResult.jenis === 'masuk' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {scanResult.jenis === 'error' ? (
                <XCircle className="w-10 h-10" />
              ) : (
                <CheckCircle className="w-10 h-10" />
              )}
            </div>
            
            <div>
              <p className="text-white/70 text-[10px] font-semibold tracking-wider uppercase mb-1">
                {scanResult.jenis === 'error' ? 'Gagal' : scanResult.jenis === 'masuk' ? 'Berhasil Masuk' : 'Berhasil Pulang'}
              </p>
              <h3 className="text-white font-bold text-xl tracking-tight leading-tight max-w-[250px] truncate">{scanResult.nama}</h3>
              {scanResult.waktu && <p className="text-white/60 text-xs mt-1.5 font-medium">{scanResult.waktu}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

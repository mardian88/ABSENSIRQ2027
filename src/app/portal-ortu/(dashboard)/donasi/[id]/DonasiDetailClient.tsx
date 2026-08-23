"use client";

import { useState, useEffect } from "react";
import { Heart, ChevronLeft, CheckCircle, Wallet, QrCode, Building, AlertCircle, Clock, Download, Share2 } from "lucide-react";
import { formatRp } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buatTransaksiDonasi } from "../actions";
import { showSuccess, showError } from "@/lib/sweetalert";
import { generateDynamicQRIS, STATIC_QRIS } from "@/lib/qris";
import { QRCodeCanvas } from "qrcode.react";

export default function DonasiDetailClient({ program, donaturs, idSantri, namaSantri }: { program: any, donaturs: any[], idSantri: string, namaSantri: string }) {
  const router = useRouter();
  
  const progress = program.targetNominal > 0 ? Math.min(100, (program.terkumpul / program.targetNominal) * 100) : 0;
  
  const [step, setStep] = useState<'detail' | 'input' | 'payment'>('detail');
  const [nominalStr, setNominalStr] = useState('');
  const [nominalValue, setNominalValue] = useState(0);
  const [isAnonim, setIsAnonim] = useState(false);
  const [doa, setDoa] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(3600);
  const [uniqueCode, setUniqueCode] = useState(0);

  // Handle nominal input with formatting
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove non-digits
    const rawValue = e.target.value.replace(/\D/g, '');
    if (!rawValue) {
      setNominalStr('');
      setNominalValue(0);
      return;
    }
    
    // Format with dots
    const numValue = parseInt(rawValue, 10);
    const formatted = numValue.toLocaleString('id-ID');
    
    setNominalValue(numValue);
    setNominalStr(formatted);
  };

  const handleQuickNominal = (val: number) => {
    setNominalValue(val);
    setNominalStr(val.toLocaleString('id-ID'));
  };

  const startDonasi = () => {
    if (!program.isAktif) return;
    setStep('input');
  };

  const lanjutPembayaran = async () => {
    if (nominalValue < 5000) {
      showError("Gagal", "Minimal Wakaf adalah Rp 5.000");
      return;
    }

    setLoading(true);
    // Add unique code (random 10-99)
    const code = Math.floor(Math.random() * 90) + 10;
    setUniqueCode(code);
    
    const finalNominal = nominalValue + code;
    
    const res = await buatTransaksiDonasi(program.id, idSantri, finalNominal, isAnonim, doa);
    setLoading(false);

    if (res.success) {
      setNominalValue(finalNominal); // update to total including unique code for QRIS
      setStep('payment');
    } else {
      showError("Gagal", res.message);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'payment') {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const downloadQRIS = () => {
    const canvas = document.getElementById("qris-canvas") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `Wakaf_${program.judul.slice(0,10)}_${nominalValue}.png`;
      a.click();
      showSuccess("Berhasil", "QRIS berhasil disimpan ke perangkat.");
    }
  };

  const selesaikanDonasi = () => {
    showSuccess("Alhamdulillah", "Terima kasih atas Wakaf Anda. Pembayaran sedang menunggu verifikasi admin.");
    router.push('/portal-ortu/donasi');
    router.refresh();
  };

  if (step === 'payment') {
    return (
      <div className="pb-24">
        {/* Header */}
        <div className="bg-slate-900 px-4 pt-6 pb-6 text-white flex items-center gap-3 relative z-10 sticky top-0">
          <h1 className="font-bold text-lg flex-1">Pembayaran Wakaf</h1>
        </div>

        <div className="p-4 space-y-6 animate-in slide-in-from-right-4">
          <div className="flex items-center justify-between mb-2 bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
            <span className="text-sm font-medium text-rose-800">Sisa Waktu Pembayaran</span>
            <div className="text-rose-600 font-bold flex items-center gap-2">
              <Clock className="w-5 h-5" /> {formatTime(timeLeft)}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center shadow-sm">
            <p className="text-sm text-slate-500 mb-1">Total Wakaf</p>
            <p className="text-3xl font-black text-emerald-600">{formatRp(nominalValue)}</p>
            <p className="text-[10px] text-slate-400 mt-2 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">Termasuk angka unik: <span className="font-bold text-slate-700">{uniqueCode}</span></p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center relative shadow-inner">
            <h3 className="font-bold text-slate-700 mb-4">Scan QRIS</h3>
            <div className="w-full flex justify-center mb-4 relative overflow-hidden">
              <div className="bg-white p-4 rounded-xl shadow-md border border-slate-200 w-max">
                {STATIC_QRIS ? (
                  <QRCodeCanvas 
                    id="qris-canvas"
                    value={generateDynamicQRIS(STATIC_QRIS, nominalValue)} 
                    size={220} 
                    level={"H"} 
                    imageSettings={{
                      src: "/logo.png",
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }} 
                  />
                ) : (
                  <div className="w-[220px] h-[220px] bg-slate-100 flex items-center justify-center text-slate-400 text-sm text-center p-4">
                    QRIS belum dikonfigurasi oleh Admin.
                  </div>
                )}
              </div>
            </div>
            
            {STATIC_QRIS && (
              <button 
                onClick={downloadQRIS}
                className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors mb-2"
              >
                <Download className="w-4 h-4" /> Download QRIS
              </button>
            )}

            <p className="text-xs text-slate-500 mt-2 text-center max-w-[250px]">Scan QR code ini menggunakan aplikasi M-Banking atau e-Wallet kesayangan Anda.</p>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-indigo-800 text-sm flex gap-3 mt-6">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>Setelah melakukan transfer/scan QRIS, silakan klik tombol di bawah agar Wakaf diverifikasi oleh Admin.</p>
          </div>

          <button 
            onClick={selesaikanDonasi}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 mt-4 text-lg"
          >
            Selesai & Konfirmasi
          </button>
        </div>
      </div>
    );
  }

  if (step === 'input') {
    return (
      <div className="pb-24 bg-slate-50 min-h-screen">
        <div className="bg-white px-4 pt-6 pb-4 border-b border-slate-200 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setStep('detail')} className="p-2 -ml-2 text-slate-600 rounded-full hover:bg-slate-100"><ChevronLeft className="w-6 h-6" /></button>
          <h1 className="font-bold text-lg text-slate-800">Masukkan Nominal Wakaf</h1>
        </div>

        <div className="p-4 space-y-6 animate-in slide-in-from-bottom-4">
          {/* Info Program */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-4 shadow-sm">
            <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
              {program.urlGambar ? (
                <img src={program.urlGambar} alt={program.judul} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><Heart className="w-6 h-6 text-slate-300" /></div>
              )}
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-xs text-slate-500 font-medium">Anda berdonasi untuk:</p>
              <h3 className="font-bold text-slate-800 leading-tight line-clamp-2 mt-0.5">{program.judul}</h3>
            </div>
          </div>

          {/* Input Nominal */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-3">Nominal Wakaf</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-800">Rp</span>
                <input 
                  type="text" 
                  value={nominalStr}
                  onChange={handleNominalChange}
                  className="w-full pl-12 pr-4 py-4 text-2xl font-black text-slate-800 rounded-xl border-2 border-slate-200 outline-none focus:border-emerald-500 transition-colors"
                  placeholder="0"
                  maxLength={21} // Allows up to trillions with formatting
                />
              </div>
              {nominalValue > 0 && nominalValue < 5000 && (
                <p className="text-rose-500 text-xs mt-2 font-medium">Minimal Wakaf Rp 5.000</p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[100000, 200000, 500000, 1000000, 2000000, 5000000].map(val => (
                <button 
                  key={val}
                  onClick={() => handleQuickNominal(val)}
                  className="py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                >
                  {val >= 1000000 ? `${val / 1000000}jt` : `${val / 1000}rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Profil Muwaqqif */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-700">Profil Muwaqqif</h3>
            
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-xl bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                  {isAnonim ? 'HA' : namaSantri.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{isAnonim ? 'Hamba Allah' : namaSantri}</p>
                </div>
              </div>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input type="checkbox" className="sr-only" checked={isAnonim} onChange={e => setIsAnonim(e.target.checked)} />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${isAnonim ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isAnonim ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </label>
            </div>
            <p className="text-xs text-slate-500 text-right mt-1">Sembunyikan nama (Anonim)</p>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 mt-4">Doa & Harapannya (Opsional)</label>
              <textarea 
                rows={3} 
                value={doa}
                onChange={e => setDoa(e.target.value)}
                placeholder="Tulis Doa & Harapannya di sini..."
                className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-emerald-500 resize-none text-sm"
              />
            </div>
          </div>

        </div>

        {/* Floating Action */}
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-slate-200 z-20">
          <button 
            onClick={lanjutPembayaran}
            disabled={loading || nominalValue < 5000}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg disabled:opacity-50 text-lg flex items-center justify-center gap-2"
          >
            Bismillah, Lanjutkan Wakaf
          </button>
        </div>
      </div>
    );
  }

  // Step DETAIL
  return (
    <div className="pb-24 bg-slate-50 min-h-screen">
      <div className="absolute top-0 left-0 right-0 h-[280px] bg-slate-200">
        {program.urlGambar ? (
          <img src={program.urlGambar} alt={program.judul} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-300">
            <Heart className="w-16 h-16 text-slate-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <button onClick={() => router.back()} className="absolute top-6 left-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/40 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="pt-[240px] px-4 relative z-10">
        <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100">
          <h1 className="text-xl font-black text-slate-800 leading-tight mb-4">{program.judul}</h1>
          
          <div className="space-y-1 mb-4">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-black text-emerald-600">{formatRp(program.terkumpul)}</span>
            </div>
            <p className="text-sm text-slate-500 font-medium">terkumpul {program.targetNominal > 0 && `dari target ${formatRp(program.targetNominal)}`}</p>
          </div>

          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-5">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex gap-2 mb-6">
            <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Terverifikasi
            </div>
            {!program.isAktif && (
              <div className="bg-rose-50 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
                Wakaf Ditutup
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="font-bold text-slate-800 mb-3 text-sm">Cerita & Detail Program</h3>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">{program.deskripsi}</p>
          </div>

          <div className="border-t border-slate-100 pt-6 mt-6">
            <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center justify-between">
              Tulis Doa & Harapannya di sini
              <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs">{donaturs.length} Muwaqqif</span>
            </h3>

            {donaturs.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl">Jadilah yang pertama berdonasi untuk program ini.</p>
            ) : (
              <div className="space-y-4">
                {donaturs.map((d, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                      {d.isAnonim ? <Heart className="w-4 h-4 text-slate-400" /> : <span className="font-bold text-slate-500 text-sm">{d.namaSantri.charAt(0)}</span>}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{d.isAnonim ? 'Hamba Allah' : d.namaSantri}</p>
                      <p className="text-xs font-bold text-emerald-600 mb-1">Berdonasi {formatRp(d.nominal)}</p>
                      {d.doa && <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic">"{d.doa}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto p-4 bg-white border-t border-slate-200 z-20 flex gap-3">
        <button className="p-4 rounded-xl border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0">
          <Share2 className="w-5 h-5" />
        </button>
        <button 
          onClick={startDonasi}
          disabled={!program.isAktif}
          className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:bg-slate-400 text-lg flex items-center justify-center gap-2"
        >
          {program.isAktif ? 'Wakaf Sekarang' : 'Wakaf Ditutup'}
        </button>
      </div>
    </div>
  );
}


"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Wallet, History, CreditCard, ChevronRight, CheckCircle2, Clock, XCircle, Plus, QrCode, Building, AlertCircle, Download, CheckSquare } from "lucide-react";
import { submitPendingUnifiedPayment } from "./actions";
import { showSuccess, showError } from "@/lib/sweetalert";
import { formatRp } from "@/lib/utils";
import { QRCodeCanvas } from "qrcode.react";
import { generateDynamicQRIS, STATIC_QRIS } from "@/lib/qris";

export function KeuanganOrtuClient({ data }: { data: any }) {
  const [activeTab, setActiveTab] = useState<'kas' | 'topup'>('kas');
  
  // State Modal Gateway
  const [isGatewayOpen, setIsGatewayOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'qris' | 'va' | null>(null);

  // Unified selections
  const [payTabungan, setPayTabungan] = useState(false);
  const [topupInput, setTopupInput] = useState<string>("");
  const [payKas, setPayKas] = useState(false);
  const [payInfaq, setPayInfaq] = useState(false);

  const [uniqueCode, setUniqueCode] = useState<number>(0);
  const [baseNominal, setBaseNominal] = useState<number>(0);
  const [totalNominal, setTotalNominal] = useState<number>(0);
  const [buktiFile, setBuktiFile] = useState<File | null>(null);

  // Countdown state
  const [timeLeft, setTimeLeft] = useState<number>(3600); // 60 minutes in seconds

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (paymentMethod === 'qris' || paymentMethod === 'va') {
      timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else {
      setTimeLeft(3600);
    }
    return () => clearInterval(timer);
  }, [paymentMethod]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const currentDay = currentDate.getDate();

  const isKasLate = data.nextTahunKas < currentYear || (data.nextTahunKas === currentYear && data.nextBulanKas <= currentMonth);
  const isInfaqLate = data.nextTahunInfaq < currentYear || (data.nextTahunInfaq === currentYear && data.nextBulanInfaq <= currentMonth);
  
  const showKas = isKasLate || currentDay >= 26;
  const showInfaq = isInfaqLate || currentDay >= 26;

  const handleOpenUnified = () => {
    setPayTabungan(false);
    setTopupInput("");
    setPayKas(showKas ? isKasLate : false);
    setPayInfaq(showInfaq ? isInfaqLate : false);
    setPaymentMethod(null);
    setBuktiFile(null);
    setUniqueCode(Math.floor(Math.random() * (300 - 10 + 1)) + 10);
    setIsGatewayOpen(true);
  };

  // Update nominal when checkboxes change
  useEffect(() => {
    let base = 0;
    if (payKas) base += data.tagihanKas;
    if (payInfaq) base += data.tagihanInfaq;
    if (payTabungan && topupInput) {
       const num = Number(topupInput);
       if (!isNaN(num)) base += num;
    }
    setBaseNominal(base);
    setTotalNominal(base + uniqueCode);
  }, [payKas, payInfaq, payTabungan, topupInput, data, uniqueCode]);

  const handleSimulatePayment = () => {
    if (timeLeft === 0) {
      showError("Waktu Habis", "Waktu pembayaran telah habis, silakan ulangi.");
      return;
    }

    if (!buktiFile) {
      showError("Gagal", "Harap unggah bukti transfer terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      try {
        const tabunganNominal = (payTabungan && topupInput) ? Number(topupInput) : 0;
        const kasNominal = payKas ? data.tagihanKas : 0;
        const infaqNominal = payInfaq ? data.tagihanInfaq : 0;

        const formData = new FormData();
        formData.append("tabunganNominal", tabunganNominal.toString());
        formData.append("kasNominal", kasNominal.toString());
        formData.append("infaqNominal", infaqNominal.toString());
        formData.append("bulanKas", data.nextBulanKas.toString());
        formData.append("tahunKas", data.nextTahunKas.toString());
        formData.append("bulanInfaq", data.nextBulanInfaq.toString());
        formData.append("tahunInfaq", data.nextTahunInfaq.toString());
        formData.append("metode", paymentMethod === 'qris' ? 'QRIS' : 'Transfer Bank');
        formData.append("angkaUnik", uniqueCode.toString());
        formData.append("buktiFile", buktiFile);

        await submitPendingUnifiedPayment(formData);
        
        showSuccess("Pembayaran Diajukan!", "Bukti transfer akan diverifikasi oleh Admin. Saldo dan status tagihan akan terupdate setelah diverifikasi.");
        setIsGatewayOpen(false);
      } catch (err: any) {
        showError("Gagal", err.message || "Gagal memproses pembayaran");
      }
    });
  };

  const handleSelectPaymentMethod = (method: 'qris' | 'va') => {
    if (!payKas && !payInfaq && !payTabungan) {
      showError("Gagal", "Pilih minimal satu item untuk dibayar.");
      return;
    }
    if (payTabungan) {
      const numInput = Number(topupInput);
      if (!topupInput || numInput < 5000) {
        showError("Gagal", "Minimal nominal top-up Rp 5.000");
        return;
      }
    }
    setPaymentMethod(method);
    setTimeLeft(3600);
  };

  const downloadQRIS = () => {
    const canvas = document.getElementById("qris-canvas") as HTMLCanvasElement;
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `QRIS_RQM_Rp${totalNominal}.png`;
      a.click();
      showSuccess("Berhasil", "QRIS berhasil didownload ke perangkat Anda.");
    } else {
      showError("Gagal", "QR Code belum siap.");
    }
  };

  const combinedRiwayatKas = [...(data.riwayatKas || []), ...(data.riwayatInfaq || [])].sort((a: any, b: any) => {
    if (a.tahun !== b.tahun) return b.tahun - a.tahun;
    return b.bulan - a.bulan;
  });
  const displayRiwayatKas = combinedRiwayatKas.slice(0, 5);
  const displayRiwayatTopup = data.topupHistory.filter((t: any) => t.jenisPembayaran === 'tabungan' || !t.jenisPembayaran).slice(0, 5);

  const formatBulanTahun = (bulan: number, tahun: number) => {
    if (!bulan || !tahun) return "";
    const d = new Date();
    d.setMonth(bulan - 1);
    d.setFullYear(tahun);
    return format(d, 'MMMM yyyy', { locale: id });
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[var(--bg-canvas)] pb-20">
      <div className="sticky top-0 z-30 bg-[var(--bg-canvas)] pb-2 shadow-sm rounded-b-3xl">
        {/* Header Profile / Saldo */}
        <div className="bg-[var(--primary-accent)] rounded-b-3xl p-5 shadow-md text-white relative z-20">
          <h1 className="text-xl font-bold mb-4">Keuangan & Tabungan</h1>
          
          <div className="bg-[var(--primary-accent)]/50 backdrop-blur-md border border-emerald-400 p-5 rounded-[var(--radius-card)] shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Wallet className="w-20 h-20" />
            </div>
            <div className="relative z-10">
              <p className="text-[var(--primary-accent)] font-medium mb-1 text-sm">Total Saldo Tabungan</p>
              <h2 className="text-3xl font-bold tracking-tight">{formatRp(data.saldo)}</h2>
              
              <div className="mt-4 flex gap-3">
                <button 
                  onClick={handleOpenUnified}
                  className="flex-1 bg-[var(--bg-surface)] text-[var(--primary-accent)] py-2.5 rounded-[var(--radius-card)] font-bold flex items-center justify-center gap-2 hover:bg-[var(--primary-accent)]/5 transition-colors shadow-sm text-sm"
                >
                  <Plus className="w-4 h-4" /> Infaq Bulanan, Kas & Tabungan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 px-6">
          <div className="flex bg-[var(--bg-canvas)]/50 p-1 rounded-[var(--radius-card)]">
            <button 
              onClick={() => setActiveTab('kas')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'kas' ? 'bg-[var(--bg-surface)] text-[var(--primary-accent)] shadow-sm' : 'text-[var(--text-mute)]'}`}
            >
              Infaq & Kas
            </button>
            <button 
              onClick={() => setActiveTab('topup')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'topup' ? 'bg-[var(--bg-surface)] text-[var(--primary-accent)] shadow-sm' : 'text-[var(--text-mute)]'}`}
            >
              Riwayat Top-up Tabungan
            </button>
          </div>
        </div>
      </div>

      {/* Kas Content */}
      {activeTab === 'kas' && (
        <div className="mt-6 px-6 space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
          <h3 className="font-bold text-[var(--text-ink)] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[var(--primary-accent)]" /> Riwayat Infaq & Kas Terakhir
          </h3>
          <div className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] shadow-sm border border-[var(--border-line)] divide-y divide-slate-100">
            {displayRiwayatKas.length > 0 ? displayRiwayatKas.map((item: any) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-canvas)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--primary-accent)]/10 flex items-center justify-center text-[var(--primary-accent)] border border-teal-100 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-[var(--text-ink)] capitalize">{item.jenis} - Bulan {item.bulan} {item.tahun}</p>
                    <p className="text-xs text-[var(--text-ash)]">{format(new Date(item.tanggalBayar), 'dd MMM yyyy')}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[var(--text-ink)]">{formatRp(item.nominal)}</p>
                  <p className="text-[10px] font-bold text-[var(--primary-accent)] uppercase tracking-wider bg-[var(--primary-accent)]/5 px-2 py-0.5 rounded inline-block mt-1">LUNAS</p>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-[var(--text-ash)] text-sm">Belum ada histori pembayaran infaq & kas</div>
            )}
          </div>
        </div>
      )}

      {/* Topup Content */}
      {activeTab === 'topup' && (
        <div className="mt-6 px-6 space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
          <h3 className="font-bold text-[var(--text-ink)] flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--primary-accent)]" /> Riwayat Top-up Tabungan Terakhir
          </h3>
          <div className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] shadow-sm border border-[var(--border-line)] divide-y divide-slate-100">
            {displayRiwayatTopup.length > 0 ? displayRiwayatTopup.map((item: any) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-[var(--bg-canvas)] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-canvas)] flex items-center justify-center text-[var(--text-mute)] border border-[var(--border-line)] shrink-0">
                    {item.status === 'pending' && <Clock className="w-5 h-5 text-[#f5c542]" />}
                    {item.status === 'berhasil' && <CheckCircle2 className="w-5 h-5 text-[var(--primary-accent)]" />}
                    {item.status === 'gagal' && <XCircle className="w-5 h-5 text-rose-500" />}
                  </div>
                  <div>
                    <p className="font-bold text-[var(--text-ink)] text-sm">Top-Up Tabungan</p>
                    <p className="text-xs text-[var(--text-mute)]">Metode: {item.metode}</p>
                    <p className="text-xs text-[var(--text-ash)]">{format(new Date(item.tanggalAjuan), 'dd MMM yyyy, HH:mm')}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[var(--text-ink)]">{formatRp(item.nominal - (item.angkaUnik || 0))}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block mt-1 ${
                    item.status === 'pending' ? 'bg-[#f5c542]/10 text-orange-600' :
                    item.status === 'berhasil' ? 'bg-[var(--primary-accent)]/5 text-[var(--primary-accent)]' :
                    'bg-rose-50 text-[#e54d2e]'
                  }`}>
                    {item.status}
                  </p>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-[var(--text-ash)] text-sm">Belum ada histori top-up tabungan</div>
            )}
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {isGatewayOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--primary-accent)]/60 backdrop-blur-sm sm:items-center p-0 sm:p-4">
          <div className="bg-[var(--bg-surface)] w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 flex flex-col max-h-[85svh]">
            
            <div className="p-5 border-b border-[var(--border-line)] flex justify-between items-center bg-[var(--primary-accent)] text-white shrink-0">
              <div>
                <h2 className="text-lg font-bold">Checkout Pembayaran</h2>
                <p className="text-xs text-[var(--text-ash)] mt-0.5 capitalize">Pilih Item Pembayaran</p>
              </div>
              <button 
                onClick={() => {
                  setIsGatewayOpen(false);
                  setPaymentMethod(null);
                }} 
                disabled={isPending}
                className="w-8 h-8 flex items-center justify-center bg-[var(--bg-surface)]/10 rounded-full hover:bg-[var(--bg-surface)]/20 transition-colors"
              >
                <span className="text-xl leading-none -mt-0.5">&times;</span>
              </button>
            </div>

            <div className="p-6 pb-24 overflow-y-auto">
              {!paymentMethod ? (
                // Pilih Item & Metode Pembayaran
                <div className="space-y-6">
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-[var(--text-ink)]">Pilih Item yang Dibayar</label>
                    <div className="space-y-3">
                      {showKas && (
                        <label className={`flex items-center justify-between p-4 rounded-[var(--radius-card)] border cursor-pointer transition-colors ${payKas ? 'border-emerald-500 bg-[var(--primary-accent)]/5/50' : 'border-[var(--border-line)] hover:bg-[var(--bg-canvas)]'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${payKas ? 'bg-[var(--primary-accent)] border-emerald-500' : 'border-slate-300'}`}>
                              {payKas && <CheckSquare className="w-4 h-4 text-white" />}
                            </div>
                            <div>
                              <p className="font-bold text-[var(--text-ink)]">Iuran Kas</p>
                              <p className="text-xs text-[#f5c542] font-medium">Iuran bulan {formatBulanTahun(data.nextBulanKas, data.nextTahunKas)}</p>
                            </div>
                          </div>
                          <span className="font-bold text-[var(--text-ink)]">{formatRp(data.tagihanKas)}</span>
                          <input type="checkbox" className="hidden" checked={payKas} onChange={(e) => setPayKas(e.target.checked)} />
                        </label>
                      )}
                      
                      {showInfaq && (
                        <label className={`flex items-center justify-between p-4 rounded-[var(--radius-card)] border cursor-pointer transition-colors ${payInfaq ? 'border-emerald-500 bg-[var(--primary-accent)]/5/50' : 'border-[var(--border-line)] hover:bg-[var(--bg-canvas)]'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${payInfaq ? 'bg-[var(--primary-accent)] border-emerald-500' : 'border-slate-300'}`}>
                              {payInfaq && <CheckSquare className="w-4 h-4 text-white" />}
                            </div>
                            <div>
                              <p className="font-bold text-[var(--text-ink)]">Infaq Bulanan</p>
                              <p className="text-xs text-[#f5c542] font-medium">Infaq bulan {formatBulanTahun(data.nextBulanInfaq, data.nextTahunInfaq)}</p>
                            </div>
                          </div>
                          <span className="font-bold text-[var(--text-ink)]">{formatRp(data.tagihanInfaq)}</span>
                          <input type="checkbox" className="hidden" checked={payInfaq} onChange={(e) => setPayInfaq(e.target.checked)} />
                        </label>
                      )}

                      <div className={`p-4 rounded-[var(--radius-card)] border transition-colors ${payTabungan ? 'border-emerald-500 bg-[var(--primary-accent)]/5/50' : 'border-[var(--border-line)] hover:bg-[var(--bg-canvas)]'}`}>
                        <label className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${payTabungan ? 'bg-[var(--primary-accent)] border-emerald-500' : 'border-slate-300'}`}>
                              {payTabungan && <CheckSquare className="w-4 h-4 text-white" />}
                            </div>
                            <div>
                              <p className="font-bold text-[var(--text-ink)]">Top-Up Tabungan</p>
                              <p className="text-xs text-[var(--text-mute)]">Isi saldo mandiri</p>
                            </div>
                          </div>
                          <input type="checkbox" className="hidden" checked={payTabungan} onChange={(e) => setPayTabungan(e.target.checked)} />
                        </label>
                        {payTabungan && (
                          <div className="mt-4 relative animate-in fade-in slide-in-from-top-2">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-mute)] font-bold">Rp</span>
                            <input 
                              type="number"
                              value={topupInput}
                              onChange={(e) => setTopupInput(e.target.value)}
                              placeholder="Min. 5000"
                              className="w-full pl-12 pr-4 py-3 bg-[var(--bg-surface)] rounded-[var(--radius-card)] border border-[var(--border-line)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-lg font-bold transition-all outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-[var(--primary-accent)] p-4 rounded-[var(--radius-card)] border border-slate-800 flex justify-between items-center mt-2 shadow-xl shadow-slate-900/10">
                      <span className="text-slate-300 font-medium text-sm">Total Tagihan</span>
                      <span className="text-2xl font-bold text-white">{formatRp(baseNominal)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-ink)] mb-3">Pilih Metode Pembayaran</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={() => handleSelectPaymentMethod('qris')}
                        className="w-full p-4 rounded-[var(--radius-card)] border border-[var(--border-line)] hover:border-indigo-500 hover:bg-[#667cdc]/10 flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600">
                            <QrCode className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-[var(--text-ink)] group-hover:text-indigo-700">QRIS</p>
                            <p className="text-xs text-[var(--text-mute)]">Scan via GoPay, OVO, Dana, M-Banking</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--text-ash)] group-hover:text-[#667cdc]" />
                      </button>

                      <button 
                        onClick={() => handleSelectPaymentMethod('va')}
                        className="w-full p-4 rounded-[var(--radius-card)] border border-[var(--border-line)] hover:border-emerald-500 hover:bg-[var(--primary-accent)]/5 flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-[var(--primary-accent)]/10 p-2.5 rounded-lg text-[var(--primary-accent)]">
                            <Building className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-[var(--text-ink)] group-hover:text-[var(--primary-accent)]">Transfer Bank</p>
                            <p className="text-xs text-[var(--text-mute)]">Bank Central Asia (BCA)</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[var(--text-ash)] group-hover:text-[var(--primary-accent)]" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Tampilan Instruksi Pembayaran (QRIS / VA)
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center justify-between mb-1">
                      <button onClick={() => setPaymentMethod(null)} className="text-[var(--text-ash)] hover:text-[var(--text-ink)] font-medium text-sm flex items-center">
                        <ChevronRight className="w-4 h-4 rotate-180" /> Kembali
                      </button>
                      <div className="text-[#e54d2e] font-bold bg-rose-50 px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[var(--text-mute)] font-medium mb-0.5 text-sm">Total Pembayaran</p>
                      <h3 className="text-3xl font-black text-[var(--primary-accent)]">
                        {formatRp(totalNominal)}
                      </h3>
                      <p className="text-[11px] text-[var(--text-mute)] mt-1 bg-[var(--bg-muted)] px-3 py-1 rounded-lg inline-block">Termasuk angka unik: <span className="font-bold text-[var(--text-ink)]">{uniqueCode}</span></p>
                    </div>

                    {paymentMethod === 'qris' && (
                      <div className="bg-[var(--bg-canvas)] p-4 rounded-[var(--radius-card)] border border-[var(--border-line)] flex flex-col items-center justify-center relative">
                        <div className="w-full flex justify-center mb-3 relative overflow-hidden">
                          <div className="bg-[var(--bg-surface)] p-3 rounded-[var(--radius-card)] shadow-sm border border-[var(--border-line)] w-max">
                            <QRCodeCanvas 
                              id="qris-canvas"
                              value={generateDynamicQRIS(STATIC_QRIS, totalNominal)} 
                              size={200} 
                              level={"H"} 
                              imageSettings={{
                                src: "/logo.png",
                                x: undefined,
                                y: undefined,
                                height: 32,
                                width: 32,
                                excavate: true,
                              }} 
                            />
                          </div>
                        </div>
                        
                        <button 
                          onClick={downloadQRIS}
                          className="flex items-center gap-2 text-indigo-600 font-bold bg-[#667cdc]/10 hover:bg-indigo-100 px-4 py-2 rounded-lg transition-colors mb-2 text-sm"
                        >
                          <Download className="w-4 h-4" /> Download QRIS
                        </button>

                        <p className="text-[10px] text-[var(--text-mute)] text-center leading-tight max-w-[200px]">Scan QR code menggunakan aplikasi M-Banking atau e-Wallet kesayangan Anda.</p>
                      </div>
                    )}

                  {paymentMethod === 'va' && (
                    <div className="bg-[var(--bg-canvas)] p-6 rounded-[var(--radius-card)] border border-[var(--border-line)] space-y-4">
                      <div>
                        <p className="text-xs text-[var(--text-mute)] font-medium mb-1">Bank Tujuan</p>
                        <p className="font-bold text-[var(--primary-accent)] flex items-center gap-2">
                          <Building className="w-4 h-4" /> Bank Central Asia (BCA)
                        </p>
                      </div>
                      <div className="h-px bg-[var(--bg-canvas)] w-full" />
                      <div>
                        <p className="text-xs text-[var(--text-mute)] font-medium mb-1">Nomor Rekening</p>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-2xl tracking-widest text-[var(--text-ink)]">148 125 4359</p>
                        </div>
                      </div>
                      <div className="h-px bg-[var(--bg-canvas)] w-full" />
                      <ul className="text-xs text-[var(--text-mute)] list-disc pl-4 space-y-1">
                        <li>Pilih menu Transfer Antar Rekening BCA.</li>
                        <li>Masukkan nomor rekening di atas.</li>
                        <li>Pastikan atas nama <span className="font-bold">Ayi H Mardiansyah</span>.</li>
                        <li>Pastikan transfer <span className="font-bold text-rose-500">TEPAT</span> sesuai nominal hingga digit terakhir (<span className="font-bold">{uniqueCode}</span>).</li>
                      </ul>
                    </div>
                  )}

                    <div className="mt-4 p-4 bg-[var(--bg-surface)] border border-[var(--border-line)] rounded-[var(--radius-card)] space-y-3">
                      <label className="text-sm font-semibold text-[var(--text-ink)] block">Unggah Bukti Transfer <span className="text-rose-500">*</span></label>
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setBuktiFile(e.target.files[0]);
                          } else {
                            setBuktiFile(null);
                          }
                        }}
                        className="w-full text-sm text-[var(--text-mute)] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary-accent)]/5 file:text-[var(--primary-accent)] hover:file:bg-[var(--primary-accent)]/10"
                      />
                      {buktiFile && (
                        <p className="text-xs text-[var(--primary-accent)] font-medium break-all">
                          Terpilih: {buktiFile.name}
                        </p>
                      )}
                    </div>

                    <div className="bg-[#667cdc]/10 border border-[#667cdc]/20 p-3 rounded-[var(--radius-card)] text-[#667cdc] text-[11px] flex gap-2 mt-4 leading-tight">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>Setelah transfer/scan QRIS dan mengunggah bukti, klik tombol di bawah agar diverifikasi Admin.</p>
                    </div>

                    <button 
                      onClick={handleSimulatePayment}
                      disabled={isPending || timeLeft === 0 || !buktiFile}
                      className="w-full py-3 bg-[var(--primary-accent)] text-white rounded-[var(--radius-card)] font-bold hover:bg-[var(--primary-accent-hover)] transition-all shadow-lg shadow-lg shadow-[var(--primary-accent)]/20 disabled:opacity-50 mt-3 text-sm flex items-center justify-center"
                    >
                      {isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          Memproses...
                        </>
                      ) : "Selesai & Konfirmasi"}
                    </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

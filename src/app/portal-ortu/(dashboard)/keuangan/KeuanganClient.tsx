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
    <div className="max-w-md mx-auto min-h-screen bg-[#0f0f0f] pb-20">
      <div className="sticky top-0 z-30 bg-[#0f0f0f] pb-2 shadow-sm rounded-b-3xl">
        {/* Header Profile / Saldo */}
        <div className="bg-[#3ecf8e] rounded-b-3xl p-5 shadow-md text-white relative z-20">
          <h1 className="text-xl font-bold mb-4">Keuangan & Tabungan</h1>
          
          <div className="bg-[#3ecf8e]/50 backdrop-blur-md border border-emerald-400 p-5 rounded-[8px] shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20">
              <Wallet className="w-20 h-20" />
            </div>
            <div className="relative z-10">
              <p className="text-[#3ecf8e] font-medium mb-1 text-sm">Total Saldo Tabungan</p>
              <h2 className="text-3xl font-bold tracking-tight">{formatRp(data.saldo)}</h2>
              
              <div className="mt-4 flex gap-3">
                <button 
                  onClick={handleOpenUnified}
                  className="flex-1 bg-[#171717] text-[#3ecf8e] py-2.5 rounded-[8px] font-bold flex items-center justify-center gap-2 hover:bg-[#3ecf8e]/5 transition-colors shadow-sm text-sm"
                >
                  <Plus className="w-4 h-4" /> Infaq Bulanan, Kas & Tabungan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 px-6">
          <div className="flex bg-[#0f0f0f]/50 p-1 rounded-[8px]">
            <button 
              onClick={() => setActiveTab('kas')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'kas' ? 'bg-[#171717] text-[#3ecf8e] shadow-sm' : 'text-[#b4b4b4]'}`}
            >
              Infaq & Kas
            </button>
            <button 
              onClick={() => setActiveTab('topup')}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'topup' ? 'bg-[#171717] text-[#3ecf8e] shadow-sm' : 'text-[#b4b4b4]'}`}
            >
              Riwayat Top-up Tabungan
            </button>
          </div>
        </div>
      </div>

      {/* Kas Content */}
      {activeTab === 'kas' && (
        <div className="mt-6 px-6 space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
          <h3 className="font-bold text-[#fafafa] flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#3ecf8e]" /> Riwayat Infaq & Kas Terakhir
          </h3>
          <div className="bg-[#171717] rounded-[8px] shadow-sm border border-[#2e2e2e] divide-y divide-slate-100">
            {displayRiwayatKas.length > 0 ? displayRiwayatKas.map((item: any) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-[#0f0f0f] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#3ecf8e]/10 flex items-center justify-center text-[#3ecf8e] border border-teal-100 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-[#fafafa] capitalize">{item.jenis} - Bulan {item.bulan} {item.tahun}</p>
                    <p className="text-xs text-[#898989]">{format(new Date(item.tanggalBayar), 'dd MMM yyyy')}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#fafafa]">{formatRp(item.nominal)}</p>
                  <p className="text-[10px] font-bold text-[#3ecf8e] uppercase tracking-wider bg-[#3ecf8e]/5 px-2 py-0.5 rounded inline-block mt-1">LUNAS</p>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-[#898989] text-sm">Belum ada histori pembayaran infaq & kas</div>
            )}
          </div>
        </div>
      )}

      {/* Topup Content */}
      {activeTab === 'topup' && (
        <div className="mt-6 px-6 space-y-4 animate-in slide-in-from-left-4 fade-in duration-300">
          <h3 className="font-bold text-[#fafafa] flex items-center gap-2">
            <History className="w-5 h-5 text-[#3ecf8e]" /> Riwayat Top-up Tabungan Terakhir
          </h3>
          <div className="bg-[#171717] rounded-[8px] shadow-sm border border-[#2e2e2e] divide-y divide-slate-100">
            {displayRiwayatTopup.length > 0 ? displayRiwayatTopup.map((item: any) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-[#0f0f0f] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#0f0f0f] flex items-center justify-center text-[#b4b4b4] border border-[#2e2e2e] shrink-0">
                    {item.status === 'pending' && <Clock className="w-5 h-5 text-[#f5c542]" />}
                    {item.status === 'berhasil' && <CheckCircle2 className="w-5 h-5 text-[#3ecf8e]" />}
                    {item.status === 'gagal' && <XCircle className="w-5 h-5 text-rose-500" />}
                  </div>
                  <div>
                    <p className="font-bold text-[#fafafa] text-sm">Top-Up Tabungan</p>
                    <p className="text-xs text-[#b4b4b4]">Metode: {item.metode}</p>
                    <p className="text-xs text-[#898989]">{format(new Date(item.tanggalAjuan), 'dd MMM yyyy, HH:mm')}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#fafafa]">{formatRp(item.nominal - (item.angkaUnik || 0))}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block mt-1 ${
                    item.status === 'pending' ? 'bg-[#f5c542]/10 text-orange-600' :
                    item.status === 'berhasil' ? 'bg-[#3ecf8e]/5 text-[#3ecf8e]' :
                    'bg-rose-50 text-[#e54d2e]'
                  }`}>
                    {item.status}
                  </p>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-[#898989] text-sm">Belum ada histori top-up tabungan</div>
            )}
          </div>
        </div>
      )}

      {/* Payment Gateway Modal */}
      {isGatewayOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#3ecf8e]/60 backdrop-blur-sm sm:items-center p-0 sm:p-4">
          <div className="bg-[#171717] w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 flex flex-col max-h-[85svh]">
            
            <div className="p-5 border-b border-[#2e2e2e] flex justify-between items-center bg-[#3ecf8e] text-white shrink-0">
              <div>
                <h2 className="text-lg font-bold">Checkout Pembayaran</h2>
                <p className="text-xs text-[#898989] mt-0.5 capitalize">Pilih Item Pembayaran</p>
              </div>
              <button 
                onClick={() => {
                  setIsGatewayOpen(false);
                  setPaymentMethod(null);
                }} 
                disabled={isPending}
                className="w-8 h-8 flex items-center justify-center bg-[#171717]/10 rounded-full hover:bg-[#171717]/20 transition-colors"
              >
                <span className="text-xl leading-none -mt-0.5">&times;</span>
              </button>
            </div>

            <div className="p-6 pb-24 overflow-y-auto">
              {!paymentMethod ? (
                // Pilih Item & Metode Pembayaran
                <div className="space-y-6">
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-[#fafafa]">Pilih Item yang Dibayar</label>
                    <div className="space-y-3">
                      {showKas && (
                        <label className={`flex items-center justify-between p-4 rounded-[8px] border cursor-pointer transition-colors ${payKas ? 'border-emerald-500 bg-[#3ecf8e]/5/50' : 'border-[#2e2e2e] hover:bg-[#0f0f0f]'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${payKas ? 'bg-[#3ecf8e] border-emerald-500' : 'border-slate-300'}`}>
                              {payKas && <CheckSquare className="w-4 h-4 text-white" />}
                            </div>
                            <div>
                              <p className="font-bold text-[#fafafa]">Iuran Kas</p>
                              <p className="text-xs text-[#f5c542] font-medium">Iuran bulan {formatBulanTahun(data.nextBulanKas, data.nextTahunKas)}</p>
                            </div>
                          </div>
                          <span className="font-bold text-[#fafafa]">{formatRp(data.tagihanKas)}</span>
                          <input type="checkbox" className="hidden" checked={payKas} onChange={(e) => setPayKas(e.target.checked)} />
                        </label>
                      )}
                      
                      {showInfaq && (
                        <label className={`flex items-center justify-between p-4 rounded-[8px] border cursor-pointer transition-colors ${payInfaq ? 'border-emerald-500 bg-[#3ecf8e]/5/50' : 'border-[#2e2e2e] hover:bg-[#0f0f0f]'}`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${payInfaq ? 'bg-[#3ecf8e] border-emerald-500' : 'border-slate-300'}`}>
                              {payInfaq && <CheckSquare className="w-4 h-4 text-white" />}
                            </div>
                            <div>
                              <p className="font-bold text-[#fafafa]">Infaq Bulanan</p>
                              <p className="text-xs text-[#f5c542] font-medium">Infaq bulan {formatBulanTahun(data.nextBulanInfaq, data.nextTahunInfaq)}</p>
                            </div>
                          </div>
                          <span className="font-bold text-[#fafafa]">{formatRp(data.tagihanInfaq)}</span>
                          <input type="checkbox" className="hidden" checked={payInfaq} onChange={(e) => setPayInfaq(e.target.checked)} />
                        </label>
                      )}

                      <div className={`p-4 rounded-[8px] border transition-colors ${payTabungan ? 'border-emerald-500 bg-[#3ecf8e]/5/50' : 'border-[#2e2e2e] hover:bg-[#0f0f0f]'}`}>
                        <label className="flex items-center justify-between cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${payTabungan ? 'bg-[#3ecf8e] border-emerald-500' : 'border-slate-300'}`}>
                              {payTabungan && <CheckSquare className="w-4 h-4 text-white" />}
                            </div>
                            <div>
                              <p className="font-bold text-[#fafafa]">Top-Up Tabungan</p>
                              <p className="text-xs text-[#b4b4b4]">Isi saldo mandiri</p>
                            </div>
                          </div>
                          <input type="checkbox" className="hidden" checked={payTabungan} onChange={(e) => setPayTabungan(e.target.checked)} />
                        </label>
                        {payTabungan && (
                          <div className="mt-4 relative animate-in fade-in slide-in-from-top-2">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b4b4b4] font-bold">Rp</span>
                            <input 
                              type="number"
                              value={topupInput}
                              onChange={(e) => setTopupInput(e.target.value)}
                              placeholder="Min. 5000"
                              className="w-full pl-12 pr-4 py-3 bg-[#171717] rounded-[8px] border border-[#2e2e2e] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-lg font-bold transition-all outline-none"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-[#3ecf8e] p-4 rounded-[8px] border border-slate-800 flex justify-between items-center mt-2 shadow-xl shadow-slate-900/10">
                      <span className="text-slate-300 font-medium text-sm">Total Tagihan</span>
                      <span className="text-2xl font-bold text-white">{formatRp(baseNominal)}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#fafafa] mb-3">Pilih Metode Pembayaran</h3>
                    <div className="space-y-3">
                      <button 
                        onClick={() => handleSelectPaymentMethod('qris')}
                        className="w-full p-4 rounded-[8px] border border-[#2e2e2e] hover:border-indigo-500 hover:bg-[#667cdc]/10 flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-indigo-100 p-2.5 rounded-lg text-indigo-600">
                            <QrCode className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-[#fafafa] group-hover:text-indigo-700">QRIS</p>
                            <p className="text-xs text-[#b4b4b4]">Scan via GoPay, OVO, Dana, M-Banking</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#898989] group-hover:text-[#667cdc]" />
                      </button>

                      <button 
                        onClick={() => handleSelectPaymentMethod('va')}
                        className="w-full p-4 rounded-[8px] border border-[#2e2e2e] hover:border-emerald-500 hover:bg-[#3ecf8e]/5 flex items-center justify-between group transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="bg-[#3ecf8e]/10 p-2.5 rounded-lg text-[#3ecf8e]">
                            <Building className="w-6 h-6" />
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-[#fafafa] group-hover:text-[#3ecf8e]">Transfer Bank</p>
                            <p className="text-xs text-[#b4b4b4]">Bank Central Asia (BCA)</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#898989] group-hover:text-[#3ecf8e]" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // Tampilan Instruksi Pembayaran (QRIS / VA)
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="flex items-center justify-between mb-1">
                      <button onClick={() => setPaymentMethod(null)} className="text-[#898989] hover:text-[#fafafa] font-medium text-sm flex items-center">
                        <ChevronRight className="w-4 h-4 rotate-180" /> Kembali
                      </button>
                      <div className="text-[#e54d2e] font-bold bg-rose-50 px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-[#b4b4b4] font-medium mb-0.5 text-sm">Total Pembayaran</p>
                      <h3 className="text-3xl font-black text-[#3ecf8e]">
                        {formatRp(totalNominal)}
                      </h3>
                      <p className="text-[11px] text-[#b4b4b4] mt-1 bg-[#141414] px-3 py-1 rounded-lg inline-block">Termasuk angka unik: <span className="font-bold text-[#fafafa]">{uniqueCode}</span></p>
                    </div>

                    {paymentMethod === 'qris' && (
                      <div className="bg-[#0f0f0f] p-4 rounded-[8px] border border-[#2e2e2e] flex flex-col items-center justify-center relative">
                        <div className="w-full flex justify-center mb-3 relative overflow-hidden">
                          <div className="bg-[#171717] p-3 rounded-[8px] shadow-sm border border-[#2e2e2e] w-max">
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

                        <p className="text-[10px] text-[#b4b4b4] text-center leading-tight max-w-[200px]">Scan QR code menggunakan aplikasi M-Banking atau e-Wallet kesayangan Anda.</p>
                      </div>
                    )}

                  {paymentMethod === 'va' && (
                    <div className="bg-[#0f0f0f] p-6 rounded-[8px] border border-[#2e2e2e] space-y-4">
                      <div>
                        <p className="text-xs text-[#b4b4b4] font-medium mb-1">Bank Tujuan</p>
                        <p className="font-bold text-[#3ecf8e] flex items-center gap-2">
                          <Building className="w-4 h-4" /> Bank Central Asia (BCA)
                        </p>
                      </div>
                      <div className="h-px bg-[#0f0f0f] w-full" />
                      <div>
                        <p className="text-xs text-[#b4b4b4] font-medium mb-1">Nomor Rekening</p>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-2xl tracking-widest text-[#fafafa]">148 125 4359</p>
                        </div>
                      </div>
                      <div className="h-px bg-[#0f0f0f] w-full" />
                      <ul className="text-xs text-[#b4b4b4] list-disc pl-4 space-y-1">
                        <li>Pilih menu Transfer Antar Rekening BCA.</li>
                        <li>Masukkan nomor rekening di atas.</li>
                        <li>Pastikan atas nama <span className="font-bold">Ayi H Mardiansyah</span>.</li>
                        <li>Pastikan transfer <span className="font-bold text-rose-500">TEPAT</span> sesuai nominal hingga digit terakhir (<span className="font-bold">{uniqueCode}</span>).</li>
                      </ul>
                    </div>
                  )}

                    <div className="mt-4 p-4 bg-[#171717] border border-[#2e2e2e] rounded-[8px] space-y-3">
                      <label className="text-sm font-semibold text-[#fafafa] block">Unggah Bukti Transfer <span className="text-rose-500">*</span></label>
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
                        className="w-full text-sm text-[#b4b4b4] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#3ecf8e]/5 file:text-[#3ecf8e] hover:file:bg-[#3ecf8e]/10"
                      />
                      {buktiFile && (
                        <p className="text-xs text-[#3ecf8e] font-medium break-all">
                          Terpilih: {buktiFile.name}
                        </p>
                      )}
                    </div>

                    <div className="bg-[#667cdc]/10 border border-[#667cdc]/20 p-3 rounded-[8px] text-[#667cdc] text-[11px] flex gap-2 mt-4 leading-tight">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <p>Setelah transfer/scan QRIS dan mengunggah bukti, klik tombol di bawah agar diverifikasi Admin.</p>
                    </div>

                    <button 
                      onClick={handleSimulatePayment}
                      disabled={isPending || timeLeft === 0 || !buktiFile}
                      className="w-full py-3 bg-[#3ecf8e] text-white rounded-[8px] font-bold hover:bg-[#2ea06b] transition-all shadow-lg shadow-[#3ecf8e]/20 disabled:opacity-50 mt-3 text-sm flex items-center justify-center"
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

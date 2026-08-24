"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, CalendarCheck, FileSignature, Coins, ChevronRight, X, RefreshCw, ExternalLink, UserMinus, BookOpen, Search, Download, ImageIcon } from "lucide-react";
import { logoutGuru, updateKontrakSignature, getSantriIzinHariIni, getSantriBelumHadirGuru } from "./actions";
import { showSuccess, showError, showConfirm } from "@/lib/sweetalert";
import { formatDateID, formatTimeID, formatDateTimeID } from "@/lib/date";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getIzinHariIniColumns, getBelumHadirHariIniColumns } from "./columns";
import { formatWhatsAppStyle } from "@/lib/utils";
import { markNotifikasiGuruRead } from "./actions";
import { sendPesanBelumHadir } from "../laporan-absensi/belum-hadir/actions";
import { Bell, ChevronDown, ChevronUp } from "lucide-react";

export function PortalGuruClient({ initialData }: { initialData: any }) {
  const { profil, absensi, kontrak, pengumuman, notifikasi } = initialData;
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, kontrak
  const [signingKontrak, setSigningKontrak] = useState<any>(null);
  const [showToS, setShowToS] = useState(false);
  const [izinHariIni, setIzinHariIni] = useState<any[]>([]);
  const [loadingIzin, setLoadingIzin] = useState(false);
  const [selectedIzin, setSelectedIzin] = useState<any | null>(null);

  const [belumHadirHariIni, setBelumHadirHariIni] = useState<any[]>([]);
  const [loadingBelumHadir, setLoadingBelumHadir] = useState(false);

  const [showNotif, setShowNotif] = useState(false);
  const [expandedNotif, setExpandedNotif] = useState<string | null>(null);
  const [selectedPengumuman, setSelectedPengumuman] = useState<any>(null);

  const unreadCount = notifikasi?.filter((n: any) => !n.isRead).length || 0;

  
  const handleKirimPesan = async (idSantri: string, statusPesan: string | null) => {
    if (statusPesan) {
      toast.error("Pesan sudah dikirim hari ini.");
      return;
    }
    
    const toastId = toast.loading("Mengirim pesan...");
    try {
      const res = await sendPesanBelumHadir(idSantri);
      if (res.success) {
        toast.success("Pesan berhasil dikirim!", { id: toastId });
        fetchBelumHadirHariIni();
      } else {
        toast.error(res.message || "Gagal mengirim pesan", { id: toastId });
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan sistem", { id: toastId });
    }
  };

  const handleReadNotif = async (id: string, isRead: boolean) => {
    setExpandedNotif(expandedNotif === id ? null : id);
    if (!isRead) {
      await markNotifikasiGuruRead(id);
    }
  };

  const fetchIzinHariIni = async () => {
    setLoadingIzin(true);
    const res = await getSantriIzinHariIni();
    if (res.success && res.data) {
      setIzinHariIni(res.data);
    }
    setLoadingIzin(false);
  };

  const fetchBelumHadirHariIni = async () => {
    setLoadingBelumHadir(true);
    const res = await getSantriBelumHadirGuru();
    if (res.success && res.data) {
      setBelumHadirHariIni(res.data);
    }
    setLoadingBelumHadir(false);
  };

  useEffect(() => {
    fetchIzinHariIni();
    fetchBelumHadirHariIni();
  }, []);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Helper untuk signature canvas
  const getCoordinates = (e: any) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    const scaleX = canvasRef.current.width / rect.width;
    const scaleY = canvasRef.current.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: any) => {
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      const { x, y } = getCoordinates(e);
      ctx.moveTo(x, y);
    }
  };
  const endDrawing = () => {
    setIsDrawing(false);
  };
  const draw = (e: any) => {
    if (!isDrawing || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if(!ctx) return;
    
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#10b981';

    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const handleLogout = async () => {
    const confirmed = await showConfirm("Keluar?", "Anda akan keluar dari Portal HRIS.");
    if(confirmed){
      await logoutGuru();
      router.push("/portal-guru/login");
    }
  };

  const handleSignSubmit = async () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    
    // Validasi apakah canvas kosong
    const ctx = canvasRef.current.getContext('2d');
    const pixelBuffer = new Uint32Array(ctx?.getImageData(0,0,canvasRef.current.width,canvasRef.current.height).data.buffer || new ArrayBuffer(0));
    const isBlank = !pixelBuffer.some(color => color !== 0);
    
    if (isBlank) {
      showError("Tanda Tangan Kosong", "Silakan coret tanda tangan Anda pada area yang disediakan.");
      return;
    }

    const res = await updateKontrakSignature(signingKontrak.id, dataUrl);
    if (res.success) {
      showSuccess("Berhasil", res.message);
      setSigningKontrak(null);
      // Reload is safe
      window.location.reload();
    } else {
      showError("Gagal", res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
        <header className="bg-emerald-700 text-white shadow-md sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center relative">
            <div>
              <h1 className="font-bold text-lg md:text-xl">Portal Karyawan & Guru</h1>
              <p className="text-emerald-100 text-xs md:text-sm truncate">Halo, {profil.namaLengkap}</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Notifikasi Lonceng */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotif(!showNotif)}
                  className="p-2 relative bg-emerald-800/50 hover:bg-emerald-800 rounded-lg text-emerald-100 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-emerald-700">
                      {unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotif && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">Notifikasi</h3>
                      <button onClick={() => setShowNotif(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifikasi && notifikasi.length > 0 ? (
                        <div className="divide-y divide-slate-100">
                          {notifikasi.map((item: any) => (
                            <div 
                              key={item.id} 
                              className={`p-4 transition-colors cursor-pointer ${!item.isRead ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}
                              onClick={() => handleReadNotif(item.id, item.isRead)}
                            >
                              <div className="w-full text-left">
                                <div className="flex gap-3">
                                  <div className="mt-1 shrink-0">
                                    <div className={`w-2 h-2 rounded-full ${!item.isRead ? 'bg-emerald-500' : 'bg-transparent'}`} />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1">
                                      <h4 className={`text-sm ${!item.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                                        {item.judul}
                                      </h4>
                                      {expandedNotif === item.id ? (
                                        <ChevronUp className="w-4 h-4 text-slate-400" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                      )}
                                    </div>
                                    <p suppressHydrationWarning className="text-[10px] text-slate-400 mb-1">
                                      {formatDateTimeID(item.tanggal)}
                                    </p>
                                    {expandedNotif === item.id ? (
                                      <div 
                                        className="text-sm text-slate-600 leading-relaxed mt-2 pt-2 border-t border-slate-100 whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: formatWhatsAppStyle(item.isi) }}
                                      />
                                    ) : (
                                      <div 
                                        className="text-xs text-slate-500 line-clamp-1"
                                        dangerouslySetInnerHTML={{ __html: formatWhatsAppStyle(item.isi) }}
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-sm">
                          Belum ada notifikasi
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={handleLogout} className="p-2 bg-emerald-800/50 hover:bg-emerald-800 rounded-lg text-emerald-100 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-white rounded-xl shadow-sm overflow-x-auto">
          <button onClick={()=>setActiveTab('dashboard')} className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'dashboard' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <CalendarCheck className="w-4 h-4 inline mr-2" /> Riwayat Absensi
          </button>
          <button onClick={()=>router.push('/portal-guru/mutabaah')} className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-colors text-slate-500 hover:bg-slate-50`}>
            <BookOpen className="w-4 h-4 inline mr-2" /> Mutabaah Santri
          </button>
          <button onClick={()=>setActiveTab('kontrak')} className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'kontrak' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            <FileSignature className="w-4 h-4 inline mr-2" /> Kontrak & Dokumen
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* PENGUMUMAN SECTION */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Pengumuman Terbaru</h3>
                <Bell className="w-5 h-5 text-slate-400" />
              </div>
              
              <div>
                {pengumuman && pengumuman.length > 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
                    {pengumuman.map((item: any) => (
                      <div 
                        key={item.id} 
                        onClick={() => setSelectedPengumuman(item)}
                        className="p-4 flex gap-3 cursor-pointer hover:bg-slate-50 transition-colors active:bg-slate-100"
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-slate-800 text-sm mb-0.5">{item.judul}</h4>
                          <p suppressHydrationWarning className="text-[10px] text-slate-400 mb-1.5">
                            {formatDateID(item.tanggal)}
                          </p>
                          <div 
                            className="text-xs text-slate-500 leading-relaxed line-clamp-1"
                            dangerouslySetInnerHTML={{ __html: formatWhatsAppStyle(item.isi) }}
                          />
                        </div>
                        <div className="flex items-center justify-center shrink-0">
                          <ChevronDown className="w-4 h-4 text-slate-300 -rotate-90" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
                    Belum ada pengumuman
                  </div>
                )}
              </div>
            </div>

            {/* RIWAYAT ABSENSI */}
            <div className="space-y-4">
              <h2 className="font-bold text-slate-800 text-lg">Absensi 30 Hari Terakhir</h2>
            {absensi.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {absensi.map((absen: any, idx: number) => (
                  <div key={absen.id} className={`p-4 flex items-center justify-between ${idx !== absensi.length - 1 ? 'border-b border-slate-100' : ''}`}>
                    <div>
                      <p suppressHydrationWarning className="font-bold text-slate-700">{formatDateID(absen.waktuScan)}</p>
                      <p suppressHydrationWarning className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                        <span suppressHydrationWarning className="font-medium text-slate-700">{formatTimeID(absen.waktuScan)}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="capitalize text-slate-600">{absen.jenisAbsen}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="capitalize text-slate-600">{absen.metodeScan}</span>
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      absen.statusKehadiran === 'hadir' ? 'bg-emerald-100 text-emerald-700' :
                      absen.statusKehadiran === 'terlambat' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {absen.statusKehadiran.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500">Belum ada riwayat absensi dalam 30 hari terakhir.</p>
              </div>
            )}
            </div>
          </div>
        )}

        {/* SANTRI IZIN (HARIAN) SECTION */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-lg">Santri Izin (Hari Ini)</h2>
              <button 
                onClick={fetchIzinHariIni} 
                disabled={loadingIzin}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingIzin ? 'animate-spin text-orange-500' : ''}`} />
                Segarkan
              </button>
            </div>
            
            {loadingIzin ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : izinHariIni.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                <DataTable
                  columns={getIzinHariIniColumns((item) => { setSelectedIzin(item); })}
                  data={izinHariIni}
                  searchKey="namaLengkap"
                />
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500">Tidak ada santri dari halaqah Anda yang izin hari ini.</p>
              </div>
            )}
          </div>
        )}

        {/* SANTRI BELUM HADIR (HARIAN) SECTION */}
        {activeTab === 'dashboard' && (
          <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <UserMinus className="w-5 h-5 text-rose-500" />
                Santri Belum Hadir (Hari Ini)
              </h2>
              <button 
                onClick={fetchBelumHadirHariIni} 
                disabled={loadingBelumHadir}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingBelumHadir ? 'animate-spin text-orange-500' : ''}`} />
                Segarkan
              </button>
            </div>
            
            {loadingBelumHadir ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex justify-center">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : belumHadirHariIni.length > 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                <DataTable
                  columns={getBelumHadirHariIniColumns(handleKirimPesan)}
                  data={belumHadirHariIni}
                  searchKey="namaLengkap"
                />
              </div>
            ) : (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500 font-medium text-emerald-600">Alhamdulillah! Semua santri di halaqah Anda sudah diabsen hari ini.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'kontrak' && (
          <div className="space-y-4">
            <h2 className="font-bold text-slate-800 text-lg">Dokumen Kontrak Anda</h2>
            {kontrak.length > 0 ? (
              <div className="space-y-4">
                {kontrak.map((k: any) => (
                  <div key={k.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold mb-2 inline-block ${
                          k.statusKontrak === 'aktif' ? 'bg-emerald-100 text-emerald-700' :
                          k.statusKontrak === 'selesai' ? 'bg-slate-200 text-slate-700' :
                          'bg-amber-100 text-amber-700 animate-pulse'
                        }`}>
                          {k.statusKontrak === 'aktif' ? 'AKTIF' : k.statusKontrak === 'selesai' ? 'SELESAI' : 'MENUNGGU TANDA TANGAN'}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold mb-2 ml-2 inline-block capitalize">
                          {k.jenisKontrak}
                        </span>
                        <h3 className="font-bold text-slate-800 text-lg">{k.jabatan}</h3>
                        {k.jenisKontrak === 'permanen' ? (
                          <p className="text-sm font-medium text-blue-600">Periode: Selamanya (Permanen)</p>
                        ) : (
                          <p suppressHydrationWarning className="text-sm text-slate-500">Periode: {k.tanggalMulai ? formatDateID(k.tanggalMulai) : '-'} s.d. {k.tanggalSelesai ? formatDateID(k.tanggalSelesai) : '-'}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500 mb-1">Satuan Kafalah</p>
                        <p className="font-bold text-emerald-600">Rp xx.xxx <span className="text-xs font-normal text-slate-500">/Hadir</span></p>
                      </div>
                    </div>

                    {k.statusKontrak === 'menunggu_ttd' && !k.eSignUrl && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-4">
                          <p className="text-sm text-amber-800 font-medium">Anda memiliki kontrak baru yang memerlukan persetujuan dan tanda tangan digital Anda.</p>
                        </div>
                        <button 
                          onClick={() => setSigningKontrak(k)}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                          <FileSignature className="w-5 h-5" /> Baca & Tanda Tangani Kontrak
                        </button>
                      </div>
                    )}

                    {k.eSignUrl && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-xs font-medium text-slate-500 mb-2">Tanda Tangan Digital Tersimpan:</p>
                        <img src={k.eSignUrl} alt="E-Sign" className="h-16 object-contain" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
               <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
                <p className="text-slate-500">Tidak ada data kontrak yang ditemukan.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* E-Sign Modal */}
      {signingKontrak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Tanda Tangan Kontrak</h3>
              <button onClick={() => setSigningKontrak(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="prose prose-sm prose-emerald max-w-none text-slate-600 mb-6 border p-4 rounded-xl bg-slate-50">
                <h4 className="font-bold text-center text-slate-800 mb-4 text-base">PERJANJIAN KERJA SAMA KEPENGURUSAN</h4>
                <p>Dengan ini saya menyatakan kesediaan untuk menerima tugas dan amanah sebagai <strong>{signingKontrak.jabatan}</strong>.</p>
                <p>Status Kontrak: <strong className="capitalize">{signingKontrak.jenisKontrak}</strong></p>
                <p>Periode: <strong suppressHydrationWarning>{signingKontrak.jenisKontrak === 'permanen' ? 'Selamanya (Permanen)' : `${signingKontrak.tanggalMulai ? formatDateID(signingKontrak.tanggalMulai) : '-'} s.d. ${signingKontrak.tanggalSelesai ? formatDateID(signingKontrak.tanggalSelesai) : '-'}`}</strong></p>
                <p>Satuan Kafalah / Bonus Kehadiran: <strong suppressHydrationWarning>Rp {signingKontrak.satuanKafalah.toLocaleString('id-ID')} / kehadiran</strong></p>
                <p className="mt-4 italic text-sm">
                  Saya telah membaca, memahami, dan menyetujui <button type="button" onClick={() => setShowToS(true)} className="text-emerald-600 font-bold underline hover:text-emerald-700 outline-none">seluruh ketentuan dan tanggung jawab dari yayasan (SOP)</button>.
                </p>
              </div>

              <div className="mb-2 flex justify-between items-center">
                <label className="font-bold text-sm text-slate-800">Coret Tanda Tangan Anda di Bawah:</label>
                <button onClick={clearCanvas} className="text-xs font-bold text-rose-500 hover:text-rose-700">Bersihkan</button>
              </div>
              <div className="border-2 border-dashed border-emerald-300 rounded-xl overflow-hidden bg-slate-50 touch-none">
                <canvas 
                  ref={canvasRef}
                  width={400}
                  height={200}
                  className="w-full h-[200px] cursor-crosshair touch-none"
                  onMouseDown={startDrawing}
                  onMouseUp={endDrawing}
                  onMouseOut={endDrawing}
                  onMouseMove={draw}
                  onTouchStart={startDrawing}
                  onTouchEnd={endDrawing}
                  onTouchMove={draw}
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button onClick={() => setSigningKontrak(null)} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors">
                Batal
              </button>
              <button onClick={handleSignSubmit} className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2">
                <FileSignature className="w-4 h-4" /> Setuju & Tanda Tangani
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ToS / SOP Modal */}
      {showToS && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Ketentuan dan Tanggung Jawab Yayasan (SOP)</h3>
              <button onClick={() => setShowToS(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto prose prose-sm prose-emerald max-w-none text-slate-600" id="sop-content">
              <h4>I. Jam Operasional</h4>
              <ul>
                <li><strong>Sesi Siang:</strong> 12.30 - 14.30 WIB</li>
                <li><strong>Sesi Sore:</strong> 14.30 - 18.30 WIB</li>
              </ul>
              
              <h4>II. Prosedur Kehadiran & Persiapan</h4>
              <ul>
                <li>Hadir di lokasi <strong>maksimal 15 menit sebelum</strong> jam operasional untuk persiapan.</li>
                <li>Melakukan absensi masuk dan keluar (via sistem KIOSK/portal).</li>
                <li>Jika <strong>terlambat</strong>, wajib memberi tahu Pengelola via WhatsApp/telepon minimal 1 jam sebelum sesi.</li>
                <li>Jika berhalangan hadir <strong>tanpa pemberitahuan (Alpa)</strong> minimal 24 jam sebelumnya, akan dikenakan sanksi sesuai kebijakan.</li>
                <li>Mempersiapkan materi ajar minimal 30 menit sebelum sesi dimulai.</li>
                <li>Memastikan fasilitas (meja, papan tulis, buku, Al-Qur'an) sudah siap dan rapi sebelum mulai.</li>
              </ul>

              <h4>III. Pelaksanaan & Evaluasi</h4>
              <ul>
                <li>Mengajar dengan ramah, interaktif, sabar, dan sesuai kurikulum/standar.</li>
                <li>Menjaga disiplin waktu dan etika selama berada di Rumah Qur'an Muharrik.</li>
                <li>Menegur siswa yang tidak tertib dengan cara yang sopan dan mendidik.</li>
                <li>Melakukan evaluasi singkat pemahaman siswa di akhir kelas.</li>
                <li>Merapikan kembali ruang kelas dan mengembalikan alat bantu ajar setelah selesai.</li>
              </ul>

              <h4>IV. Kebijakan Cuti & Kompensasi</h4>
              <ul>
                <li>Pengajuan cuti dilakukan <strong>minimal 3 hari</strong> sebelum tanggal cuti agar Pengelola bisa menyiapkan guru pengganti.</li>
                <li>Yayasan wajib menyediakan fasilitas belajar yang memadai untuk guru.</li>
                <li>Kompensasi (Kafalah/Gaji) dibayarkan setiap bulannya secara tunai/transfer berdasarkan perhitungan akumulasi kehadiran di sistem.</li>
              </ul>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button onClick={() => {
                const element = document.createElement("a");
                const text = document.getElementById("sop-content")?.innerText || "";
                const file = new Blob([text], {type: 'text/plain'});
                element.href = URL.createObjectURL(file);
                element.download = "SOP_Rumah_Quran_Muharrik.txt";
                document.body.appendChild(element); 
                element.click();
                document.body.removeChild(element);
              }} className="px-5 py-2.5 rounded-xl font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition-colors">
                Unduh (.txt)
              </button>
              <button onClick={() => setShowToS(false)} className="px-5 py-2.5 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-900 transition-all">
                Tutup & Kembali
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Detail Izin */}
      {selectedIzin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]" onClick={() => setSelectedIzin(null)}>
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-5 border-b border-slate-200 bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Detail Perizinan Santri</h3>
              <button
                onClick={() => setSelectedIzin(null)}
                className="text-slate-400 hover:text-rose-500 bg-slate-200/50 hover:bg-rose-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nama Santri</h4>
                  <p className="font-bold text-slate-800 text-lg">{selectedIzin.santri.namaLengkap}</p>
                  <p className="text-sm text-slate-500">NIS: {selectedIzin.santri.nomorInduk}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Kategori</h4>
                  <span className={`inline-flex px-3 py-1 rounded-md text-sm font-bold ${
                    selectedIzin.kategori === 'Sakit' 
                      ? 'bg-rose-100 text-rose-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {(selectedIzin.kategori as string).toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Rentang Waktu</h4>
                  <p className="font-medium text-slate-700">{formatDateID(selectedIzin.tanggalMulai)}</p>
                  {selectedIzin.tanggalSelesai > selectedIzin.tanggalMulai && (
                    <p className="text-sm text-slate-600 mt-1">s/d {formatDateID(selectedIzin.tanggalSelesai)}</p>
                  )}
                  <p className="text-xs text-indigo-600 font-semibold mt-1">
                    Durasi: {Math.round((new Date(selectedIzin.tanggalSelesai).getTime() - new Date(selectedIzin.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24)) + 1} Hari
                  </p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Diajukan Pada</h4>
                  <p className="font-medium text-slate-700">{formatDateID(selectedIzin.waktuPengajuan)}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Keterangan / Alasan</h4>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <p className="text-slate-700 leading-relaxed">{selectedIzin.keterangan}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Lampiran Bukti</h4>
                {selectedIzin.buktiUrl ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 relative group">
                    <img 
                      src={selectedIzin.buktiUrl} 
                      alt={`Bukti ${selectedIzin.kategori}`} 
                      className="w-full max-h-[300px] object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <button 
                        onClick={async () => {
                          try {
                            const response = await fetch(selectedIzin.buktiUrl!);
                            const blob = await response.blob();
                            const objectUrl = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = objectUrl;
                            link.download = `Bukti_${selectedIzin.kategori}_${selectedIzin.santri.namaLengkap.replace(/\s+/g, '_')}.jpg`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(objectUrl);
                          } catch (error) {
                            toast.error('Gagal mengunduh gambar');
                          }
                        }}
                        className="flex items-center gap-2 text-sm font-semibold bg-white text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors shadow-lg"
                      >
                        <Download className="w-4 h-4" /> Download Gambar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-300 bg-slate-50 rounded-lg p-8 flex flex-col items-center justify-center text-slate-400">
                    <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm font-medium">Tidak ada foto lampiran bukti</p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedIzin(null)}
                className="px-6 py-2 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pengumuman Modal */}
      {selectedPengumuman && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg pr-4">{selectedPengumuman.judul}</h3>
                <p suppressHydrationWarning className="text-xs text-slate-500 mt-1">
                  {formatDateID(selectedPengumuman.tanggal)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPengumuman(null)}
                className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div 
                className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: formatWhatsAppStyle(selectedPengumuman.isi) }}
              />
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <button 
                onClick={() => setSelectedPengumuman(null)}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






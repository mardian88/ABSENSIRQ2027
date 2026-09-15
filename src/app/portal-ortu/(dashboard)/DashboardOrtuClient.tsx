"use client";

import { User, Wallet, FileText, Home, Bell, LogOut, X, ChevronDown, ChevronUp, BookOpen, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { formatRp, formatWhatsAppStyle } from "@/lib/utils";
import { formatDateID, formatTimeID, formatDateTimeID } from "@/lib/date";
import { useState, useTransition } from "react";
import { logoutOrtu } from "../actions";
import { useRouter } from "next/navigation";
import { markNotifikasiRead } from "../notifikasi-actions";

export function DashboardOrtuClient({ profil, keuangan, pengumuman, notifikasi }: any) {
  const router = useRouter();
  const [showNotif, setShowNotif] = useState(false);
  const [expandedNotif, setExpandedNotif] = useState<string | null>(null);
  const [selectedPengumuman, setSelectedPengumuman] = useState<any>(null);
  const [isPending, startTransition] = useTransition();

  // Optimistic unread count (we can just rely on the prop + local read state if we want, but since Next.js revalidates, we can just use the prop directly)
  const unreadCount = notifikasi?.filter((n: any) => !n.isRead).length || 0;

  const handleReadNotif = (id: string, isRead: boolean) => {
    if (expandedNotif === id) {
      setExpandedNotif(null);
    } else {
      setExpandedNotif(id);
      if (!isRead) {
        startTransition(async () => {
          await markNotifikasiRead(id);
        });
      }
    }
  };

  let lastPaidKas = "Belum ada pembayaran";
  if (keuangan?.lastBulanKas && keuangan?.lastTahunKas) {
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    lastPaidKas = `Lunas s.d ${monthNames[keuangan.lastBulanKas - 1]} ${keuangan.lastTahunKas}`;
  }

  let lastPaidInfaq = "Belum ada pembayaran";
  if (keuangan?.lastBulanInfaq && keuangan?.lastTahunInfaq) {
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    lastPaidInfaq = `Lunas s.d ${monthNames[keuangan.lastBulanInfaq - 1]} ${keuangan.lastTahunInfaq}`;
  }

  return (
    <div className="flex flex-col min-h-full pb-6">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#faf8f5]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-[#f3f4f6]/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#4a6741]/10/50 rounded-full text-[#4a6741]">
            <Home className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-[#4a6741]">Beranda</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowNotif(true)}
            className="relative p-2 text-[#374151] hover:bg-[#eae7e0] rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-[#faf8f5] text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <button 
            onClick={async () => {
              const { showConfirm } = await import("@/lib/sweetalert");
              const isConfirmed = await showConfirm("Konfirmasi Keluar", "Apakah Anda yakin ingin keluar?", "Ya, Keluar");
              if(isConfirmed) {
                await logoutOrtu();
                router.push('/portal-ortu');
              }
            }}
            className="p-2 text-rose-600 hover:bg-rose-100 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Notification Modal */}
      {showNotif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[#ffffff] rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[#f3f4f6] flex justify-between items-center bg-[#faf8f5]">
              <h3 className="font-bold text-[#4a6741] flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#4a6741]" />
                Notifikasi
              </h3>
              <button 
                onClick={() => setShowNotif(false)}
                className="p-1 text-[#374151]/60 hover:bg-[#eae7e0] rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              {notifikasi && notifikasi.length > 0 ? (
                <div className="space-y-3">
                  {notifikasi.map((item: any) => (
                    <div 
                      key={item.id} 
                      className={`border rounded-xl transition-colors cursor-pointer ${!item.isRead ? 'bg-blue-50/50 border-blue-100' : 'bg-[#ffffff] border-[#f3f4f6]'}`}
                      onClick={() => handleReadNotif(item.id, item.isRead)}
                    >
                      <div className="w-full text-left p-4 flex gap-3 items-start">
                        <div className="pt-1">
                          {!item.isRead ? (
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-transparent mt-1"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={`text-sm ${!item.isRead ? 'font-bold text-[#4a6741]' : 'font-medium text-[#374151]'}`}>
                              {item.judul}
                            </h4>
                            {expandedNotif === item.id ? (
                              <ChevronUp className="w-4 h-4 text-[#374151]/60" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#374151]/60" />
                            )}
                          </div>
                          <p suppressHydrationWarning className="text-[10px] text-[#374151]/60 mb-1">
                            {formatDateTimeID(item.tanggal)}
                          </p>
                          {expandedNotif === item.id ? (
                            <div 
                              className="text-sm text-[#374151] leading-relaxed mt-2 pt-2 border-t border-[#f3f4f6] whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: formatWhatsAppStyle(item.isi) }}
                            />
                          ) : (
                            <div 
                              className="text-xs text-[#374151]/80 line-clamp-1"
                              dangerouslySetInnerHTML={{ __html: formatWhatsAppStyle(item.isi) }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#374151]/60 text-sm">
                  Belum ada notifikasi
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="px-6 mt-4 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#4a6741]">Ahlan wa Sahlan!</h2>
        </div>

        {/* Data Santri Card */}
        <div className="bg-[#ffffff] rounded-[24px] p-6 shadow-sm border border-[#f3f4f6] flex flex-col gap-1 relative overflow-hidden">
          <div className="text-xs font-semibold text-[#374151]/60 uppercase tracking-wider mb-1">
            Data Santri
          </div>
          <h3 className="text-xl font-bold text-[#4a6741]">{profil.namaLengkap}</h3>
          <div>
            <span className="inline-block px-3 py-1 bg-[#f3f1ed] text-[#374151] rounded-full text-xs font-medium mt-2">
              NIS: {profil.nomorInduk}
            </span>
          </div>
        </div>

        {/* Balance Card (Gradient) */}
        <div className="bg-gradient-to-br from-[#4a6741] to-[#d97757] rounded-[24px] p-6 text-white shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <div className="text-emerald-50 text-sm font-medium mb-1">Saldo Tabungan</div>
              <div className="text-3xl font-bold">{formatRp(keuangan?.saldo || 0)}</div>
            </div>
            <div className="p-3 bg-[#ffffff]/20 rounded-full backdrop-blur-sm">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="space-y-2 relative z-10">
            <div className="bg-[#ffffff]/10 rounded-xl px-4 py-2.5 backdrop-blur-md text-sm font-medium border border-white/10 flex justify-between items-center">
              <span>Kas Terakhir:</span>
              <span className="text-emerald-100">{lastPaidKas}</span>
            </div>
            <div className="bg-[#ffffff]/10 rounded-xl px-4 py-2.5 backdrop-blur-md text-sm font-medium border border-white/10 flex justify-between items-center">
              <span>Infaq Terakhir:</span>
              <span className="text-emerald-100">{lastPaidInfaq}</span>
            </div>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#ffffff]/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl"></div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/portal-ortu/keuangan" className="bg-[#ffffff] rounded-[24px] p-5 shadow-sm border border-[#f3f4f6] flex flex-col items-center text-center gap-3 active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <div className="font-bold text-[#4a6741]">Keuangan</div>
              <div className="text-xs text-[#374151]/80 mt-0.5">Cek mutasi & tagihan</div>
            </div>
          </Link>
          
          <Link href="/portal-ortu/izin" className="bg-[#ffffff] rounded-[24px] p-5 shadow-sm border border-[#f3f4f6] flex flex-col items-center text-center gap-3 active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-1">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="font-bold text-[#4a6741]">Perizinan</div>
              <div className="text-xs text-[#374151]/80 mt-0.5">Ajukan & riwayat izin</div>
            </div>
          </Link>

          <Link href="/portal-ortu/mutabaah" className="bg-[#ffffff] rounded-[24px] p-5 shadow-sm border border-[#f3f4f6] flex flex-col items-center text-center gap-3 active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-1">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="font-bold text-[#4a6741]">Mutaba'ah</div>
              <div className="text-xs text-[#374151]/80 mt-0.5">Cek catatan ibadah</div>
            </div>
          </Link>

          <Link href="/portal-ortu/kebutuhan" className="bg-[#ffffff] rounded-[24px] p-5 shadow-sm border border-[#f3f4f6] flex flex-col items-center text-center gap-3 active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-1">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div>
              <div className="font-bold text-[#4a6741]">Kebutuhan</div>
              <div className="text-xs text-[#374151]/80 mt-0.5">Pesan seragam dll</div>
            </div>
          </Link>
        </div>

        {/* Pengumuman Terbaru */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-[#4a6741]">Pengumuman Terbaru</h3>
            <Bell className="w-5 h-5 text-[#374151]/60" />
          </div>
          
          <div>
            {pengumuman && pengumuman.length > 0 ? (
              <div className="bg-[#ffffff] rounded-xl shadow-sm border border-[#f3f4f6] overflow-hidden divide-y divide-slate-100">
                {pengumuman.map((item: any) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedPengumuman(item)}
                    className="p-4 flex gap-3 cursor-pointer hover:bg-[#faf8f5] transition-colors active:bg-[#f3f1ed]"
                  >
                    <div className="flex-1">
                      <h4 className="font-bold text-[#4a6741] text-sm mb-0.5">{item.judul}</h4>
                      <p suppressHydrationWarning className="text-[10px] text-[#374151]/60 mb-1.5">
                        {formatDateID(item.tanggal)}
                      </p>
                      <div 
                        className="text-xs text-[#374151]/80 leading-relaxed line-clamp-1"
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
              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-[#374151]/60 text-sm">
                Belum ada pengumuman
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pengumuman Modal */}
      {selectedPengumuman && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#ffffff] rounded-xl w-full max-w-md max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[#f3f4f6] flex justify-between items-start bg-[#faf8f5]">
              <div>
                <h3 className="font-bold text-[#4a6741] text-lg pr-4">{selectedPengumuman.judul}</h3>
                <p suppressHydrationWarning className="text-xs text-[#374151]/80 mt-1">
                  {formatDateID(selectedPengumuman.tanggal)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPengumuman(null)}
                className="p-1.5 text-[#374151]/60 hover:bg-[#eae7e0] hover:text-[#374151] rounded-full transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto">
              <div 
                className="text-sm text-[#374151] leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: formatWhatsAppStyle(selectedPengumuman.isi) }}
              />
            </div>
            <div className="p-4 border-t border-[#f3f4f6] bg-[#faf8f5]">
              <button 
                onClick={() => setSelectedPengumuman(null)}
                className="w-full py-3 bg-[#4a6741] text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 text-sm"
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




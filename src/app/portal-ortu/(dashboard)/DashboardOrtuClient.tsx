"use client";

import { User, Wallet, FileText, Home, Bell, LogOut, X, ChevronDown, ChevronUp, BookOpen, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { formatRp, formatWhatsAppStyle } from "@/lib/utils";
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
      <header className="sticky top-0 z-50 bg-slate-50/90 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-100/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100/50 rounded-full text-emerald-700">
            <Home className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-800">Beranda</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowNotif(true)}
            className="relative p-2 text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-50 text-[9px] font-bold text-white flex items-center justify-center">
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
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                Notifikasi
              </h3>
              <button 
                onClick={() => setShowNotif(false)}
                className="p-1 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"
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
                      className={`border rounded-xl transition-colors ${!item.isRead ? 'bg-blue-50/50 border-blue-100' : 'bg-white border-slate-100'}`}
                    >
                      <button 
                        onClick={() => handleReadNotif(item.id, item.isRead)}
                        className="w-full text-left p-4 flex gap-3 items-start"
                      >
                        <div className="pt-1">
                          {!item.isRead ? (
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1"></div>
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-transparent mt-1"></div>
                          )}
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
                          <p className="text-[10px] text-slate-400 mb-1">
                            {new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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
                      </button>
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
        </div>
      )}

      <div className="px-6 mt-4 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Ahlan wa Sahlan!</h2>
        </div>

        {/* Data Santri Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 flex flex-col gap-1 relative overflow-hidden">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Data Santri
          </div>
          <h3 className="text-xl font-bold text-slate-800">{profil.namaLengkap}</h3>
          <div>
            <span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium mt-2">
              NIS: {profil.nomorInduk}
            </span>
          </div>
        </div>

        {/* Balance Card (Gradient) */}
        <div className="bg-gradient-to-br from-emerald-700 to-blue-600 rounded-[24px] p-6 text-white shadow-md relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <div className="text-emerald-50 text-sm font-medium mb-1">Saldo Tabungan</div>
              <div className="text-3xl font-bold">{formatRp(keuangan?.saldo || 0)}</div>
            </div>
            <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
              <Wallet className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="space-y-2 relative z-10">
            <div className="bg-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md text-sm font-medium border border-white/10 flex justify-between items-center">
              <span>Kas Terakhir:</span>
              <span className="text-emerald-100">{lastPaidKas}</span>
            </div>
            <div className="bg-white/10 rounded-xl px-4 py-2.5 backdrop-blur-md text-sm font-medium border border-white/10 flex justify-between items-center">
              <span>Infaq Terakhir:</span>
              <span className="text-emerald-100">{lastPaidInfaq}</span>
            </div>
          </div>

          {/* Decorative circles */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl"></div>
        </div>

        {/* Action Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/portal-ortu/keuangan" className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-1">
              <Wallet className="w-7 h-7" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Keuangan</div>
              <div className="text-xs text-slate-500 mt-0.5">Cek mutasi & tagihan</div>
            </div>
          </Link>
          
          <Link href="/portal-ortu/izin" className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-1">
              <FileText className="w-7 h-7" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Perizinan</div>
              <div className="text-xs text-slate-500 mt-0.5">Ajukan & riwayat izin</div>
            </div>
          </Link>

          <Link href="/portal-ortu/mutabaah" className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-1">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Mutaba'ah</div>
              <div className="text-xs text-slate-500 mt-0.5">Cek catatan ibadah</div>
            </div>
          </Link>

          <Link href="/portal-ortu/kebutuhan" className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 flex flex-col items-center text-center gap-3 active:scale-95 transition-transform">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 mb-1">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <div>
              <div className="font-bold text-slate-800">Kebutuhan</div>
              <div className="text-xs text-slate-500 mt-0.5">Pesan seragam dll</div>
            </div>
          </Link>
        </div>

        {/* Pengumuman Terbaru */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800">Pengumuman Terbaru</h3>
            <Bell className="w-5 h-5 text-slate-400" />
          </div>
          
          <div className="space-y-4">
            {pengumuman && pengumuman.length > 0 ? (
              pengumuman.map((item: any) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedPengumuman(item)}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex gap-4 cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800 mb-1">{item.judul}</h4>
                    <p className="text-xs text-slate-400 mb-2">
                      {new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    <div 
                      className="text-sm text-slate-600 leading-relaxed line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: formatWhatsAppStyle(item.isi) }}
                    />
                    <div className="text-emerald-600 text-xs font-semibold mt-2 flex items-center gap-1">
                      Baca selengkapnya <ChevronDown className="w-3 h-3 -rotate-90" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm">
                Belum ada pengumuman
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pengumuman Modal */}
      {selectedPengumuman && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg pr-4">{selectedPengumuman.judul}</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(selectedPengumuman.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
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

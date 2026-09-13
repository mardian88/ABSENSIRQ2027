"use client";

import { useState, useRef } from "react";
import { formatRp } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toJpeg } from "html-to-image";

export function TopupHistoryClient({ 
  history, 
  santriName, 
  santriNis 
}: { 
  history: any[],
  santriName: string,
  santriNis: string
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const displayedHistory = history.slice(0, 3);

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toJpeg(receiptRef.current, { quality: 0.95, backgroundColor: '#ffffff' });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Struk_TopUp_${santriName}_${new Date().getTime()}.jpg`;
      link.click();
    } catch (error) {
      console.error("Gagal mendownload struk:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  if (history.length === 0) {
    return (
      <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-200">
        <p className="text-slate-400 text-sm">Belum ada riwayat pengajuan</p>
      </div>
    );
  }

  return (
    <div>
      {/* Minimized View */}
      <div className="space-y-3">
        {displayedHistory.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">
                {formatRp(item.amount)}
                <span className="text-[10px] font-normal text-slate-500 ml-2 bg-slate-100 px-1.5 py-0.5 rounded">
                  {item.type === 'utama' ? 'Dompet' : 'Tabungan'}
                </span>
              </p>
              <p className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</p>
            </div>
            <div>
              {item.status === 'pending' && <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold">Menunggu</span>}
              {item.status === 'approved' && <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">Berhasil</span>}
              {item.status === 'rejected' && <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold">Ditolak</span>}
            </div>
          </div>
        ))}
        {history.length > 3 && (
          <Button 
            variant="outline" 
            className="w-full mt-2" 
            onClick={() => setIsOpen(true)}
          >
            Lihat Semua & Cetak Struk
          </Button>
        )}
      </div>

      {/* Modal / Receipt View */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-100 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 bg-white flex justify-between items-center border-b border-slate-200">
              <h3 className="font-bold text-slate-800">Semua Riwayat</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="overflow-y-auto p-4 flex-1">
              {/* This is the area that will be captured by html2canvas */}
              <div 
                ref={receiptRef} 
                className="bg-white p-6 rounded-lg shadow-sm border border-slate-200"
                style={{ fontFamily: 'monospace' }}
              >
                <div className="text-center mb-6 border-b border-dashed border-slate-300 pb-4">
                  <h2 className="font-bold text-xl uppercase tracking-wider mb-1">Muharrik Maal</h2>
                  <p className="text-xs text-slate-500">Struk Riwayat Pengisian Saldo</p>
                </div>
                
                <div className="mb-6 text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">Nama:</span>
                    <span className="font-bold">{santriName}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-500">NIS:</span>
                    <span>{santriNis}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dicetak:</span>
                    <span>{new Date().toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                <div className="space-y-3 border-t border-dashed border-slate-300 pt-4">
                  {history.map((item, idx) => (
                    <div key={item.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                      <div>
                        <p className="font-bold">
                          {formatRp(item.amount)}
                          <span className="text-[9px] font-normal text-slate-500 ml-1">
                            ({item.type === 'utama' ? 'Dompet' : 'Tabungan'})
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString('id-ID')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs uppercase font-bold text-slate-700">
                          {item.status === 'approved' ? 'BERHASIL' : item.status === 'pending' ? 'MENUNGGU' : 'DITOLAK'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-8 text-center text-xs text-slate-400 border-t border-dashed border-slate-300 pt-4">
                  <p>Terima kasih</p>
                  <p>Semoga Allah memberkahi rezeki Anda</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <Button 
                onClick={handleDownload} 
                disabled={isDownloading} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isDownloading ? "Menyiapkan Gambar..." : "Simpan sbg Gambar (JPG)"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

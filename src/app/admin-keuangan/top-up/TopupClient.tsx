"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Search, CheckCircle2, XCircle, Image as ImageIcon, Clock } from "lucide-react";
import { setujuiTopup, tolakTopup } from "./actions";
import { showSuccess, showError, showConfirm, showPrompt } from "@/lib/sweetalert";

interface TopupData {
  id: string;
  idSantri: string;
  nominal: number;
  buktiUrl: string | null;
  status: string;
  tanggal: Date;
  namaSantri: string | null;
  nomorInduk: string | null;
  jenisPembayaran: string | null;
  angkaUnik: number | null;
}

export function TopupClient({ initialData }: { initialData: TopupData[] }) {
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSetuju = async (t: TopupData) => {
    const confirmed = await showConfirm(
      "Setujui Top-Up?",
      `Setujui pengisian saldo Rp ${new Intl.NumberFormat('id-ID').format(t.nominal)} untuk ${t.namaSantri}? Saldo santri akan otomatis bertambah.`
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await setujuiTopup(t.id, t.idSantri, t.nominal);
        setData(prev => prev.map(item => item.id === t.id ? { ...item, status: 'berhasil' } : item));
        showSuccess("Berhasil", "Top-Up berhasil disetujui");
      } catch (err) {
        showError("Gagal", "Terjadi kesalahan sistem");
      }
    });
  };

  const handleTolak = async (t: TopupData) => {
    const confirmed = await showConfirm(
      "Tolak Top-Up?",
      "Apakah Anda yakin ingin menolak permohonan pengisian saldo ini?"
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await tolakTopup(t.id);
        setData(prev => prev.map(item => item.id === t.id ? { ...item, status: 'gagal' } : item));
        showSuccess("Berhasil", "Top-Up berhasil ditolak");
      } catch (err) {
        showError("Gagal", "Terjadi kesalahan sistem");
      }
    });
  };

  const handleHapus = async (t: TopupData) => {
    const pwd = await showPrompt("Masukkan password untuk menghapus history ini:", "password", "Hapus");
    if (pwd === null) return;
    if (pwd !== "rqm") {
      showError("Gagal", "Password salah!");
      return;
    }

    startTransition(async () => {
      try {
        const { hapusTopup } = await import("./actions");
        await hapusTopup(t.id);
        setData(prev => prev.filter(item => item.id !== t.id));
        showSuccess("Terhapus", "History berhasil dihapus dari database.");
      } catch (err) {
        showError("Gagal", "Terjadi kesalahan sistem");
      }
    });
  };

  const pendingData = data.filter(s => s.status === 'pending');
  const historyData = data.filter(s => s.status !== 'pending');
  
  const displayedData = [
    ...pendingData,
    ...historyData.slice(0, 5)
  ].filter(s => 
    s.namaSantri?.toLowerCase().includes(search.toLowerCase()) || 
    s.nomorInduk?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Cari santri..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
            <tr>
              <th className="px-6 py-3">Tanggal</th>
              <th className="px-6 py-3">Santri</th>
              <th className="px-6 py-3">Nominal (Rp)</th>
              <th className="px-6 py-3">Bukti</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayedData.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 text-slate-700">
                  {format(new Date(t.tanggal), 'dd/MM/yyyy HH:mm')}
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-800">{t.namaSantri}</div>
                  <div className="text-xs text-slate-500">{t.nomorInduk}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-emerald-600">
                    + {new Intl.NumberFormat('id-ID').format(t.nominal)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 capitalize">
                    {t.jenisPembayaran === 'tabungan' || !t.jenisPembayaran ? 'Top-Up Tabungan' : `Iuran: ${t.jenisPembayaran}`}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {t.buktiUrl ? (
                    <a href={t.buktiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                      <ImageIcon className="w-3 h-3" /> Lihat Bukti
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400 mt-1 block">Tidak ada bukti</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {t.status === 'pending' && <span className="inline-flex items-center gap-1 text-orange-600 font-medium"><Clock className="w-4 h-4" /> Pending</span>}
                  {t.status === 'berhasil' && <span className="inline-flex items-center gap-1 text-emerald-600 font-medium"><CheckCircle2 className="w-4 h-4" /> Berhasil</span>}
                  {t.status === 'gagal' && <span className="inline-flex items-center gap-1 text-rose-600 font-medium"><XCircle className="w-4 h-4" /> Ditolak</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  {t.status === 'pending' ? (
                    <div className="flex gap-2 justify-end">
                      <button 
                        onClick={() => handleSetuju(t)}
                        disabled={isPending}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        Setuju
                      </button>
                      <button 
                        onClick={() => handleTolak(t)}
                        disabled={isPending}
                        className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200 transition-colors disabled:opacity-50"
                      >
                        Tolak
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-slate-400 text-sm">Selesai</span>
                      <button 
                        onClick={() => handleHapus(t)}
                        disabled={isPending}
                        className="text-xs text-rose-500 hover:text-rose-700 underline disabled:opacity-50"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {displayedData.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  Tidak ada permohonan top-up.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { formatRp } from "@/lib/utils";
import { buatPesanan } from "./actions";
import { Clock, CheckCircle, XCircle, Archive, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert";

export default function KebutuhanOrtuClient({ katalog, riwayatPesanan, saldo }: { katalog: any[], riwayatPesanan: any[], saldo: number }) {
  const [activeTab, setActiveTab] = useState<'katalog' | 'pesanan'>('katalog');
  const [filterKategori, setFilterKategori] = useState<'semua' | 'gratis' | 'berbayar'>('semua');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();

  const handlePesan = async (item: any) => {
    if (item.kategori === 'berbayar' && saldo < item.harga) {
      showError("Saldo Tidak Cukup", `Saldo Anda: ${formatRp(saldo)}\nHarga Barang: ${formatRp(item.harga)}`);
      return;
    }

    const confirmMsg = item.kategori === 'berbayar' 
      ? `Anda akan memesan ${item.nama} seharga ${formatRp(item.harga)}. Saldo tabungan akan langsung dipotong. Lanjutkan?`
      : `Pesan ${item.nama} secara gratis?`;

    const isConfirmed = await showConfirm("Pesan Barang?", confirmMsg, "Ya, Pesan", false);

    if (isConfirmed) {
      setLoadingId(item.id);
      const res = await buatPesanan(item.id);
      setLoadingId(null);
      
      if (res.success) {
        await showSuccess("Berhasil", "Pesanan berhasil dibuat. Silakan tunggu konfirmasi Admin.");
        router.refresh();
        setActiveTab('pesanan');
      } else {
        showError("Gagal", res.message);
      }
    }
  };

  const filteredKatalog = filterKategori === 'semua' ? katalog : katalog.filter(k => k.kategori === filterKategori);

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      <div className="sticky top-0 z-30 bg-slate-50 pt-4 pb-4 px-4 sm:px-0 shadow-sm border-b border-slate-100 mb-6 flex flex-col gap-4">
        <div className="bg-emerald-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-1">Kebutuhan Santri</h1>
            <p className="text-emerald-100 text-sm">Pesan kebutuhan harian atau seragam langsung dari sini.</p>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Archive className="w-24 h-24" />
          </div>
        </div>

        <div className="flex gap-2 p-1 bg-white rounded-xl shadow-sm overflow-x-auto">
          <button onClick={() => setActiveTab('katalog')} className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'katalog' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            Katalog Barang
          </button>
          <button onClick={() => setActiveTab('pesanan')} className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === 'pesanan' ? 'bg-emerald-50 text-emerald-700' : 'text-slate-500 hover:bg-slate-50'}`}>
            Pesanan Saya
          </button>
        </div>

        {activeTab === 'katalog' && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            <button onClick={() => setFilterKategori('semua')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${filterKategori === 'semua' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>Semua</button>
            <button onClick={() => setFilterKategori('gratis')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${filterKategori === 'gratis' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>Gratis</button>
            <button onClick={() => setFilterKategori('berbayar')} className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border ${filterKategori === 'berbayar' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-600 border-slate-200'}`}>Berbayar</button>
          </div>
        )}
      </div>

      {activeTab === 'katalog' && (
        <div className="space-y-4 px-4 sm:px-0">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredKatalog.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col sm:flex-row gap-4">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-100 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 mx-auto sm:mx-0">
                  {item.urlGambar ? <img src={item.urlGambar} alt={item.nama} className="w-full h-full object-cover" /> : <Archive className="w-8 h-8 text-slate-400" />}
                </div>
                <div className="flex-1 flex flex-col justify-between text-center sm:text-left">
                  <div>
                    <h3 className="font-bold text-slate-800 line-clamp-1">{item.nama}</h3>
                    <div className="flex gap-2 items-center justify-center sm:justify-start mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${item.kategori === 'gratis' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                        {item.kategori === 'gratis' ? 'Gratis' : 'Berbayar'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">Sisa: {item.stok}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.deskripsi}</p>
                  </div>
                  <div className="mt-3">
                    <p className="font-bold text-emerald-600 text-sm mb-2">{item.kategori === 'berbayar' ? formatRp(item.harga) : 'Rp 0'}</p>
                    <button 
                      onClick={() => handlePesan(item)} 
                      disabled={loadingId === item.id || item.stok <= 0}
                      className="w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {loadingId === item.id ? 'Memproses...' : (item.stok <= 0 ? 'Habis' : 'Pesan')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {filteredKatalog.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
                Belum ada barang di katalog ini.
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'pesanan' && (
        <div className="space-y-3 px-4 sm:px-0">
          {riwayatPesanan.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className={`p-3 rounded-xl shrink-0 ${p.status === 'menunggu' ? 'bg-amber-50 text-amber-600' : p.status === 'selesai' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {p.status === 'menunggu' && <Clock className="w-6 h-6" />}
                {p.status === 'selesai' && <CheckCircle className="w-6 h-6" />}
                {p.status === 'dibatalkan' && <XCircle className="w-6 h-6" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-800">{p.namaBarang}</h4>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold ${p.kategori === 'gratis' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {p.kategori === 'gratis' ? 'Gratis' : 'Berbayar'}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${p.status === 'menunggu' ? 'bg-amber-100 text-amber-700' : p.status === 'selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {p.status}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  <p>Tanggal Pesan: {new Date(p.waktuPesan).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  {p.kategori === 'berbayar' && <p>Harga: <span className="font-semibold text-slate-700">{formatRp(p.hargaSaatPesan)}</span></p>}
                </div>
                {p.status === 'dibatalkan' && p.keterangan && (
                  <div className="mt-2 p-2 bg-rose-50 border border-rose-100 rounded-md flex gap-2 items-start text-xs text-rose-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p>Alasan batal: {p.keterangan}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {riwayatPesanan.length === 0 && (
            <div className="py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
              Belum ada riwayat pesanan.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

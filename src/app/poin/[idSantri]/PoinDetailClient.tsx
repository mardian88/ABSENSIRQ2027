"use client";

import { useState } from "react";
import Link from "next/link";
import { getRiwayatPoin, tambahPoinSantri } from "../actions";
import { POIN_AWAL } from "@/lib/constants";
import { formatDateID, formatTimeID } from "@/lib/date";
import { ArrowLeft, Plus, Award, AlertCircle, History, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

type DetailData = Awaited<ReturnType<typeof getRiwayatPoin>>;
type Kategori = { id: string; nama: string; jenis: string; nilaiPoin: number; };

export function PoinDetailClient({ initialData, kategoriPoin }: { initialData: DetailData, kategoriPoin: Kategori[] }) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [jenis, setJenis] = useState<"reward" | "punishment">("reward");
  const [idKategori, setIdKategori] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [nilaiCustom, setNilaiCustom] = useState("");

  if (!data) return <div className="p-8 text-center text-slate-500">Data santri tidak ditemukan</div>;

  const { santri, totalPoin, riwayat } = data;
  const listKategori = kategoriPoin.filter(k => k.jenis === jenis);
  
  // Auto-fill Nilai jika Kategori Master dipilih
  const handleKategoriChange = (val: string) => {
    setIdKategori(val);
    if (val !== "custom") {
      const selected = kategoriPoin.find(k => k.id === val);
      if (selected) {
        setNilaiCustom(selected.nilaiPoin.toString());
        setKeterangan(selected.nama);
      }
    } else {
      setNilaiCustom("");
      setKeterangan("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keterangan || !nilaiCustom) return;

    setLoading(true);
    try {
      await tambahPoinSantri({
        idSantri: santri.id,
        idKategoriPoin: idKategori === "custom" ? undefined : idKategori,
        jenis,
        keterangan,
        nilaiPoin: parseInt(nilaiCustom, 10)
      });
      
      toast.success("Poin berhasil ditambahkan!");
      setShowForm(false);
      
      // Refresh Data
      const res = await getRiwayatPoin(santri.id);
      setData(res);
      
      // Reset
      setIdKategori("");
      setKeterangan("");
      setNilaiCustom("");
      
    } catch (err) {
      toast.error("Gagal menambahkan poin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/poin" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Detail Poin Santri</h1>
          <p className="text-sm text-slate-500">Kelola riwayat prestasi dan pelanggaran santri</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Profil & Form Input */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-md">
              <span className="text-3xl font-black text-slate-400">
                {santri.namaLengkap.charAt(0)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-800">{santri.namaLengkap}</h2>
            <p className="text-sm text-slate-500 mb-6">NIS: {santri.nomorInduk}</p>

            <div className={`p-4 rounded-xl border ${totalPoin >= POIN_AWAL ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Poin Saat Ini</p>
              <div className={`text-5xl font-black ${totalPoin >= POIN_AWAL ? 'text-emerald-600' : 'text-rose-600'}`}>
                {totalPoin}
              </div>
            </div>
            
            <button 
              onClick={() => setShowForm(!showForm)}
              className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition-all"
            >
              {showForm ? "Batal Tambah" : <><Plus className="w-5 h-5" /> Input Poin Baru</>}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 animate-in slide-in-from-top-4 duration-300">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-500" /> Input Data Baru
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Jenis Input</label>
                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setJenis("reward")}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${jenis === 'reward' ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      Prestasi (+)
                    </button>
                    <button 
                      type="button"
                      onClick={() => setJenis("punishment")}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg border transition-all ${jenis === 'punishment' ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      Pelanggaran (-)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Kategori (Dari Master Data)</label>
                  <select 
                    required
                    value={idKategori}
                    onChange={(e) => handleKategoriChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-slate-400"
                  >
                    <option value="" disabled>-- Pilih Kategori --</option>
                    {listKategori.map(k => (
                      <option key={k.id} value={k.id}>{k.nama} (Poin {k.nilaiPoin})</option>
                    ))}
                    <option value="custom">-- Input Kustom (Lainnya) --</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Keterangan / Alasan</label>
                  <Input 
                    required
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Deskripsi kegiatan..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Besaran Poin (Angka)</label>
                  <Input 
                    type="number"
                    required
                    min="1"
                    value={nilaiCustom}
                    onChange={(e) => setNilaiCustom(e.target.value)}
                    placeholder="Contoh: 10"
                  />
                </div>

                <Button disabled={loading} type="submit" className={`w-full py-6 font-bold text-base shadow-md ${jenis === 'reward' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4 mr-2" /> Simpan Poin</>}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Kolom Kanan: Histori */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-full">
            <h3 className="font-bold text-slate-800 text-lg mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
              <History className="w-5 h-5 text-slate-400" /> Log Riwayat Poin
            </h3>

            {riwayat.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <History className="w-8 h-8 text-slate-300" />
                </div>
                <p>Belum ada catatan riwayat poin untuk santri ini.</p>
              </div>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {riwayat.map((item) => (
                  <div key={item.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    
                    {/* Icon Marker */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 ${item.jenis === 'reward' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {item.jenis === 'reward' ? <Award className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>

                    {/* Card Body */}
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${item.jenis === 'reward' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {item.jenis === 'reward' ? 'PRESTASI' : 'PELANGGARAN'}
                        </span>
                        <span className={`font-black text-lg ${item.jenis === 'reward' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.jenis === 'reward' ? '+' : '-'}{item.nilaiPoin}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-800 leading-tight mb-1">{item.keterangan}</p>
                      <div className="text-xs text-slate-500 font-medium">
                        {formatDateID(item.waktuDitambahkan)} Pukul {formatTimeID(item.waktuDitambahkan)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

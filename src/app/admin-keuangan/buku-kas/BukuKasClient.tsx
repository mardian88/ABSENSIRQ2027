"use client";

import { useState, useTransition, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Trash2, ArrowDownRight, ArrowUpRight, Filter, Calendar, Download, Sparkles } from "lucide-react";
import { tambahTransaksiBukuKas, hapusTransaksiBukuKas, getBukuKasLengkap, BukuKasEntry } from "./actions";
import { showSuccess, showError, showConfirm } from "@/lib/sweetalert";
import { useForm } from "react-hook-form";
import * as XLSX from 'xlsx';

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export function BukuKasClient() {
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [data, setData] = useState<BukuKasEntry[]>([]);
  const [totalPemasukan, setTotalPemasukan] = useState(0);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<'semua' | 'pemasukan' | 'pengeluaran'>('semua');

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<{
    jenis: 'pemasukan' | 'pengeluaran';
    sumberDana?: string;
    kategoriManual?: string;
    nominal: number;
    keterangan: string;
    tanggal: string;
  }>({
    defaultValues: {
      jenis: 'pemasukan',
      tanggal: format(new Date(), 'yyyy-MM-dd'),
      sumberDana: 'lainnya'
    }
  });

  const watchJenis = watch("jenis");
  const watchSumberDana = watch("sumberDana");

  useEffect(() => {
    fetchData();
  }, [bulan, tahun]);

  const fetchData = () => {
    setLoading(true);
    getBukuKasLengkap(bulan, tahun).then((res) => {
      if (res.success) {
        setData(res.data);
        setTotalPemasukan(res.totalPemasukan);
        setTotalPengeluaran(res.totalPengeluaran);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const onSubmit = (formData: any) => {
    startTransition(async () => {
      try {
        let finalKategori = formData.sumberDana === 'lainnya' ? formData.kategoriManual : formData.sumberDana;
        
        await tambahTransaksiBukuKas({
          jenis: formData.jenis,
          kategori: finalKategori || 'Lain-lain',
          nominal: Number(formData.nominal),
          keterangan: formData.keterangan,
          tanggal: new Date(formData.tanggal)
        });
        
        setIsModalOpen(false);
        reset();
        showSuccess("Berhasil", "Transaksi berhasil ditambahkan");
        fetchData(); // Refresh data
      } catch (err) {
        showError("Gagal", "Terjadi kesalahan saat menambah transaksi");
      }
    });
  };

  const handleHapus = async (id: string) => {
    const confirmed = await showConfirm(
      "Hapus Transaksi?",
      "Apakah Anda yakin ingin menghapus catatan transaksi ini? Data akan hilang permanen."
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        await hapusTransaksiBukuKas(id);
        showSuccess("Berhasil", "Transaksi dihapus");
        fetchData();
      } catch (err) {
        showError("Gagal", "Gagal menghapus transaksi");
      }
    });
  };

  const handleExportExcel = () => {
    const wsData = data.map((d, index) => ({
      "No": index + 1,
      "Tanggal": format(new Date(d.tanggal), 'dd/MM/yyyy'),
      "Jenis": d.jenis.toUpperCase(),
      "Kategori": d.kategori,
      "Keterangan": d.keterangan || '-',
      "Pemasukan": d.jenis === 'pemasukan' ? d.nominal : 0,
      "Pengeluaran": d.jenis === 'pengeluaran' ? d.nominal : 0,
      "Admin": d.namaAdmin || '-',
      "Otomatis": d.isOtomatis ? 'Ya' : 'Tidak'
    }));

    const ws = XLSX.utils.json_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Buku Kas");
    XLSX.writeFile(wb, `Buku_Kas_${BULAN_NAMES[bulan-1]}_${tahun}.xlsx`);
  };

  const filteredData = data.filter(d => filter === 'semua' ? true : d.jenis === filter);
  const saldo = totalPemasukan - totalPengeluaran;

  return (
    <div className="space-y-6">
      
      {/* Dashboard Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Pemasukan</p>
          <p className="text-2xl font-bold text-emerald-600">Rp {new Intl.NumberFormat('id-ID').format(totalPemasukan)}</p>
          <p className="text-xs text-slate-400 mt-2">Akumulasi seluruh pemasukan bulan ini</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Pengeluaran</p>
          <p className="text-2xl font-bold text-rose-600">Rp {new Intl.NumberFormat('id-ID').format(totalPengeluaran)}</p>
          <p className="text-xs text-slate-400 mt-2">Termasuk kafalah dan pengeluaran manual</p>
        </div>
        <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700 shadow-sm text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-slate-700 rounded-full opacity-50"></div>
          <div className="relative z-10">
            <p className="text-sm font-medium text-slate-300 mb-1">Saldo Bersih Bulan Ini</p>
            <p className="text-3xl font-bold">Rp {new Intl.NumberFormat('id-ID').format(saldo)}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-20">
        
        <div className="flex bg-slate-100 rounded-lg p-1 w-full md:w-auto">
          <button 
            onClick={() => setFilter('semua')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'semua' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Semua
          </button>
          <button 
            onClick={() => setFilter('pemasukan')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'pemasukan' ? 'bg-white shadow-sm text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pemasukan
          </button>
          <button 
            onClick={() => setFilter('pengeluaran')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'pengeluaran' ? 'bg-white shadow-sm text-rose-700' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Pengeluaran
          </button>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2 bg-slate-50">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
              className="bg-transparent text-sm focus:outline-none font-medium text-slate-700 cursor-pointer"
            >
              {BULAN_NAMES.map((b, i) => (
                <option key={b} value={i + 1}>{b}</option>
              ))}
            </select>
            <span className="text-slate-300">|</span>
            <select
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="bg-transparent text-sm focus:outline-none font-medium text-slate-700 cursor-pointer"
            >
              {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span> Excel
          </button>

          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Transaksi</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
             <p>Merangkum buku kas...</p>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Keterangan</th>
                  <th className="px-6 py-4 text-right">Nominal (Rp)</th>
                  <th className="px-6 py-4">Pencatat</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((tx, idx) => (
                  <tr key={tx.id || idx} className={`transition-colors ${tx.isOtomatis ? 'bg-slate-50/50 hover:bg-slate-50' : 'hover:bg-slate-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-700 font-medium">
                      {format(new Date(tx.tanggal), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                        tx.jenis === 'pemasukan' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {tx.jenis === 'pemasukan' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {tx.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-2">
                        {tx.isOtomatis && (
                          <span title="Dihitung Otomatis oleh Sistem" className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 shrink-0">
                            <Sparkles className="w-3 h-3" />
                          </span>
                        )}
                        <span className="line-clamp-2">{tx.keterangan || '-'}</span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-bold text-right ${tx.jenis === 'pemasukan' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.jenis === 'pemasukan' ? '+' : '-'} {new Intl.NumberFormat('id-ID').format(tx.nominal)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {tx.namaAdmin}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {!tx.isOtomatis ? (
                        <button 
                          onClick={() => handleHapus(tx.id)}
                          disabled={isPending}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 inline-flex"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-slate-300 italic">Otomatis</span>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center">
                        <Filter className="w-12 h-12 text-slate-300 mb-3" />
                        <p>Tidak ada transaksi ditemukan pada bulan ini.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">Tambah Transaksi Manual</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="cursor-pointer">
                    <input type="radio" value="pemasukan" {...register("jenis")} className="peer sr-only" />
                    <div className="text-center px-3 py-2.5 rounded-lg border border-slate-200 peer-checked:border-emerald-500 peer-checked:bg-emerald-50 peer-checked:text-emerald-700 font-medium transition-colors">
                      Pemasukan
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input type="radio" value="pengeluaran" {...register("jenis")} className="peer sr-only" />
                    <div className="text-center px-3 py-2.5 rounded-lg border border-slate-200 peer-checked:border-rose-500 peer-checked:bg-rose-50 peer-checked:text-rose-700 font-medium transition-colors">
                      Pengeluaran
                    </div>
                  </label>
                </div>
              </div>

              {watchJenis === 'pengeluaran' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sumber Dana (Kategori)</label>
                  <select 
                    {...register("sumberDana")}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white cursor-pointer"
                  >
                    <option value="lainnya">Manual / Lainnya...</option>
                    <option value="Kas Umum">Kas Umum</option>
                    <option value="Infaq Santri">Infaq Santri</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Kategori Pemasukan</label>
                  <select 
                    {...register("sumberDana")}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white cursor-pointer"
                  >
                    <option value="Donasi">Donasi</option>
                    <option value="Bantuan Sosial">Bantuan Sosial</option>
                    <option value="Hibah">Hibah</option>
                    <option value="lainnya">Lainnya...</option>
                  </select>
                </div>
              )}

              {watchSumberDana === 'lainnya' && (
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategori Spesifik</label>
                  <input 
                    type="text" 
                    {...register("kategoriManual", { required: watchSumberDana === 'lainnya' })} 
                    placeholder="Misal: Acara 17-an, Mabit, Mukhoyam"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                  <input 
                    type="number" 
                    {...register("nominal", { required: true, min: 1 })} 
                    placeholder="0"
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                <input 
                  type="date" 
                  {...register("tanggal", { required: true })} 
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan / Rincian Tambahan</label>
                <textarea 
                  {...register("keterangan")} 
                  rows={2}
                  placeholder="Penjelasan ringkas transaksi"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

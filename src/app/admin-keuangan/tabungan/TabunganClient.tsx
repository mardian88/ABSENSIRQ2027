"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Calendar, Download, Search, Plus, Minus, X, Wallet, Trophy, AlertCircle, Eye, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getDataTabungan, submitTransaksiTabungan } from "./actions";
import { showSuccess, showError, showConfirm } from "@/lib/sweetalert";
import { useForm } from "react-hook-form";
import * as XLSX from 'xlsx';

const BULAN_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

interface SantriTabungan {
  id: string;
  namaLengkap: string;
  nomorInduk: string;
  saldoTabungan: number | null;
}

interface RiwayatTabungan {
  id: string;
  idSantri: string;
  jenis: string;
  nominal: number;
  keterangan: string;
  tanggal: Date;
  namaAdmin: string | null;
}

export function TabunganClient() {
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState("");
  
  const [santriList, setSantriList] = useState<SantriTabungan[]>([]);
  const [riwayat, setRiwayat] = useState<RiwayatTabungan[]>([]);
  const [loading, setLoading] = useState(true);

  const [isPending, startTransition] = useTransition();

  // Modal Setor / Tarik
  const [modalAction, setModalAction] = useState<{ isOpen: boolean, type: 'setor' | 'tarik', santriId: string | null }>({ isOpen: false, type: 'setor', santriId: null });
  
  // Modal Detail
  const [modalDetail, setModalDetail] = useState<{ isOpen: boolean, santriId: string | null }>({ isOpen: false, santriId: null });

  const { register, handleSubmit, reset, watch, formState: { errors }, setValue } = useForm<{
    nominal: number;
    keterangan: string;
  }>();

  useEffect(() => {
    fetchData();
  }, [bulan, tahun]);

  const fetchData = () => {
    setLoading(true);
    getDataTabungan(bulan, tahun).then((res) => {
      if (res.success) {
        setSantriList(res.santri || []);
        setRiwayat(res.riwayat || []);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  };

  const onSubmitAction = (data: any) => {
    if (!modalAction.santriId) return;

    startTransition(async () => {
      try {
        await submitTransaksiTabungan({
          idSantri: modalAction.santriId!,
          jenis: modalAction.type,
          nominal: Number(data.nominal),
          keterangan: data.keterangan || (modalAction.type === 'setor' ? 'Setor tunai' : 'Tarik tunai')
        });
        
        showSuccess("Berhasil", `Transaksi ${modalAction.type} berhasil disimpan`);
        setModalAction({ isOpen: false, type: 'setor', santriId: null });
        reset();
        fetchData();
      } catch (err: any) {
        showError("Gagal", err.message || "Terjadi kesalahan sistem");
      }
    });
  };

  // Memoized Computations
  const filteredSantri = useMemo(() => {
    return santriList.filter(s => 
      s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.nomorInduk.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [santriList, searchQuery]);

  const totalTabunganSeluruhnya = santriList.reduce((acc, s) => acc + (s.saldoTabungan || 0), 0);
  const santriTeratas = [...santriList].sort((a, b) => (b.saldoTabungan || 0) - (a.saldoTabungan || 0))[0];

  const handleExportExcel = () => {
    // Sheet 1: Saldo Akhir
    const ws1Data = santriList.map((s, idx) => ({
      "No": idx + 1,
      "NIS": s.nomorInduk,
      "Nama Santri": s.namaLengkap,
      "Saldo Akhir (Rp)": s.saldoTabungan || 0
    }));

    // Sheet 2: Detail Riwayat Bulan Ini
    const ws2Data = riwayat.map((r, idx) => {
      const santri = santriList.find(s => s.id === r.idSantri);
      return {
        "No": idx + 1,
        "Tanggal & Waktu": format(new Date(r.tanggal), 'dd/MM/yyyy HH:mm:ss'),
        "NIS": santri?.nomorInduk || '-',
        "Nama Santri": santri?.namaLengkap || 'Tidak Ditemukan',
        "Jenis": r.jenis.toUpperCase(),
        "Nominal (Rp)": r.nominal,
        "Keterangan": r.keterangan || '-',
        "Admin": r.namaAdmin || '-'
      };
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(ws1Data);
    const ws2 = XLSX.utils.json_to_sheet(ws2Data);

    XLSX.utils.book_append_sheet(wb, ws1, "Saldo Akhir");
    XLSX.utils.book_append_sheet(wb, ws2, `Riwayat ${BULAN_NAMES[bulan-1]} ${tahun}`);

    XLSX.writeFile(wb, `Rekap_Tabungan_Santri_${BULAN_NAMES[bulan-1]}_${tahun}.xlsx`);
  };

  const selectedSantriName = santriList.find(s => s.id === modalDetail.santriId)?.namaLengkap;
  const selectedSantriHistory = riwayat.filter(r => r.idSantri === modalDetail.santriId);

  return (
    <div className="space-y-6">
      
      {/* Dashboard Bento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-600 p-6 rounded-2xl shadow-sm text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-4 -bottom-10 opacity-20">
            <Wallet className="w-48 h-48" />
          </div>
          <div className="relative z-10">
            <p className="text-emerald-100 font-medium mb-1">Total Tabungan Keseluruhan</p>
            <h3 className="text-4xl font-bold">Rp {new Intl.NumberFormat('id-ID').format(totalTabunganSeluruhnya)}</h3>
            <p className="text-emerald-200 text-sm mt-3">Akumulasi dari {santriList.length} santri aktif</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <p className="text-slate-500 font-medium mb-1 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              Tabungan Terbanyak
            </p>
            {santriTeratas ? (
              <>
                <h3 className="text-2xl font-bold text-slate-800">{santriTeratas.namaLengkap}</h3>
                <p className="text-indigo-600 font-semibold mt-1">Rp {new Intl.NumberFormat('id-ID').format(santriTeratas.saldoTabungan || 0)}</p>
              </>
            ) : (
              <p className="text-slate-400">Belum ada data</p>
            )}
          </div>
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
            <Trophy className="w-8 h-8 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-20">
        
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari nama santri atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow outline-none text-sm"
          />
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
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
           <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
             <p>Memuat data tabungan...</p>
           </div>
        ) : (
          <div className="overflow-auto max-h-[65vh] pb-4 relative">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm border-b border-slate-200">
                <tr className="text-slate-600 font-medium">
                  <th className="px-6 py-4">No</th>
                  <th className="px-6 py-4">Nama Santri</th>
                  <th className="px-6 py-4">NIS</th>
                  <th className="px-6 py-4 text-right">Saldo Akhir (Rp)</th>
                  <th className="px-6 py-4 text-center">Aksi (Setor/Tarik)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSantri.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-slate-500">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setModalDetail({ isOpen: true, santriId: s.id })}
                        className="font-bold text-slate-800 hover:text-indigo-600 flex items-center gap-2 transition-colors text-left"
                        title="Klik untuk melihat detail transaksi"
                      >
                        {s.namaLengkap}
                        <Eye className="w-4 h-4 text-slate-300 group-hover:text-indigo-400" />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{s.nomorInduk}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                      {new Intl.NumberFormat('id-ID').format(s.saldoTabungan || 0)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button 
                          onClick={() => setModalAction({ isOpen: true, type: 'setor', santriId: s.id })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors font-medium text-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Setor
                        </button>
                        <button 
                          onClick={() => setModalAction({ isOpen: true, type: 'tarik', santriId: s.id })}
                          disabled={(s.saldoTabungan || 0) <= 0}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Minus className="w-3.5 h-3.5" />
                          Tarik
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSantri.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center">
                        <AlertCircle className="w-10 h-10 text-slate-300 mb-3" />
                        <p>Tidak ada santri ditemukan.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Aksi (Setor/Tarik) */}
      {modalAction.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className={`px-6 py-4 border-b flex justify-between items-center text-white ${modalAction.type === 'setor' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
              <h2 className="text-lg font-bold">
                {modalAction.type === 'setor' ? 'Setor Tabungan' : 'Tarik Tabungan'}
              </h2>
              <button onClick={() => setModalAction({ isOpen: false, type: 'setor', santriId: null })} className="text-white/80 hover:text-white">
                <span className="text-2xl leading-none">&times;</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit(onSubmitAction)} className="p-6 space-y-5">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-4">
                <p className="text-xs text-slate-500 mb-1">Nama Santri:</p>
                <p className="font-semibold text-slate-800">
                  {santriList.find(s => s.id === modalAction.santriId)?.namaLengkap}
                </p>
                <p className="text-xs text-slate-500 mt-2 mb-1">Saldo Saat Ini:</p>
                <p className="font-semibold text-indigo-600">
                  Rp {new Intl.NumberFormat('id-ID').format(santriList.find(s => s.id === modalAction.santriId)?.saldoTabungan || 0)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                  <input 
                    type="number" 
                    {...register("nominal", { 
                      required: true, 
                      min: 1, 
                      max: modalAction.type === 'tarik' ? (santriList.find(s => s.id === modalAction.santriId)?.saldoTabungan || 0) : undefined 
                    })} 
                    placeholder="0"
                    autoFocus
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan Tambahan</label>
                <textarea 
                  {...register("keterangan")} 
                  rows={2}
                  placeholder={modalAction.type === 'setor' ? 'Setor tunai' : 'Tarik tunai'}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setModalAction({ isOpen: false, type: 'setor', santriId: null })}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${modalAction.type === 'setor' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                >
                  {isPending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Riwayat */}
      {modalDetail.isOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Riwayat Transaksi</h2>
                <p className="text-sm text-indigo-600 font-medium">{selectedSantriName}</p>
              </div>
              <button onClick={() => setModalDetail({ isOpen: false, santriId: null })} className="text-slate-400 hover:text-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-auto bg-slate-50/50">
              <div className="mb-4 text-sm font-medium text-slate-500 flex items-center justify-between">
                <span>Bulan: {BULAN_NAMES[bulan-1]} {tahun}</span>
                <span className="text-slate-400 font-normal italic">*Berdasarkan filter utama</span>
              </div>

              {selectedSantriHistory.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-xl border border-slate-200">
                  <p className="text-slate-500">Tidak ada riwayat transaksi di bulan ini.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedSantriHistory.map(r => (
                    <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm hover:shadow transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${r.jenis === 'setor' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {r.jenis === 'setor' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 capitalize">{r.jenis} Tabungan</p>
                          <p className="text-xs text-slate-500 mt-0.5">{format(new Date(r.tanggal), "dd MMM yyyy, HH:mm", { locale: localeId })}</p>
                          <p className="text-sm text-slate-600 mt-1 line-clamp-1">{r.keterangan || '-'}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-bold text-lg ${r.jenis === 'setor' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {r.jenis === 'setor' ? '+' : '-'} {new Intl.NumberFormat('id-ID').format(r.nominal)}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">oleh: {r.namaAdmin}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, Calendar, CreditCard, User, Clock, AlertCircle, CheckCircle2, TrendingUp, Wallet, Banknote } from "lucide-react";
import { format } from "date-fns";
import { getRekapPembayaranSemua } from "./actions";

interface Tagihan {
  id: string;
  kode: string | null;
  namaPembayaran: string;
  nominalDefault: number;
}

interface Santri {
  id: string;
  namaLengkap: string;
  nomorInduk: string;
  statusSantri: string;
}

interface Riwayat {
  id: string;
  idSantri: string;
  idTagihan: string | null;
  bulan: number;
  tahun: number;
  nominal: number;
  tanggalBayar: Date | null;
  metodeBayar: string | null;
  status: string;
  namaPenerima: string | null;
}

const BULAN_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const METODE_LABEL: Record<string, string> = {
  'tunai': 'Tunai',
  'potong_saldo': 'Saldo',
  'transfer': 'Transfer',
  'qris': 'QRIS'
};

export function MonitoringClient({ 
  tagihanList, 
  santriList, 
  totalKasBulanIni, 
  totalInfaqBulanIni 
}: { 
  tagihanList: Tagihan[], 
  santriList: Santri[],
  totalKasBulanIni: number,
  totalInfaqBulanIni: number
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"semua" | "lunas_berjalan" | "menunggak">("semua");
  const [legendFilter, setLegendFilter] = useState<"lunas_keduanya" | "hanya_kas" | "hanya_infaq" | "belum_lunas" | null>(null);
  const [tahun, setTahun] = useState<number>(new Date().getFullYear());
  
  const [rekapData, setRekapData] = useState<Riwayat[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const tagihanKas = tagihanList.find(t => t.kode === 'KAS_BULANAN' || t.namaPembayaran.toLowerCase().includes('kas'));
  const tagihanInfaq = tagihanList.find(t => t.namaPembayaran.toLowerCase().includes('infaq'));

  useEffect(() => {
    setLoading(true);
    getRekapPembayaranSemua(tahun).then((data) => {
      setRekapData(data);
      setLoading(false);
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, [tahun]);

  // Aggregate data per santri
  const currentMonth = new Date().getMonth() + 1;
  const isCurrentYear = tahun === new Date().getFullYear();
  const maxBulanWajib = isCurrentYear ? currentMonth : (tahun < new Date().getFullYear() ? 12 : 0);

  const santriStats = useMemo(() => {
    return santriList.map(santri => {
      const santriRiwayat = rekapData.filter(r => r.idSantri === santri.id);
      
      let totalBulanLunasSemua = 0;
      
      let hasLunasKeduanya = false;
      let hasHanyaKas = false;
      let hasHanyaInfaq = false;
      let hasBelumLunas = false;

      // Cek kelunasan untuk setiap bulan
      for (let m = 1; m <= 12; m++) {
        const isKasPaid = santriRiwayat.some(r => r.bulan === m && r.status === 'lunas' && r.idTagihan === tagihanKas?.id);
        const isInfaqPaid = santriRiwayat.some(r => r.bulan === m && r.status === 'lunas' && r.idTagihan === tagihanInfaq?.id);
        
        const lunas = isKasPaid && isInfaqPaid;
        
        // Track colors up to maxBulanWajib
        if (m <= Math.max(1, maxBulanWajib)) {
          if (isKasPaid && isInfaqPaid) hasLunasKeduanya = true;
          else if (isKasPaid && !isInfaqPaid) hasHanyaKas = true;
          else if (!isKasPaid && isInfaqPaid) hasHanyaInfaq = true;
          else hasBelumLunas = true;
        }

        if (lunas) {
          totalBulanLunasSemua++;
        }
      }

      const checkMonth = Math.max(1, maxBulanWajib);
      const isKasPaidCurrent = santriRiwayat.some(r => r.bulan === checkMonth && r.status === 'lunas' && r.idTagihan === tagihanKas?.id);
      const isInfaqPaidCurrent = santriRiwayat.some(r => r.bulan === checkMonth && r.status === 'lunas' && r.idTagihan === tagihanInfaq?.id);
      const lunasSampaiBulanIni = isKasPaidCurrent && isInfaqPaidCurrent;

      return {
        ...santri,
        riwayat: santriRiwayat,
        isLunasBulanIni: lunasSampaiBulanIni,
        totalBulanLunasSemua,
        hasLunasKeduanya,
        hasHanyaKas,
        hasHanyaInfaq,
        hasBelumLunas
      };
    });
  }, [santriList, rekapData, tagihanKas, tagihanInfaq, maxBulanWajib]);

  // Filter
  const filteredSantri = useMemo(() => {
    return santriStats.filter(s => {
      const matchSearch = s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.nomorInduk.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchFilter = true;
      if (filterStatus === 'lunas_berjalan') matchFilter = s.isLunasBulanIni;
      if (filterStatus === 'menunggak') matchFilter = !s.isLunasBulanIni;

      let matchLegend = true;
      if (legendFilter === 'lunas_keduanya') matchLegend = s.hasLunasKeduanya;
      if (legendFilter === 'hanya_kas') matchLegend = s.hasHanyaKas;
      if (legendFilter === 'hanya_infaq') matchLegend = s.hasHanyaInfaq;
      if (legendFilter === 'belum_lunas') matchLegend = s.hasBelumLunas;

      return matchSearch && matchFilter && matchLegend;
    });
  }, [santriStats, searchQuery, filterStatus, legendFilter]);

  const countLunas = santriStats.filter(s => s.isLunasBulanIni).length;
  const countMenunggak = santriStats.length - countLunas;
  
  const formatRupiah = (nom: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(nom);

  return (
    <div className="space-y-6">
      {/* Bento Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Main large widget */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 shadow-sm border border-slate-700 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
              <User className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Santri Aktif</p>
              <h3 className="text-3xl font-bold text-white">{santriList.length} <span className="text-lg font-normal text-slate-400">Santri</span></h3>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-emerald-500/10 rounded-xl p-4 flex-1 border border-emerald-500/20">
              <p className="text-emerald-400 text-xs font-medium mb-1">Lunas Bulan Ini</p>
              <p className="text-xl font-semibold text-emerald-50">{countLunas}</p>
            </div>
            <div className="bg-rose-500/10 rounded-xl p-4 flex-1 border border-rose-500/20">
              <p className="text-rose-400 text-xs font-medium mb-1">Ada Tunggakan</p>
              <p className="text-xl font-semibold text-rose-50">{countMenunggak}</p>
            </div>
          </div>
        </div>

        {/* Total Kas Widget */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10 flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
            <p className="text-slate-500 font-medium text-sm">Total Kas Bulan Ini</p>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-slate-800">{formatRupiah(totalKasBulanIni)}</h3>
            <p className="text-xs text-slate-400 mt-1">Akumulasi Kas Lunas</p>
          </div>
        </div>

        {/* Total Infaq Widget */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative z-10 flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
              <Banknote className="w-5 h-5" />
            </div>
            <p className="text-slate-500 font-medium text-sm">Total Infaq Bulan Ini</p>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-slate-800">{formatRupiah(totalInfaqBulanIni)}</h3>
            <p className="text-xs text-slate-400 mt-1">Akumulasi Infaq Lunas</p>
          </div>
        </div>
      </div>

      {/* Toolbar & Legend */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Cari nama santri atau NIS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow outline-none text-sm"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3 text-xs font-medium text-slate-500 bg-slate-50 p-1 rounded-lg border border-slate-200 w-full lg:w-auto">
          <button 
            onClick={() => setLegendFilter(legendFilter === 'lunas_keduanya' ? null : 'lunas_keduanya')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${legendFilter === 'lunas_keduanya' ? 'bg-white shadow-sm text-slate-800 ring-1 ring-emerald-200' : 'hover:bg-slate-100 hover:text-slate-700'}`}
          >
            <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm"></div>Lunas Keduanya
          </button>
          <button 
            onClick={() => setLegendFilter(legendFilter === 'hanya_kas' ? null : 'hanya_kas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${legendFilter === 'hanya_kas' ? 'bg-white shadow-sm text-slate-800 ring-1 ring-pink-200' : 'hover:bg-slate-100 hover:text-slate-700'}`}
          >
            <div className="w-3 h-3 rounded-full bg-pink-500 shadow-sm"></div>Hanya Kas
          </button>
          <button 
            onClick={() => setLegendFilter(legendFilter === 'hanya_infaq' ? null : 'hanya_infaq')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${legendFilter === 'hanya_infaq' ? 'bg-white shadow-sm text-slate-800 ring-1 ring-blue-200' : 'hover:bg-slate-100 hover:text-slate-700'}`}
          >
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>Hanya Infaq
          </button>
          <button 
            onClick={() => setLegendFilter(legendFilter === 'belum_lunas' ? null : 'belum_lunas')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${legendFilter === 'belum_lunas' ? 'bg-white shadow-sm text-slate-800 ring-1 ring-rose-200' : 'hover:bg-slate-100 hover:text-slate-700'}`}
          >
            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-sm"></div>Belum Lunas
          </button>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              <option value="semua">Semua Status</option>
              <option value="lunas_berjalan">Lunas Bulan Ini</option>
              <option value="menunggak">Ada Tunggakan</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white"
            >
              {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mb-4"></div>
            <p>Memuat data...</p>
          </div>
        ) : filteredSantri.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <AlertCircle className="w-10 h-10 mb-4 opacity-50" />
            <p>Tidak ada data yang cocok dengan pencarian.</p>
          </div>
        ) : (
          <div className="overflow-auto max-h-[65vh] pb-4 relative">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
              <thead className="sticky top-0 z-20">
                <tr className="bg-slate-50 text-slate-600 font-medium">
                  <th className="p-4 sticky left-0 top-0 bg-slate-50 z-30 shadow-[1px_1px_0_0_#e2e8f0] w-[20%] min-w-[200px]">Santri</th>
                  {BULAN_NAMES.map((bulan, index) => (
                    <th key={bulan} className={`p-4 text-center bg-slate-50 shadow-[0_1px_0_0_#e2e8f0] min-w-[64px] ${index === 11 ? 'pr-8 sm:pr-12' : ''}`}>{bulan}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSantri.map((santri) => (
                  <tr key={santri.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 shadow-[1px_0_0_0_#e2e8f0] transition-colors">
                      <div className="font-semibold text-slate-800">{santri.namaLengkap}</div>
                      <div className="text-xs text-slate-500">{santri.nomorInduk}</div>
                    </td>
                    {BULAN_NAMES.map((_, index) => {
                      const bulanNum = index + 1;
                      const isKasPaid = santri.riwayat.some(r => r.bulan === bulanNum && r.status === 'lunas' && r.idTagihan === tagihanKas?.id);
                      const isInfaqPaid = santri.riwayat.some(r => r.bulan === bulanNum && r.status === 'lunas' && r.idTagihan === tagihanInfaq?.id);
                      
                      const countPaid = (isKasPaid ? 1 : 0) + (isInfaqPaid ? 1 : 0);
                      const isLast = index === 11;
                      
                      let badge = null;
                      let tooltip = "";

                      if (countPaid === 2) {
                        tooltip = "Kas dan Infaq Lunas";
                        badge = (
                          <div className="w-8 h-8 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-5 h-5 stroke-[3]" />
                          </div>
                        );
                      } else if (countPaid === 1) {
                        tooltip = isKasPaid ? "Hanya Kas Lunas" : "Hanya Infaq Lunas";
                        const bgColor = isKasPaid ? "bg-pink-500" : "bg-blue-500";
                        badge = (
                          <div className={`w-8 h-8 mx-auto rounded-full ${bgColor} text-white flex items-center justify-center font-bold text-lg shadow-sm`}>
                            !
                          </div>
                        );
                      } else {
                        tooltip = "Kas dan Infaq Belum Dibayar";
                        badge = (
                          <div className="w-8 h-8 mx-auto rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-2xl shadow-sm leading-none pb-1">
                            -
                          </div>
                        );
                      }

                      return (
                        <td key={bulanNum} className={`p-4 text-center ${isLast ? 'pr-8 sm:pr-12' : ''}`}>
                          <div className="flex justify-center" title={tooltip}>
                            {badge}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

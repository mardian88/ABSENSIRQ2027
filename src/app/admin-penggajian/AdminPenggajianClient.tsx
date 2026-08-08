"use client";

import { useState, useEffect } from "react";
import { getLaporanPenggajian } from "./actions";
import { Download, Search, Loader2, Coins, Calendar } from "lucide-react";
import * as XLSX from "xlsx";

export function AdminPenggajianClient() {
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [bulan, tahun]);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getLaporanPenggajian(bulan, tahun);
    if (res.success) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(d => ({
      "NIP": d.nip,
      "Nama Guru": d.namaLengkap,
      "Jabatan": d.jabatan,
      "Kehadiran (Hari)": d.totalHadir,
      "Satuan Kafalah": d.satuanKafalah,
      "Total Gaji": d.totalGaji
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Gaji");
    XLSX.writeFile(wb, `Laporan-Gaji-${bulan}-${tahun}.xlsx`);
  };

  const totalPengeluaran = data.reduce((acc, curr) => acc + curr.totalGaji, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Laporan Kafalah / Penggajian</h2>
          <p className="text-sm text-slate-500">Kalkulasi gaji berdasarkan kehadiran dan kontrak aktif.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <Calendar className="w-4 h-4 text-slate-500" />
            <select value={bulan} onChange={e => setBulan(Number(e.target.value))} className="bg-transparent text-sm font-medium outline-none">
              {[...Array(12)].map((_, i) => (
                <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
              ))}
            </select>
            <select value={tahun} onChange={e => setTahun(Number(e.target.value))} className="bg-transparent text-sm font-medium outline-none">
              {[tahun - 1, tahun, tahun + 1].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          <button onClick={handleExport} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 flex items-center gap-2">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      <div className="p-6 bg-emerald-50/50 border-b border-slate-200 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Estimasi Total Pengeluaran Bulan Ini</p>
          <h3 className="text-2xl font-bold text-emerald-700 flex items-center gap-2">
            <Coins className="w-6 h-6" /> Rp {totalPengeluaran.toLocaleString('id-ID')}
          </h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-sm text-slate-600">
              <th className="p-4 font-semibold">NIP / Nama Guru</th>
              <th className="p-4 font-semibold">Jabatan & Kontrak</th>
              <th className="p-4 font-semibold text-center">Total Hadir</th>
              <th className="p-4 font-semibold text-right">Satuan Kafalah</th>
              <th className="p-4 font-semibold text-right">Total Gaji</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" /></td></tr>
            ) : data.length > 0 ? data.map(item => (
              <tr key={item.idGuru} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <p className="font-bold text-slate-800">{item.namaLengkap}</p>
                  <p className="text-xs text-slate-500">{item.nip}</p>
                </td>
                <td className="p-4">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${item.jabatan === '-' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                    {item.jabatan === '-' ? 'Tidak Ada Kontrak Aktif' : item.jabatan}
                  </span>
                </td>
                <td className="p-4 text-center">
                  <span className="inline-block min-w-8 py-1 rounded bg-slate-100 font-bold text-slate-700">{item.totalHadir}</span>
                </td>
                <td className="p-4 text-right text-slate-600">
                  Rp {item.satuanKafalah.toLocaleString('id-ID')}
                </td>
                <td className="p-4 text-right">
                  <span className="font-bold text-emerald-600">Rp {item.totalGaji.toLocaleString('id-ID')}</span>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="p-8 text-center text-slate-500">Tidak ada data untuk bulan ini.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

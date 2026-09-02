"use client";

import { useState, useEffect } from "react";
import { getLaporanAlpa, AlpaData, resetLaporanAlpa } from "./actions";
import { formatDateID, formatTimeID } from "@/lib/date";
import { Download, Search, Loader2, RefreshCw, Trash2, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getColumns } from "./columns";

export default function LaporanAlpaClient() {
  const [dataAlpa, setDataAlpa] = useState<AlpaData[]>([]);
  const [filterPeriod, setFilterPeriod] = useState("semua");
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const fetchAlpaData = async (period: string) => {
    setIsLoading(true);
    try {
      const result = await getLaporanAlpa(period);
      setDataAlpa(result);
      setLastRefresh(new Date());
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data laporan");
    } finally {
      setIsLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchAlpaData("semua");
  }, []);

  const handleRefresh = async () => {
    await fetchAlpaData(filterPeriod);
    toast.success("Data berhasil diperbarui");
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const period = e.target.value;
    setFilterPeriod(period);
    fetchAlpaData(period);
  };

  const exportToExcel = () => {
    if (dataAlpa.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const exportData = dataAlpa.map(item => {
      const date = new Date(item.waktuScan);
      return {
        "NIS": item.santri.nomorInduk,
        "Nama Santri": item.santri.namaLengkap,
        "Keterangan": "Alpa",
        "Tanggal": new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(date),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Alpa");
    
    worksheet['!cols'] = [
      { wch: 15 }, // NIS
      { wch: 30 }, // Nama
      { wch: 15 }, // Keterangan
      { wch: 20 }, // Tanggal
    ];
    
    XLSX.writeFile(workbook, `Laporan_Alpa_Santri_${filterPeriod}.xlsx`);
  };

  const handleSubmitReset = async () => {
    setIsResetting(true);
    try {
      const result = await resetLaporanAlpa(resetPassword);
      if (result.success) {
        toast.success(result.message);
        setIsResetModalOpen(false);
        setResetPassword("");
        await fetchAlpaData(filterPeriod);
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error("Gagal mereset laporan");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Alpa</h1>
          <p className="text-slate-500 mt-1">
            Data santri yang alpa / absen otomatis. Terakhir diperbarui: {formatTimeID(lastRefresh)} WIB
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={handleRefresh}
            className="p-2.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
            title="Refresh Data"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={exportToExcel}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-lg transition-all shadow-sm font-medium"
          >
            <Download className="w-4 h-4" /> Export Excel
          </button>
          <button 
            onClick={() => {
              setResetPassword("");
              setIsResetModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-lg transition-all shadow-sm font-medium"
          >
            <Trash2 className="w-4 h-4" /> Reset Laporan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 w-full lg:w-auto">
            <Filter className="w-4 h-4 text-slate-500 ml-2" />
            <select
              value={filterPeriod}
              onChange={handleFilterChange}
              className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer w-full"
            >
              <option value="semua">Semua Waktu</option>
              <option value="hari_ini">Hari Ini</option>`n                <option value="kemarin">Kemarin</option>
              <option value="minggu_ini">Minggu Ini</option>
              <option value="bulan_ini">Bulan Ini</option>
              <option value="triwulan">Triwulan (3 Bulan)</option>
              <option value="semester">Semester (6 Bulan)</option>
              <option value="tahun_ini">Tahun Ini</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
            <p>Memuat laporan...</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
            <DataTable 
              columns={getColumns()} 
              data={dataAlpa} 
              searchKey="namaLengkap"
            />
          </div>
        )}
      </div>

      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm relative shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-rose-600 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Reset Laporan Alpa
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Tindakan ini akan menghapus permanen semua rekam jejak laporan alpa. Masukkan password admin untuk melanjutkan.
            </p>
            <input 
              type="password"
              placeholder="Masukkan password..."
              className="w-full p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 mb-6 font-mono tracking-widest text-center"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                disabled={isResetting}
              >
                Batal
              </button>
              <button 
                onClick={handleSubmitReset}
                disabled={isResetting || !resetPassword}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isResetting ? <><Loader2 className="w-4 h-4 animate-spin" /> Mereset...</> : "Reset Laporan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

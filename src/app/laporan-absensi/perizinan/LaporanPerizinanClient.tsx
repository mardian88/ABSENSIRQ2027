"use client";
import { useState } from "react";
import { getDaftarPerizinan, PerizinanData, resetLaporanIzin } from "./actions";
import { formatDateID, formatTimeID } from "@/lib/date";
import { Download, Search, Loader2, ArrowUpDown, ChevronLeft, ChevronRight, Filter, ImageIcon, ExternalLink, X, Trash2, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getIzinColumns } from "./columns";

export function LaporanPerizinanClient({ initialData }: { initialData: PerizinanData[] }) {
  const [dataIzin, setDataIzin] = useState<PerizinanData[]>(initialData);
  const [filterPeriod, setFilterPeriod] = useState("semua");
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedIzin, setSelectedIzin] = useState<PerizinanData | null>(null);

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const newData = await getDaftarPerizinan(filterPeriod);
      setDataIzin(newData);
      setLastRefresh(new Date());
      toast.success("Data berhasil diperbarui");
    } catch (e) {
      toast.error("Gagal memperbarui data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const period = e.target.value;
    setFilterPeriod(period);
    setIsLoading(true);
    try {
      const result = await getDaftarPerizinan(period);
      setDataIzin(result);
    } catch (e) {
      toast.error("Gagal memuat data laporan");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    if (dataIzin.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const exportData = dataIzin.map(item => {
      const durasi = Math.round((new Date(item.tanggalSelesai).getTime() - new Date(item.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return {
        "Waktu Submit": formatDateID(item.waktuPengajuan),
        "NIS": item.santri.nomorInduk,
        "Nama Santri": item.santri.namaLengkap,
        "Kategori": item.kategori,
        "Durasi": `${durasi} Hari`,
        "Tanggal Mulai": formatDateID(item.tanggalMulai),
        "Tanggal Selesai": formatDateID(item.tanggalSelesai),
        "Keterangan": item.keterangan,
        "Bukti URL": item.buktiUrl || "Tidak Ada",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Laporan Perizinan`);
    
    worksheet['!cols'] = [
      { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 50 }, { wch: 15 },
    ];
    
    XLSX.writeFile(workbook, `Laporan_Perizinan_Santri_${filterPeriod}.xlsx`);
  };

  const handleOpenDetailModal = (izin: PerizinanData) => {
    setSelectedIzin(izin);
    setIsDetailModalOpen(true);
  };

  const handleSubmitReset = async () => {
    setIsResetting(true);
    try {
      const result = await resetLaporanIzin(resetPassword);

      if (result.success) {
        toast.success(result.message);
        setIsResetModalOpen(false);
        setResetPassword("");
        const newData = await getDaftarPerizinan(filterPeriod);
        setDataIzin(newData);
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">Laporan Perizinan</h1>
              <p className="text-slate-500">Kelola dan ekspor data izin dan sakit santri.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center text-sm font-medium text-slate-500 mr-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
                Terakhir diupdate: {formatTimeID(lastRefresh)} WIB
              </div>
              <button 
                onClick={handleRefresh}
                className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200 bg-white"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button 
                onClick={exportToExcel}
                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm font-medium"
              >
                <Download className="w-4 h-4" /> Export Excel
              </button>
              <button 
                onClick={() => {
                  setResetPassword("");
                  setIsResetModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg transition-all shadow-sm font-medium"
              >
                <Trash2 className="w-4 h-4" /> Reset Laporan
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4 bg-white">
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
            <div className="py-24 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
              <p className="font-medium text-slate-600">Memuat laporan...</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
              <DataTable sortColumn="waktuPengajuan"
                columns={getIzinColumns(handleOpenDetailModal)}
                data={dataIzin}
                searchKey="namaLengkap"
              />
            </div>
          )}
        </div>
      </div>

      {isDetailModalOpen && selectedIzin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsDetailModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 mb-4 pr-8">Detail Perizinan Santri</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">Nama Santri</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedIzin.santri.namaLengkap}</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">NIS</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedIzin.santri.nomorInduk}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">Kategori</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase mt-0.5 ${
                    selectedIzin.kategori === 'sakit' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {selectedIzin.kategori}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-1">Durasi</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {formatDateID(selectedIzin.tanggalMulai)} s/d {formatDateID(selectedIzin.tanggalSelesai)}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-2">Keterangan / Alasan</p>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedIzin.keterangan}</p>
              </div>

              {selectedIzin.buktiUrl && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium mb-2 flex items-center justify-between">
                    <span>Lampiran Bukti</span>
                    <a href={selectedIzin.buktiUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                      Buka Penuh <ExternalLink className="w-3 h-3" />
                    </a>
                  </p>
                  <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-200 max-h-48 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedIzin.buktiUrl} alt="Bukti Izin" className="object-contain max-h-48 w-full" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors w-full sm:w-auto"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm relative shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-rose-600 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Reset Laporan Izin
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Tindakan ini akan menghapus permanen semua rekam jejak laporan izin & sakit. Masukkan password admin untuk melanjutkan.
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


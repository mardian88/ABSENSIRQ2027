"use client";

import { useState } from "react";
import { getLaporanAbsensi, LaporanData, archiveSemuaAbsensi, deleteSemuaAbsensi } from "./actions";
import { formatTimeID } from "@/lib/date";
import { Download, Loader2, Filter, Trash2, AlertTriangle, Key } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getLaporanColumns } from "./columns";

export function LaporanClient({ initialData }: { initialData: LaporanData[] }) {
  const [data, setData] = useState<LaporanData[]>(initialData);
  const [filterPeriod, setFilterPeriod] = useState("hari_ini");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");

  const handleFilterChange = async (period: string) => {
    setFilterPeriod(period);
    setIsLoading(true);
    try {
      const result = await getLaporanAbsensi(period);
      setData(result);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data laporan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    setIsLoading(true);
    try {
      const res = await archiveSemuaAbsensi();
      if (res.success) {
        toast.success("Laporan berhasil diarsipkan (disembunyikan dari antarmuka).");
        setIsResetDialogOpen(false);
        handleFilterChange(filterPeriod);
      } else {
        toast.error(res.message || "Gagal mengarsipkan laporan.");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!resetPassword) {
      toast.error("Password wajib diisi untuk hapus permanen.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await deleteSemuaAbsensi(resetPassword);
      if (res.success) {
        toast.success("Semua data absensi berhasil dihapus permanen dari database!");
        setIsResetDialogOpen(false);
        setResetPassword("");
        handleFilterChange(filterPeriod);
      } else {
        toast.error(res.message || "Gagal menghapus laporan.");
      }
    } catch (e) {
      toast.error("Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    if (data.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const exportData = data.map(item => ({
      "Tanggal": item.tanggalWIB,
      "Waktu Masuk": item.waktuMasuk ? formatTimeID(new Date(item.waktuMasuk)) : "-",
      "Waktu Pulang": item.waktuPulang ? formatTimeID(new Date(item.waktuPulang)) : "-",
      "NIS/NIP": item.person.nomorInduk,
      "Nama": item.person.namaLengkap,
      "Kategori": item.kategori,
      "Halaqoh": item.person.halaqoh || "-",
      "Metode Masuk": (item.metodeMasuk || "-").toUpperCase(),
      "Metode Pulang": (item.metodePulang || "-").toUpperCase(),
      "Status": item.statusKehadiran.toUpperCase()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Absensi");
    
    // Generate filename
    const filename = `Laporan_Absensi_${filterPeriod}_${Date.now()}.xlsx`;
    XLSX.writeFile(workbook, filename);
    toast.success("Berhasil mengekspor data ke Excel");
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Laporan Hadir</h1>
            <p className="text-sm text-slate-500">Lihat dan ekspor rekapitulasi data kehadiran.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsResetDialogOpen(true)}
              className="flex items-center gap-2 bg-rose-100 text-rose-700 px-4 py-2 rounded-lg hover:bg-rose-200 transition-colors shadow-sm font-semibold text-sm"
            >
              <Trash2 className="w-4 h-4" /> Reset Laporan
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-semibold text-sm"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <div className="flex items-center text-sm font-medium text-slate-500 mr-2">
              <Filter className="w-4 h-4 mr-1" /> Waktu:
            </div>
            {[
              { id: "hari_ini", label: "Hari Ini" },
              { id: "minggu_ini", label: "Minggu Ini" },
              { id: "bulan_ini", label: "Bulan Ini" },
              { id: "triwulan", label: "Triwulan" },
              { id: "semester", label: "Semester" },
              { id: "tahun_ini", label: "Tahun Ini" },
              { id: "semua", label: "Semua Data" }
            ].map(period => (
              <button
                key={period.id}
                onClick={() => handleFilterChange(period.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filterPeriod === period.id 
                    ? "bg-blue-100 text-blue-700 border border-blue-200" 
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}
          
          <DataTable sortColumn=waktuScan
            columns={getLaporanColumns()}
            data={data}
            searchKey="namaLengkap"
          />
        </div>
      {/* Reset Dialog Modal */}
      {isResetDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-rose-50/50 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-1">Reset Laporan Absensi</h2>
              <p className="text-sm text-slate-500">Pilih metode penghapusan data absensi.</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Opsi 1: Hapus dari UI */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <h3 className="font-semibold text-slate-900 mb-1">Sembunyikan dari Antarmuka (Aman)</h3>
                <p className="text-xs text-slate-500 mb-3">Data hanya akan disembunyikan dari halaman ini, namun tetap tersimpan di database sebagai arsip.</p>
                <button
                  onClick={handleArchive}
                  disabled={isLoading}
                  className="w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                  Sembunyikan Laporan
                </button>
              </div>

              {/* Opsi 2: Hapus Permanen */}
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
                <h3 className="font-semibold text-rose-900 mb-1">Hapus Permanen dari Database</h3>
                <p className="text-xs text-rose-700/80 mb-3">Tindakan ini tidak bisa dibatalkan. Hanya untuk Superadmin.</p>
                
                <div className="space-y-3">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Key className="h-4 w-4 text-rose-400" />
                    </div>
                    <input
                      type="password"
                      placeholder="Masukkan Password Superadmin"
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-rose-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    />
                  </div>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading || !resetPassword}
                    className="w-full py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    Hapus Permanen
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsResetDialogOpen(false)}
                disabled={isLoading}
                className="px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-medium transition-colors text-sm"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

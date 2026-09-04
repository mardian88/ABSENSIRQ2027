"use client";
import { useState } from "react";
import { getDaftarPerizinan, PerizinanData, resetLaporanIzin } from "./actions";
import { formatDateID, formatTimeID } from "@/lib/date";
import { Download, Search, Loader2, ArrowUpDown, ChevronLeft, ChevronRight, Filter, ImageIcon, ExternalLink, X, Trash2, RefreshCw, CalendarClock } from "lucide-react";
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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleOpenDetailModal = (izin: PerizinanData) => {
    setSelectedIzin(izin);
    setIsDetailModalOpen(true);
  };

  const handleOpenEditModal = (izin: PerizinanData) => {
    setSelectedIzin(izin);
    // Format to YYYY-MM-DD for input type="date"
    const formatDateForInput = (d: Date) => {
      const date = new Date(d);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setEditStartDate(formatDateForInput(izin.tanggalMulai));
    setEditEndDate(formatDateForInput(izin.tanggalSelesai));
    setIsEditModalOpen(true);
  };

  const handleSubmitEdit = async () => {
    if (!selectedIzin || !editStartDate || !editEndDate) return;
    
    setIsSavingEdit(true);
    try {
      const { updateDurasiPerizinan } = await import("./actions");
      const res = await updateDurasiPerizinan(selectedIzin.id, editStartDate, editEndDate);
      if (res.success) {
        toast.success(res.message);
        setIsEditModalOpen(false);
        handleRefresh();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem saat mengubah durasi");
    } finally {
      setIsSavingEdit(false);
    }
  };

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

  const handleExport = () => {
    if (dataIzin.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    const formattedData = dataIzin.map((izin, i) => ({
      "No": i + 1,
      "Nama Santri": izin.santri.namaLengkap,
      "NIS": izin.santri.nomorInduk || "-",
      "Kategori": izin.kategori.toUpperCase(),
      "Mulai": formatDateID(izin.tanggalMulai),
      "Selesai": formatDateID(izin.tanggalSelesai),
      "Alasan": izin.keterangan,
      "Tgl Pengajuan": `${formatDateID(izin.waktuPengajuan)} ${formatTimeID(izin.waktuPengajuan)}`
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Perizinan");
    XLSX.writeFile(wb, `Laporan_Perizinan_Santri_${filterPeriod}.xlsx`);
  };

  const [rowSelection, setRowSelection] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteSelected = async (table: any) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) return;
    
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedRows.length} laporan perizinan yang dipilih beserta fotonya? Data yang dihapus tidak dapat dikembalikan.`)) {
      return;
    }

    setIsDeleting(true);
    const idsToDelete = selectedRows.map((r: any) => r.original.id);
    
    try {
      const { hapusPerizinanBanyak } = await import("./actions");
      const res = await hapusPerizinanBanyak(idsToDelete);
      if (res.success) {
        toast.success(res.message);
        handleRefresh();
        setRowSelection({});
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error("Gagal menghapus laporan perizinan");
    } finally {
      setIsDeleting(false);
    }
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
    <div className="flex flex-col h-full bg-slate-50 relative min-h-screen">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.2] pointer-events-none" />

      <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-sm">
                <ImageIcon className="w-5 h-5" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Laporan Perizinan</h1>
            </div>
            <p className="text-slate-500 text-sm">Rekam jejak izin dan sakit santri dengan bukti terlampir</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button 
              onClick={handleRefresh} 
              disabled={isLoading}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-500' : 'text-slate-500'}`} /> 
              {isLoading ? 'Menyegarkan...' : 'Segarkan Data'}
            </button>
            <button 
              onClick={handleExport}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 font-medium rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
            
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            
            <button 
              onClick={() => setIsResetModalOpen(true)}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-rose-600 font-medium rounded-xl shadow-sm transition-all flex items-center gap-2 text-sm"
            >
              <Trash2 className="w-4 h-4" /> Reset Laporan
            </button>
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
                <option value="hari_ini">Hari Ini</option>
                <option value="kemarin">Kemarin</option>
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
                columns={getIzinColumns(handleOpenDetailModal, handleOpenEditModal)}
                data={dataIzin}
                searchKey="namaLengkap"
                rowSelection={rowSelection}
                onRowSelectionChange={setRowSelection}
                toolbarActions={(table) => {
                  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
                  return selectedCount > 0 ? (
                    <button
                      onClick={() => handleDeleteSelected(table)}
                      disabled={isDeleting}
                      className="px-3 py-1.5 bg-rose-50 border border-rose-200 text-rose-600 font-medium rounded-lg shadow-sm hover:bg-rose-100 transition-colors flex items-center gap-2 text-sm z-10"
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Hapus {selectedCount} Terpilih
                    </button>
                  ) : <></>;
                }}
              />
            </div>
          )}
        </div>
      </div>

      {isEditModalOpen && selectedIzin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm relative shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-amber-600" /> Ubah Durasi
            </h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Mulai</label>
                <input 
                  type="date" 
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Selesai</label>
                <input 
                  type="date" 
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                disabled={isSavingEdit}
              >
                Batal
              </button>
              <button 
                onClick={handleSubmitEdit}
                disabled={isSavingEdit || !editStartDate || !editEndDate}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingEdit ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Durasi"}
              </button>
            </div>
          </div>
        </div>
      )}

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


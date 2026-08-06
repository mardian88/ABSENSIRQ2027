"use client";

import { useState, useMemo } from "react";
import { getDaftarPerizinan, PerizinanData, getLaporanAlpa, AlpaData, updateStatusAlpa, resetLaporanIzin, resetLaporanAlpa } from "./actions";
import { formatDateID, formatTimeID } from "@/lib/date";
import { Download, Search, Loader2, ArrowUpDown, ChevronLeft, ChevronRight, Filter, ImageIcon, ExternalLink, Edit, X, Trash2, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export function LaporanPerizinanClient({ initialData }: { initialData: PerizinanData[] }) {
  const [activeTab, setActiveTab] = useState<"izin" | "alpa">("izin");
  
  // Data State
  const [dataIzin, setDataIzin] = useState<PerizinanData[]>(initialData);
  const [dataAlpa, setDataAlpa] = useState<AlpaData[]>([]);

  const [filterPeriod, setFilterPeriod] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal Edit Alpa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAlpaId, setSelectedAlpaId] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editStatus, setEditStatus] = useState<"hadir" | "izin">("hadir");
  const [isUpdating, setIsUpdating] = useState(false);

  // Modal Detail Izin
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedIzin, setSelectedIzin] = useState<PerizinanData | null>(null);

  // Modal Reset
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<"waktuPengajuan" | "namaLengkap">("waktuPengajuan");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Refresh
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (activeTab === "izin") {
        const newData = await getDaftarPerizinan(filterPeriod);
        setDataIzin(newData);
      } else {
        await fetchAlpaData(filterPeriod);
      }
      setLastRefresh(new Date());
      toast.success("Data berhasil diperbarui");
    } catch (e) {
      toast.error("Gagal memperbarui data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = async (tab: "izin" | "alpa") => {
    setActiveTab(tab);
    setSearchQuery("");
    setCurrentPage(1);
    
    if (tab === "alpa" && dataAlpa.length === 0) {
      // First load of Alpa data
      await fetchAlpaData(filterPeriod);
    }
  };

  const fetchAlpaData = async (period: string) => {
    setIsLoading(true);
    try {
      const result = await getLaporanAlpa(period);
      setDataAlpa(result);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data alpa");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = async (period: string) => {
    setFilterPeriod(period);
    setIsLoading(true);
    try {
      if (activeTab === "izin") {
        const result = await getDaftarPerizinan(period);
        setDataIzin(result);
      } else {
        await fetchAlpaData(period);
      }
      setCurrentPage(1);
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data laporan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: "waktuPengajuan" | "namaLengkap") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = activeTab === "izin" ? [...dataIzin] : [...dataAlpa];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = (result as any[]).filter(item => 
        item.santri.namaLengkap.toLowerCase().includes(q) || 
        item.santri.nomorInduk.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a: any, b: any) => {
      if (sortField === "waktuPengajuan") {
        const aTime = activeTab === "izin" ? new Date(a.waktuPengajuan).getTime() : new Date(a.waktuScan).getTime();
        const bTime = activeTab === "izin" ? new Date(b.waktuPengajuan).getTime() : new Date(b.waktuScan).getTime();
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      } else {
        return sortOrder === "asc" 
          ? a.santri.namaLengkap.localeCompare(b.santri.namaLengkap)
          : b.santri.namaLengkap.localeCompare(a.santri.namaLengkap);
      }
    });

    return result;
  }, [dataIzin, dataAlpa, activeTab, searchQuery, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const exportToExcel = () => {
    if (filteredAndSortedData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    let exportData;
    let colWidths: any[];

    if (activeTab === "izin") {
      exportData = (filteredAndSortedData as PerizinanData[]).map(item => {
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
          "Ada Bukti Foto": item.buktiUrl ? "Ya" : "Tidak"
        };
      });
      colWidths = [
        { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 50 }, { wch: 15 },
      ];
    } else {
      exportData = (filteredAndSortedData as AlpaData[]).map(item => {
        return {
          "NIS": item.santri.nomorInduk,
          "Nama Santri": item.santri.namaLengkap,
          "Jenis": "Alpa",
          "Tanggal Alpa": formatDateID(item.waktuScan),
        };
      });
      colWidths = [
        { wch: 15 }, { wch: 30 }, { wch: 10 }, { wch: 20 },
      ];
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Laporan ${activeTab === 'izin' ? 'Perizinan' : 'Alpa'}`);
    
    worksheet['!cols'] = colWidths;
    XLSX.writeFile(workbook, `Laporan_${activeTab === 'izin' ? 'Perizinan' : 'Alpa'}_Santri_${filterPeriod}.xlsx`);
  };

  const handleOpenEditModal = (id: string) => {
    setSelectedAlpaId(id);
    setEditPassword("");
    setEditStatus("hadir");
    setIsModalOpen(true);
  };

  const handleSubmitEdit = async () => {
    if (!editPassword) {
      toast.error("Password wajib diisi");
      return;
    }
    
    setIsUpdating(true);
    try {
      const result = await updateStatusAlpa(selectedAlpaId, editPassword, editStatus);
      if (result.success) {
        toast.success(result.message);
        setIsModalOpen(false);
        // Refresh alpa data
        await fetchAlpaData(filterPeriod);
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error("Gagal mengubah status");
    } finally {
      setIsUpdating(false);
    }
  };

  const filterOptions = [
    { id: 'semua', label: 'Semua Data' },
    { id: 'hari_ini', label: 'Hari Ini' },
    { id: 'minggu_ini', label: 'Minggu Ini' },
    { id: 'bulan_ini', label: 'Bulan Ini' },
    { id: 'triwulan', label: 'Triwulan' },
    { id: 'semester', label: 'Semester' },
    { id: 'tahun_ini', label: 'Tahun Ini' },
  ];

  const handleResetLaporan = async () => {
    if (!resetPassword) {
      toast.error("Password wajib diisi!");
      return;
    }
    
    setIsResetting(true);
    try {
      let result;
      if (activeTab === "izin") {
        result = await resetLaporanIzin(resetPassword);
      } else {
        result = await resetLaporanAlpa(resetPassword);
      }

      if (result.success) {
        toast.success(result.message);
        setIsResetModalOpen(false);
        setResetPassword("");
        // Reload data
        if (activeTab === "izin") {
           const newData = await getDaftarPerizinan(filterPeriod);
           setDataIzin(newData);
        } else {
           await fetchAlpaData(filterPeriod);
        }
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error("Gagal mereset laporan");
    } finally {
      setIsResetting(false);
    }
  };

  const handleDownloadImage = async (url: string, fileName: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading image:", error);
      toast.error("Gagal mengunduh gambar");
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Laporan Kehadiran & Perizinan</h1>
          <p className="text-slate-500">Kelola dan ekspor data izin, sakit, maupun alpa santri.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center text-sm font-medium text-slate-500 mr-2 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50">
            <span className="mr-2 hidden sm:inline">Pembaruan terakhir: {formatTimeID(lastRefresh)}</span>
            <button 
              onClick={handleRefresh} 
              disabled={isLoading}
              className="text-slate-500 hover:text-slate-800 transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
          >
            <Trash2 className="w-4 h-4" />
            Reset Laporan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        <button
          onClick={() => handleTabChange("izin")}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "izin" 
              ? "border-emerald-600 text-emerald-600" 
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          Laporan Izin / Sakit
        </button>
        <button
          onClick={() => handleTabChange("alpa")}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "alpa" 
              ? "border-emerald-600 text-emerald-600" 
              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
          }`}
        >
          Laporan Alpa
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-500 flex items-center mr-2">
              <Filter className="w-4 h-4 mr-1" /> Waktu:
            </span>
            {filterOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleFilterChange(opt.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  filterPeriod === opt.id 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Nama/NIS..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
            <p>Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th 
                    className="px-4 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("namaLengkap")}
                  >
                    <div className="flex items-center gap-1">
                      SANTRI {sortField === "namaLengkap" && <ArrowUpDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("waktuPengajuan")}
                  >
                    <div className="flex items-center gap-1">
                      {activeTab === "izin" ? "WAKTU SUBMIT" : "TANGGAL ALPA"} {sortField === "waktuPengajuan" && <ArrowUpDown className="w-3 h-3" />}
                    </div>
                  </th>
                  {activeTab === "izin" ? (
                    <>
                      <th className="px-4 py-4 font-semibold">RENTANG & DURASI</th>
                      <th className="px-4 py-4 font-semibold">KETERANGAN</th>
                      <th className="px-4 py-4 font-semibold">BUKTI</th>
                      <th className="px-4 py-4 font-semibold text-center">KATEGORI</th>
                    </>
                  ) : (
                    <>
                      <th className="px-4 py-4 font-semibold text-center">JENIS</th>
                      <th className="px-4 py-4 font-semibold text-right">AKSI</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length > 0 ? (
                  paginatedData.map((item: any) => {
                    if (activeTab === "izin") {
                      const izinItem = item as PerizinanData;
                      
                      return (
                        <tr key={izinItem.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-4 align-top">
                            <div className="font-bold text-slate-800">{izinItem.santri.namaLengkap}</div>
                            <div className="text-xs text-slate-500 mt-0.5">NIS: {izinItem.santri.nomorInduk}</div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <div className="text-sm font-semibold text-slate-700">
                              {formatDateID(izinItem.tanggalMulai)}
                            </div>
                            {izinItem.tanggalSelesai > izinItem.tanggalMulai && (
                              <div className="text-xs text-slate-500 mt-0.5">
                                s/d {formatDateID(izinItem.tanggalSelesai)}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 align-top text-center">
                            <div className="font-medium text-slate-700">
                              {Math.round((new Date(izinItem.tanggalSelesai).getTime() - new Date(izinItem.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24)) + 1}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">Hari</div>
                          </td>
                          <td className="px-4 py-4 align-top max-w-xs">
                            <p className="text-sm text-slate-700 italic truncate" title={izinItem.keterangan}>"{izinItem.keterangan}"</p>
                          </td>
                          <td className="px-4 py-4 align-top">
                            {izinItem.buktiUrl ? (
                              <button 
                                onClick={() => { setSelectedIzin(izinItem); setIsDetailModalOpen(true); }}
                                className="inline-flex items-center justify-center p-2 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors" 
                                title="Lihat Bukti"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </button>
                            ) : (
                              <span 
                                className="inline-flex items-center justify-center p-2 bg-slate-50 text-slate-400 rounded-md cursor-not-allowed"
                                title="Tidak ada foto bukti dilampirkan"
                              >
                                <ImageIcon className="w-4 h-4" />
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center align-top">
                            <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                              izinItem.kategori === 'Sakit' 
                                ? 'bg-rose-100 text-rose-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {izinItem.kategori.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      );
                    } else {
                      const alpaItem = item as AlpaData;
                      return (
                        <tr key={alpaItem.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-4 align-middle">
                            <div className="font-bold text-slate-800">{alpaItem.santri.namaLengkap}</div>
                            <div className="text-xs text-slate-500 mt-0.5">NIS: {alpaItem.santri.nomorInduk}</div>
                          </td>
                          <td className="px-4 py-4 font-medium text-slate-900 align-middle">
                            {formatDateID(alpaItem.waktuScan)}
                          </td>
                          <td className="px-4 py-4 text-center align-middle">
                            <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-700">
                              ALPA
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right align-middle">
                            <button
                              onClick={() => handleOpenEditModal(alpaItem.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" /> Edit Status
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  })
                ) : (
                  <tr>
                    <td colSpan={activeTab === 'izin' ? 6 : 4} className="px-4 py-8 text-center text-slate-500">
                      Tidak ada data ditemukan
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, filteredAndSortedData.length)} - {Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} dari {filteredAndSortedData.length} data
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-1 mx-2">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  if (
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                          currentPage === page 
                            ? 'bg-blue-600 text-white' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  } else if (
                    page === currentPage - 2 ||
                    page === currentPage + 2
                  ) {
                    return <span key={page} className="text-slate-400">...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded-md text-slate-500 hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm relative shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">Ubah Status Alpa</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status Baru</label>
                <select 
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                >
                  <option value="hadir">Hadir (Batal Alpa)</option>
                  <option value="izin">Izin / Sakit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password Admin</label>
                <input 
                  type="password"
                  placeholder="Masukkan password..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 font-medium transition-colors"
                disabled={isUpdating}
              >
                Batal
              </button>
              <button 
                onClick={handleSubmitEdit}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Izin (Hanya Image) */}
      {isDetailModalOpen && selectedIzin && selectedIzin.buktiUrl && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-[60]" onClick={() => setIsDetailModalOpen(false)}>
          <button
            onClick={() => setIsDetailModalOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-rose-500 bg-white/10 p-2 rounded-full transition-colors z-[70]"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-full max-w-4xl max-h-[85vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img 
              src={selectedIzin.buktiUrl} 
              alt={`Bukti ${selectedIzin.kategori} - ${selectedIzin.santri.namaLengkap}`} 
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
            />
          </div>

          <div className="mt-6 flex gap-4 z-[70]" onClick={e => e.stopPropagation()}>
             <button 
                onClick={() => handleDownloadImage(selectedIzin.buktiUrl!, `Bukti_${selectedIzin.kategori}_${selectedIzin.santri.namaLengkap.replace(/\s+/g, '_')}.jpg`)}
                className="flex items-center gap-2 text-sm font-semibold bg-emerald-600 text-white px-6 py-3 rounded-full hover:bg-emerald-700 transition-colors shadow-lg"
             >
                <Download className="w-5 h-5" /> Download Image
             </button>
          </div>
        </div>
      )}

      {/* Modal Reset Laporan */}
      {isResetModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm relative shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-rose-600 mb-2 flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Reset Laporan {activeTab === 'izin' ? 'Izin' : 'Alpa'}
            </h2>
            <p className="text-sm text-slate-600 mb-6">
              Tindakan ini akan menghapus permanen semua rekam jejak laporan {activeTab === 'izin' ? 'izin & sakit' : 'alpa'}. Masukkan password admin untuk melanjutkan.
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
                onClick={() => { setIsResetModalOpen(false); setResetPassword(''); }}
                className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 font-medium transition-colors"
                disabled={isResetting}
              >
                Batal
              </button>
              <button 
                onClick={handleResetLaporan}
                disabled={isResetting || !resetPassword}
                className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isResetting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isResetting ? 'Meriset...' : 'Ya, Reset Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

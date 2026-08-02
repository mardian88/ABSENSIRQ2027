"use client";

import { useState, useMemo } from "react";
import { getLaporanAbsensi, LaporanData } from "./actions";
import { formatTimeID, formatDateID } from "@/lib/date";
import { Download, Search, Loader2, ArrowUpDown, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export function LaporanClient({ initialData }: { initialData: LaporanData[] }) {
  const [data, setData] = useState<LaporanData[]>(initialData);
  const [filterPeriod, setFilterPeriod] = useState("hari_ini");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Sorting
  const [sortField, setSortField] = useState<"waktuMasuk" | "namaLengkap">("waktuMasuk");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleFilterChange = async (period: string) => {
    setFilterPeriod(period);
    setIsLoading(true);
    try {
      const result = await getLaporanAbsensi(period);
      setData(result);
      setCurrentPage(1); // Reset page on filter change
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data laporan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: "waktuMasuk" | "namaLengkap") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.santri.namaLengkap.toLowerCase().includes(q) || 
        item.santri.nomorInduk.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === "waktuMasuk") {
        const aTime = Math.max(a.waktuMasuk || 0, a.waktuPulang || 0);
        const bTime = Math.max(b.waktuMasuk || 0, b.waktuPulang || 0);
        return sortOrder === "asc" ? aTime - bTime : bTime - aTime;
      } else {
        return sortOrder === "asc" 
          ? a.santri.namaLengkap.localeCompare(b.santri.namaLengkap)
          : b.santri.namaLengkap.localeCompare(a.santri.namaLengkap);
      }
    });

    return result;
  }, [data, searchQuery, sortField, sortOrder]);

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

    const exportData = filteredAndSortedData.map(item => ({
      "Tanggal": item.tanggalWIB,
      "Waktu Masuk": item.waktuMasuk ? formatTimeID(new Date(item.waktuMasuk)) : "-",
      "Waktu Pulang": item.waktuPulang ? formatTimeID(new Date(item.waktuPulang)) : "-",
      "NIS": item.santri.nomorInduk,
      "Nama Santri": item.santri.namaLengkap,
      "Halaqoh": item.santri.halaqoh || "-",
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
            <h1 className="text-2xl font-bold text-slate-900">Laporan Absensi</h1>
            <p className="text-sm text-slate-500">Lihat dan ekspor rekapitulasi data absensi santri.</p>
          </div>
          
          <div className="flex items-center gap-3">
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

          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Nama/NIS..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}
          <div className="overflow-auto max-h-[65vh]">
              <table className="w-full text-left text-sm text-slate-600 relative">
                <thead className="sticky top-0 z-10 bg-slate-50 text-slate-900 shadow-sm uppercase text-xs">
                  <tr>
                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort("waktuMasuk")}>
                      <div className="flex items-center gap-1">
                        Tanggal <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort("namaLengkap")}>
                      <div className="flex items-center gap-1">
                        Santri <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="p-4">Masuk / Pulang</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Tidak ada data absen pada periode ini.
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((row) => {
                      const dt = row.waktuMasuk || row.waktuPulang;
                      return (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-slate-900">{dt ? formatDateID(new Date(dt)) : row.tanggalWIB}</div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{row.santri.namaLengkap}</div>
                          <div className="text-xs text-slate-500">NIS: {row.santri.nomorInduk} • Halaqoh: {row.santri.halaqoh || '-'}</div>
                        </td>
                        <td className="p-4">
                           <div className="font-mono text-sm text-slate-700 font-medium">
                             {row.waktuMasuk ? formatTimeID(new Date(row.waktuMasuk)) : "-"} 
                             <span className="text-slate-300 mx-2">/</span> 
                             {row.waktuPulang ? formatTimeID(new Date(row.waktuPulang)) : "-"}
                           </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                            ${row.statusKehadiran === 'hadir' ? 'bg-emerald-100 text-emerald-700' : 
                              row.statusKehadiran === 'pulang' ? 'bg-amber-100 text-amber-700' :
                              row.statusKehadiran === 'terlambat' ? 'bg-amber-100 text-amber-700' :
                              row.statusKehadiran === 'pulang cepat' ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-100 text-slate-700'}`}>
                            {row.statusKehadiran === 'terlambat' ? 'Telat' : row.statusKehadiran}
                          </span>
                        </td>
                      </tr>
                    )})
                  )}
                </tbody>
              </table>
            </div>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="text-sm text-slate-500">
                Menampilkan <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}</span> dari <span className="font-medium text-slate-900">{filteredAndSortedData.length}</span> data
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="px-3 py-1 text-sm font-medium text-slate-700">
                  {currentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

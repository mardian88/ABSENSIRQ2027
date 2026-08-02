"use client";

import { useState, useMemo } from "react";
import { getDaftarPerizinan, PerizinanData } from "./actions";
import { formatDateID } from "@/lib/date";
import { Download, Search, Loader2, ArrowUpDown, ChevronLeft, ChevronRight, Filter, ImageIcon, ExternalLink } from "lucide-react";
import * as XLSX from "xlsx";
import toast from "react-hot-toast";

export function LaporanPerizinanClient({ initialData }: { initialData: PerizinanData[] }) {
  const [data, setData] = useState<PerizinanData[]>(initialData);
  const [filterPeriod, setFilterPeriod] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Sorting
  const [sortField, setSortField] = useState<"waktuPengajuan" | "namaLengkap">("waktuPengajuan");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleFilterChange = async (period: string) => {
    setFilterPeriod(period);
    setIsLoading(true);
    try {
      const result = await getDaftarPerizinan(period);
      setData(result);
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
      if (sortField === "waktuPengajuan") {
        const aTime = new Date(a.waktuPengajuan).getTime();
        const bTime = new Date(b.waktuPengajuan).getTime();
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

    const exportData = filteredAndSortedData.map(item => {
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

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Perizinan");
    
    // Adjust column widths
    const colWidths = [
      { wch: 20 }, // Waktu Submit
      { wch: 15 }, // NIS
      { wch: 30 }, // Nama Santri
      { wch: 10 }, // Kategori
      { wch: 10 }, // Durasi
      { wch: 15 }, // Tanggal Mulai
      { wch: 15 }, // Tanggal Selesai
      { wch: 50 }, // Keterangan
      { wch: 15 }, // Ada Bukti
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `Laporan_Perizinan_Santri_${filterPeriod}.xlsx`);
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

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Laporan Perizinan</h1>
          <p className="text-slate-500">Lihat dan ekspor data izin dan sakit santri.</p>
        </div>
        <button
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          Export Excel
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
                    onClick={() => handleSort("waktuPengajuan")}
                  >
                    <div className="flex items-center gap-1">
                      WAKTU SUBMIT {sortField === "waktuPengajuan" && <ArrowUpDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => handleSort("namaLengkap")}
                  >
                    <div className="flex items-center gap-1">
                      SANTRI {sortField === "namaLengkap" && <ArrowUpDown className="w-3 h-3" />}
                    </div>
                  </th>
                  <th className="px-4 py-4 font-semibold">RENTANG & DURASI</th>
                  <th className="px-4 py-4 font-semibold">KETERANGAN</th>
                  <th className="px-4 py-4 font-semibold">BUKTI</th>
                  <th className="px-4 py-4 font-semibold text-center">KATEGORI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedData.length > 0 ? (
                  paginatedData.map((item) => {
                    const durasi = Math.round((new Date(item.tanggalSelesai).getTime() - new Date(item.tanggalMulai).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    
                    return (
                      <tr key={item.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-4 font-medium text-slate-900 align-top">
                          {formatDateID(item.waktuPengajuan)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="font-bold text-slate-800">{item.santri.namaLengkap}</div>
                          <div className="text-xs text-slate-500 mt-0.5">NIS: {item.santri.nomorInduk}</div>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="font-medium text-slate-700">
                            {durasi === 1 
                              ? formatDateID(item.tanggalMulai) 
                              : `${formatDateID(item.tanggalMulai)} - ${formatDateID(item.tanggalSelesai)}`}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">({durasi} Hari)</div>
                        </td>
                        <td className="px-4 py-4 align-top max-w-xs">
                          <p className="text-sm text-slate-700 italic truncate" title={item.keterangan}>"{item.keterangan}"</p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          {item.buktiUrl ? (
                            <a href={item.buktiUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center p-2 bg-emerald-50 text-emerald-600 rounded-md hover:bg-emerald-100 transition-colors" title="Lihat Bukti">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="inline-flex items-center justify-center p-2 bg-slate-50 text-slate-400 rounded-md">
                              <ImageIcon className="w-4 h-4" />
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center align-top">
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold ${
                            item.kategori === 'Sakit' 
                              ? 'bg-rose-100 text-rose-700' 
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            {item.kategori.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
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
                  // Simplified pagination display (show surrounding pages)
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
    </div>
  );
}

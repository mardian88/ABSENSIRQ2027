"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Trophy, AlertTriangle, ArrowRight, Medal, AlertOctagon, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

type RekapPoin = {
  santri: {
    id: string;
    namaLengkap: string;
    nomorInduk: string;
  };
  totalPoin: number;
  totalReward: number;
  totalPunishment: number;
  jumlahRiwayat: number;
};

export function PoinDashboardClient({ data }: { data: RekapPoin[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"prestasi" | "bermasalah">("prestasi");
  
  // Sorting
  const [sortField, setSortField] = useState<"totalPoin" | "namaLengkap">("totalPoin");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const handleSort = (field: "totalPoin" | "namaLengkap") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Filter Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(d => 
        d.santri.namaLengkap.toLowerCase().includes(q) ||
        d.santri.nomorInduk.toLowerCase().includes(q)
      );
    }

    // Filter Tab (Prestasi: >=100, Bermasalah: <100) or just sort differently?
    // Wait, let's keep all data and just change default sort order based on tab, or filter it?
    // User requested "pisahkan", so:
    if (activeTab === "prestasi") {
      // Menampilkan santri dari poin paling tinggi
      result.sort((a, b) => b.totalPoin - a.totalPoin);
    } else {
      // Menampilkan santri dari poin paling rendah
      result.sort((a, b) => a.totalPoin - b.totalPoin);
    }

    // User Explicit Sorting (overrides tab default)
    result.sort((a, b) => {
      if (sortField === "totalPoin") {
        return sortOrder === "asc" ? a.totalPoin - b.totalPoin : b.totalPoin - a.totalPoin;
      } else {
        return sortOrder === "asc" 
          ? a.santri.namaLengkap.localeCompare(b.santri.namaLengkap)
          : b.santri.namaLengkap.localeCompare(a.santri.namaLengkap);
      }
    });

    return result;
  }, [data, searchQuery, activeTab, sortField, sortOrder]);

  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rapor Poin Kedisiplinan</h1>
          <p className="text-sm text-slate-500">Pantau prestasi dan pelanggaran santri (Modal Awal: 100 Poin)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Header Tabs & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-slate-100 gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
            <button
              onClick={() => { setActiveTab("prestasi"); setCurrentPage(1); setSortField("totalPoin"); setSortOrder("desc"); }}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${
                activeTab === "prestasi" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Trophy className="w-4 h-4" /> Poin Tertinggi
            </button>
            <button
              onClick={() => { setActiveTab("bermasalah"); setCurrentPage(1); setSortField("totalPoin"); setSortOrder("asc"); }}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${
                activeTab === "bermasalah" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <AlertTriangle className="w-4 h-4" /> Poin Terendah
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari Santri atau NIS..." 
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold">No</th>
                <th className="px-6 py-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort("namaLengkap")}>
                  <div className="flex items-center gap-2">
                    Nama Santri
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-center">Histori</th>
                <th className="px-6 py-4 font-semibold text-center text-emerald-600">+ Reward</th>
                <th className="px-6 py-4 font-semibold text-center text-rose-600">- Punishment</th>
                <th className="px-6 py-4 font-semibold text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort("totalPoin")}>
                  <div className="flex items-center justify-center gap-2">
                    Poin Akhir
                    <ArrowUpDown className="w-4 h-4" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Tidak ada data santri ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const actualIndex = (currentPage - 1) * itemsPerPage + idx + 1;
                  const isTop3 = activeTab === "prestasi" && sortField === "totalPoin" && sortOrder === "desc" && actualIndex <= 3 && !searchQuery;
                  const isBottom3 = activeTab === "bermasalah" && sortField === "totalPoin" && sortOrder === "asc" && actualIndex <= 3 && !searchQuery;

                  return (
                    <tr key={item.santri.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${
                          isTop3 ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm" :
                          isBottom3 ? "bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-sm" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {actualIndex}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{item.santri.namaLengkap}</span>
                          {isTop3 && <Medal className="w-4 h-4 text-emerald-500" />}
                          {isBottom3 && <AlertOctagon className="w-4 h-4 text-rose-500" />}
                        </div>
                        <div className="text-xs text-slate-500">NIS: {item.santri.nomorInduk}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-medium">{item.jumlahRiwayat}x</span>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-emerald-600">
                        {item.totalReward > 0 ? `+${item.totalReward}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-rose-600">
                        {item.totalPunishment > 0 ? `-${item.totalPunishment}` : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-lg font-black ${item.totalPoin >= 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {item.totalPoin}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link 
                          href={`/poin/${item.santri.id}`}
                          className="inline-flex items-center justify-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-md font-medium text-xs hover:bg-slate-100 transition-colors shadow-sm"
                        >
                          Lihat / Input
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
            <span className="text-sm text-slate-500">
              Menampilkan <span className="font-semibold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> hingga <span className="font-semibold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)}</span> dari <span className="font-semibold text-slate-700">{filteredAndSortedData.length}</span> entri
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

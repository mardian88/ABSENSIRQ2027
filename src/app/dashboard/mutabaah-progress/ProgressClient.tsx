"use client";

import { useState } from "react";
import { Search, CheckCircle2, AlertTriangle, MessageSquare } from "lucide-react";
import * as XLSX from "xlsx";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getProgressColumns } from "./columns";

export function ProgressClient({ data }: { data: any[] }) {
  const [search, setSearch] = useState("");

  const filtered = data.filter(d => 
    d.namaSantri.toLowerCase().includes(search.toLowerCase()) || 
    (d.namaHalaqoh && d.namaHalaqoh.toLowerCase().includes(search.toLowerCase()))
  );

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(filtered.map(d => ({
      "NIS": d.nis,
      "Nama Santri": d.namaSantri,
      "Halaqah": d.namaHalaqoh || "-",
      "Capaian Mengaji": d.mengaji ? d.mengaji.capaian : "Belum ada",
      "Tanggal Update Mengaji": d.mengaji ? new Date(d.mengaji.waktuDibuat).toLocaleDateString('id-ID') : "-",
      "Capaian Hafalan": d.hafalan ? d.hafalan.capaian : "Belum ada",
      "Tanggal Update Hafalan": d.hafalan ? new Date(d.hafalan.waktuDibuat).toLocaleDateString('id-ID') : "-",
      "Lama Tidak Update (Hari)": d.hariTanpaUpdate >= 0 ? d.hariTanpaUpdate : "Belum pernah"
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Progress Mutabaah");
    XLSX.writeFile(wb, `Progress_Mutabaah_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Progress Mutabaah Santri</h1>
          <p className="text-slate-500">Pantau capaian terakhir hafalan dan bacaan mengaji masing-masing santri.</p>
        </div>
        <button onClick={handleExport} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          Export Excel
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="relative max-w-md w-full">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama santri atau halaqah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1 text-rose-600">
              <div className="w-3 h-3 rounded-full bg-rose-100 border border-rose-300"></div>
              &gt; 7 Hari Tidak Update
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <div className="w-3 h-3 rounded-full bg-white border border-slate-200"></div>
              Aktif Update
            </div>
          </div>
        </div>
        
        <DataTable
          columns={getProgressColumns()}
          data={data}
          searchKey="namaSantri"
        />
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Search, Trophy, AlertTriangle, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getPoinColumns, RekapPoin } from "./columns";

export function PoinDashboardClient({ data }: { data: RekapPoin[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"prestasi" | "bermasalah">("prestasi");

  const sortedData = useMemo(() => {
    let result = [...data];

    if (activeTab === "prestasi") {
      result.sort((a, b) => b.totalPoin - a.totalPoin);
    } else {
      result.sort((a, b) => a.totalPoin - b.totalPoin);
    }

    return result;
  }, [data, activeTab]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rapor Poin Kedisiplinan</h1>
          <p className="text-sm text-slate-500">Pantau prestasi dan pelanggaran santri (Modal Awal: 100 Poin)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden relative">
        {/* Header Tabs & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center p-4 border-b border-slate-100 gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg w-full md:w-auto">
            <button
              onClick={() => setActiveTab("prestasi")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${
                activeTab === "prestasi" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Trophy className="w-4 h-4" /> Poin Tertinggi
            </button>
            <button
              onClick={() => setActiveTab("bermasalah")}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all ${
                activeTab === "bermasalah" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <AlertTriangle className="w-4 h-4" /> Poin Terendah
            </button>
          </div>
        </div>

        {/* Data Table */}
        <DataTable
          columns={getPoinColumns(activeTab)}
          data={sortedData}
          searchKey="namaLengkap"
        />
      </div>
    </div>
  );
}

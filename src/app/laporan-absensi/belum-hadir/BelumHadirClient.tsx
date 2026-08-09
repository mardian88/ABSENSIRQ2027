"use client";

import { useState } from "react";
import { getSantriBelumHadir } from "./actions";
import { Search, Loader2, Filter, RefreshCw, UserMinus, UserCheck } from "lucide-react";
import toast from "react-hot-toast";

type SantriData = {
  id: string;
  nomorInduk: string;
  namaLengkap: string;
  halaqoh: string | null;
  sesi: string | null;
};

type SesiOption = {
  id: string;
  namaSesi: string;
  jamMulai: string | null;
};

export function BelumHadirClient({ 
  initialData, 
  sesiOptions, 
  initialSesiId 
}: { 
  initialData: SantriData[]; 
  sesiOptions: SesiOption[];
  initialSesiId?: string;
}) {
  const [data, setData] = useState<SantriData[]>(initialData);
  const [selectedSesi, setSelectedSesi] = useState<string>(initialSesiId || "semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchBelumHadir = async (sesiId: string) => {
    setIsLoading(true);
    try {
      const res = await getSantriBelumHadir(sesiId === "semua" ? undefined : sesiId);
      setData(res);
      toast.success("Data berhasil diperbarui");
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat data belum hadir");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSesiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSesi(val);
    fetchBelumHadir(val);
  };

  // Filter local untuk search
  const filteredData = data.filter(s => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return s.namaLengkap.toLowerCase().includes(q) || s.nomorInduk.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserMinus className="w-6 h-6 text-rose-500" />
            History Belum Hadir
          </h1>
          <p className="text-sm text-slate-500 mt-1">Daftar santri yang belum melakukan absensi masuk pada hari ini.</p>
        </div>
        
        <button
          onClick={() => fetchBelumHadir(selectedSesi)}
          disabled={isLoading}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm font-medium text-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center text-sm font-medium text-slate-500">
            <Filter className="w-4 h-4 mr-1.5" /> Filter Sesi:
          </div>
          <select 
            value={selectedSesi} 
            onChange={handleSesiChange}
            className="flex-1 md:w-48 bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block px-3 py-2 outline-none"
          >
            <option value="semua">Semua Sesi</option>
            {sesiOptions.map(s => (
              <option key={s.id} value={s.id}>{s.namaSesi} {s.jamMulai ? `(${s.jamMulai})` : ''}</option>
            ))}
          </select>
        </div>
        
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input 
            type="text" 
            className="bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 px-3 py-2 outline-none" 
            placeholder="Cari nama atau NIS..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold border-b border-slate-200 w-16">No</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-200">Nama Santri</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-200">NIS</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-200">Halaqoh</th>
                <th className="px-6 py-4 font-semibold border-b border-slate-200">Sesi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading && data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                    <p>Memuat data...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                      <UserCheck className="w-8 h-8 text-emerald-500" />
                    </div>
                    <p className="font-medium text-slate-600">Alhamdulillah!</p>
                    <p className="text-sm">Semua santri pada sesi ini sudah melakukan absen masuk.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.namaLengkap}</td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">{item.nomorInduk}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{item.halaqoh || "-"}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {item.sesi || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

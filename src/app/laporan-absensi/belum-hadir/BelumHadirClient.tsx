"use client";

import { useState } from "react";
import { getSantriBelumHadir, sendPesanBelumHadir } from "./actions";
import { Loader2, Filter, RefreshCw, UserMinus, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getBelumHadirColumns } from "./columns";

type SantriData = {
  id: string;
  nomorInduk: string;
  namaLengkap: string;
  halaqoh: string | null;
  sesi: string | null;
  statusPesan?: string | null;
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

  const handleKirimPesan = async (idSantri: string, statusPesan: string | null) => {
    if (statusPesan) {
      toast.error("Pesan sudah dikirim hari ini.");
      return;
    }
    
    const toastId = toast.loading("Mengirim pesan...");
    try {
      const res = await sendPesanBelumHadir(idSantri);
      if (res.success) {
        toast.success("Pesan berhasil dikirim!", { id: toastId });
        fetchBelumHadir(selectedSesi);
      } else {
        toast.error(res.message || "Gagal mengirim pesan", { id: toastId });
      }
    } catch (e) {
      console.error(e);
      toast.error("Terjadi kesalahan sistem", { id: toastId });
    }
  };

  const handleSesiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedSesi(val);
    fetchBelumHadir(val);
  };

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
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}
        
        {data.length === 0 && !isLoading ? (
          <div className="px-6 py-12 text-center text-slate-500">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
              <UserCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="font-medium text-slate-600">Alhamdulillah!</p>
            <p className="text-sm">Semua santri pada sesi ini sudah melakukan absen masuk.</p>
          </div>
        ) : (
          <DataTable
            columns={getBelumHadirColumns(handleKirimPesan)}
            data={data}
            searchKey="namaLengkap"
          />
        )}
      </div>
    </div>
  );
}

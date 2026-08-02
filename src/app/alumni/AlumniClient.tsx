"use client";

import { useState } from "react";
import { Search, Trash2, RefreshCw } from "lucide-react";
import { aktifkanKembali, hapusPermanen } from "./actions";
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert";

export function AlumniClient({ alumniList }: { alumniList: any[] }) {
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredAlumni = alumniList.filter((s) => 
    s.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
    s.nomorInduk.toLowerCase().includes(search.toLowerCase())
  );

  const handleAktifkan = async (id: string) => {
    const confirmed = await showConfirm("Aktifkan Kembali?", "Status alumni ini akan dikembalikan menjadi santri aktif.");
    if (confirmed) {
      setIsLoading(true);
      try {
        await aktifkanKembali(id);
        showSuccess("Berhasil", "Data berhasil diaktifkan kembali.");
      } catch (error) {
        showError("Gagal", "Terjadi kesalahan sistem.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Hapus Permanen?", "Data alumni ini beserta semua data terkait akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.");
    if (confirmed) {
      setIsLoading(true);
      try {
        await hapusPermanen(id);
        showSuccess("Terhapus", "Data berhasil dihapus permanen.");
      } catch (error) {
        showError("Gagal", "Terjadi kesalahan saat menghapus data.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Database Alumni</h1>
          <p className="text-slate-500 mt-1">Daftar santri yang sudah lulus atau berstatus alumni.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-200">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau NIS..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold text-slate-600 text-sm">NIS</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Nama Lengkap</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Halaqoh Terakhir</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Kontak Wali</th>
                <th className="p-4 font-semibold text-slate-600 text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAlumni.length > 0 ? (
                filteredAlumni.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-900">{s.nomorInduk}</td>
                    <td className="p-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                          {s.namaLengkap.charAt(0)}
                        </div>
                        {s.namaLengkap}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{s.halaqoh || "-"}</td>
                    <td className="p-4 text-slate-600 text-sm">{s.kontakOrtu}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button 
                          onClick={() => handleAktifkan(s.id)}
                          disabled={isLoading}
                          className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Aktifkan Kembali Menjadi Santri"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id)} 
                          disabled={isLoading}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Permanen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Belum ada data alumni.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

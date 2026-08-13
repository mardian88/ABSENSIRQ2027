"use client";

import { useState } from "react";
import { Search, Trash2, RefreshCw } from "lucide-react";
import { aktifkanKembali, hapusPermanen } from "./actions";
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getAlumniColumns } from "./columns";

export function AlumniClient({ alumniList }: { alumniList: any[] }) {
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

      <DataTable sortColumn=nomorInduk
        columns={getAlumniColumns({ handleAktifkan, handleDelete, isLoading })}
        data={alumniList}
        searchKey="namaLengkap"
      />
    </div>
  );
}

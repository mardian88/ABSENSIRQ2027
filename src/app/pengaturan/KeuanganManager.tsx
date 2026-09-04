"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, ShieldAlert, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert";
import { createPengaturan, updatePengaturan, deletePengaturan, getPengaturanKeuangan } from "./actions_keuangan";

const schema = z.object({
  namaPembayaran: z.string().min(1, "Nama pembayaran wajib diisi"),
  nominalDefault: z.coerce.number().min(0, "Nominal tidak boleh negatif"),
  nominalSaudara: z.coerce.number().min(0, "Nominal tidak boleh negatif"),
});

type KeuanganFormValues = z.infer<typeof schema>;

export function KeuanganManager() {
  const [data, setData] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const res = await getPengaturanKeuangan();
    setData(res);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      namaPembayaran: "",
      nominalDefault: 0,
      nominalSaudara: 0
    }
  });

  const onSubmit = async (values: KeuanganFormValues) => {
    setIsSaving(true);
    try {
      if (editingId) {
        await updatePengaturan(editingId, values);
        showSuccess("Berhasil", "Pengaturan pembayaran berhasil diperbarui");
      } else {
        await createPengaturan(values);
        showSuccess("Berhasil", "Pengaturan pembayaran berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      fetchData();
    } catch (error: any) {
      showError("Gagal", error.message || "Terjadi kesalahan");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, kode: string | null) => {
    if (kode === "KAS_BULANAN") {
      showError("Ditolak", "Pengaturan Kas Bulanan adalah pengaturan sistem bawaan yang tidak bisa dihapus.");
      return;
    }
    
    const confirmed = await showConfirm("Hapus Pengaturan?", "Anda yakin ingin menghapus pengaturan pembayaran ini?");
    if (confirmed) {
      setIsSaving(true);
      try {
        await deletePengaturan(id);
        showSuccess("Berhasil", "Pengaturan berhasil dihapus");
        fetchData();
      } catch (error: any) {
        showError("Gagal", error.message || "Terjadi kesalahan");
      } finally {
        setIsSaving(false);
      }
    }
  };

  const openEdit = (item: any) => {
    setEditingId(item.id);
    form.reset({
      namaPembayaran: item.namaPembayaran,
      nominalDefault: item.nominalDefault,
      nominalSaudara: item.nominalSaudara
    });
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setEditingId(null);
    form.reset({
      namaPembayaran: "",
      nominalDefault: 0,
      nominalSaudara: 0
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pengaturan Keuangan</h1>
          <p className="text-slate-500">Kelola besaran nominal untuk berbagai jenis pembayaran santri.</p>
        </div>
        <button 
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tambah Pembayaran
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <th className="p-4 font-semibold text-sm">Nama Pembayaran</th>
                <th className="p-4 font-semibold text-sm">Tipe Sistem</th>
                <th className="p-4 font-semibold text-sm">Nominal Default</th>
                <th className="p-4 font-semibold text-sm">Nominal (Ada Saudara)</th>
                <th className="p-4 font-semibold text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={item.id} className={`border-b border-slate-100 hover:bg-slate-50 ${item.kode === 'KAS_BULANAN' ? 'bg-amber-50/30' : ''}`}>
                  <td className="p-4">
                    <div className="font-medium text-slate-800">{item.namaPembayaran}</div>
                  </td>
                  <td className="p-4">
                    {item.kode === 'KAS_BULANAN' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        <ShieldAlert className="w-3 h-3" />
                        Sistem (Kas Utama)
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        Kustom
                      </span>
                    )}
                  </td>
                  <td className="p-4 font-medium text-slate-700">Rp {item.nominalDefault.toLocaleString('id-ID')}</td>
                  <td className="p-4 font-medium text-slate-700">Rp {item.nominalSaudara.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => openEdit(item)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {item.kode !== 'KAS_BULANAN' && (
                      <button 
                        onClick={() => handleDelete(item.id, item.kode)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              
              {data.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Belum ada pengaturan keuangan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">{editingId ? "Edit Pembayaran" : "Tambah Pembayaran"}</h2>
            </div>
            <div className="p-6">
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pembayaran</label>
                  <input {...form.register("namaPembayaran")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="Misal: Uang Pangkal" />
                  {form.formState.errors.namaPembayaran && <span className="text-xs text-rose-500">{form.formState.errors.namaPembayaran.message}</span>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nominal Default (Normal)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">Rp</span>
                    <input type="number" {...form.register("nominalDefault")} className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  {form.formState.errors.nominalDefault && <span className="text-xs text-rose-500">{form.formState.errors.nominalDefault.message}</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Jika Ada Saudara)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500">Rp</span>
                    <input type="number" {...form.register("nominalSaudara")} className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Isi sama dengan nominal normal jika tidak ada diskon khusus saudara.</p>
                  {form.formState.errors.nominalSaudara && <span className="text-xs text-rose-500">{form.formState.errors.nominalSaudara.message}</span>}
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 mt-6">
                  <button type="button" onClick={() => setIsDialogOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors">Batal</button>
                  <button type="submit" disabled={isSaving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50">
                    {isSaving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

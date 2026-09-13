"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

export function PenugasanGuruClient({ guruList, halaqahList }: { guruList: any[], halaqahList: any[] }) {
  const [loading, setLoading] = useState(false);
  const [penugasan, setPenugasan] = useState<any[]>([]);
  
  const [form, setForm] = useState({
    idGuru: "",
    idHalaqah: "",
    subject: "Tahfidz",
    role: "Pengampu Utama"
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { getPenugasan } = await import('./actions');
      const res = await getPenugasan();
      setPenugasan(res);
    } catch (error) {
      toast.error("Gagal memuat data penugasan");
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.idGuru || !form.idHalaqah) {
      toast.error("Guru dan Halaqah harus dipilih");
      return;
    }
    setLoading(true);
    try {
      const { savePenugasan } = await import('./actions');
      await savePenugasan(form);
      toast.success("Berhasil menambah penugasan");
      setForm({ ...form, idGuru: "", idHalaqah: "" });
      loadData();
    } catch (error) {
      toast.error("Gagal menambah penugasan");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus penugasan ini?")) return;
    setLoading(true);
    try {
      const { deletePenugasan } = await import('./actions');
      await deletePenugasan(id);
      toast.success("Berhasil dihapus");
      loadData();
    } catch (error) {
      toast.error("Gagal menghapus penugasan");
    }
    setLoading(false);
  };

  const getGuruName = (id: string) => guruList.find(g => g.id === id)?.namaLengkap || "Unknown Guru";
  const getHalaqahName = (id: string) => halaqahList.find(h => h.id === id)?.namaHalaqoh || "Unknown Halaqah";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Form Tambah */}
      <Card className="lg:col-span-1 h-fit">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">Tambah Penugasan Baru</h3>
          
          <div className="space-y-2">
            <Label>Guru</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.idGuru}
              onChange={e => setForm({...form, idGuru: e.target.value})}
            >
              <option value="">-- Pilih Guru --</option>
              {guruList.map(g => (
                <option key={g.id} value={g.id}>{g.namaLengkap}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Halaqah</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.idHalaqah}
              onChange={e => setForm({...form, idHalaqah: e.target.value})}
            >
              <option value="">-- Pilih Halaqah --</option>
              {halaqahList.map(h => (
                <option key={h.id} value={h.id}>{h.namaHalaqoh}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Mata Pelajaran (Modul)</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.subject}
              onChange={e => setForm({...form, subject: e.target.value})}
            >
              <option value="Tahfidz">Tahfidz</option>
              <option value="Tahsin">Tahsin</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label>Peran</Label>
            <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.role}
              onChange={e => setForm({...form, role: e.target.value})}
            >
              <option value="Pengampu Utama">Pengampu Utama</option>
              <option value="Pembimbing">Pembimbing</option>
            </select>
          </div>

          <Button onClick={handleAdd} disabled={loading} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
            Tambah
          </Button>
        </CardContent>
      </Card>

      {/* List Penugasan */}
      <Card className="lg:col-span-2">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-4">Guru</th>
                  <th className="px-6 py-4">Halaqah</th>
                  <th className="px-6 py-4">Mata Pelajaran</th>
                  <th className="px-6 py-4">Peran</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && penugasan.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">Loading...</td>
                  </tr>
                ) : penugasan.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">Belum ada penugasan guru.</td>
                  </tr>
                ) : (
                  penugasan.map(p => (
                    <tr key={p.id} className="bg-white border-b hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-900">{getGuruName(p.idGuru)}</td>
                      <td className="px-6 py-4">{getHalaqahName(p.idHalaqah)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${p.subject === 'Tahfidz' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {p.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4">{p.role}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

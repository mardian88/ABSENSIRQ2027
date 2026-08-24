"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPengumumanPortal, tambahPengumuman, updatePengumuman, hapusPengumuman } from "./actions";
import { Loader2, Plus, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert";
import { formatWhatsAppStyle } from "@/lib/utils";

export function PengumumanManager() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ id: "", judul: "", isi: "", isAktif: true });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const res = await getPengumumanPortal();
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await updatePengumuman(form.id, form.judul, form.isi, form.isAktif);
        toast.success("Pengumuman diperbarui");
      } else {
        await tambahPengumuman(form.judul, form.isi, form.isAktif);
        toast.success("Pengumuman ditambahkan");
      }
      setIsEditing(false);
      setForm({ id: "", judul: "", isi: "", isAktif: true });
      loadData();
    } catch (err: any) {
      toast.error("Gagal menyimpan pengumuman");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: any) => {
    setForm({ id: item.id, judul: item.judul, isi: item.isi, isAktif: item.isAktif });
    setIsEditing(true);
  };

  const handleDelete = async (id: string) => {
    if (await showConfirm("Hapus Pengumuman?", "Pengumuman ini akan dihapus secara permanen.", "Ya, Hapus")) {
      try {
        await hapusPengumuman(id);
        toast.success("Pengumuman dihapus");
        loadData();
      } catch (err: any) {
        toast.error("Gagal menghapus pengumuman");
      }
    }
  };

  const handleToggleAktif = async (item: any) => {
    const actionText = item.isAktif ? "menonaktifkan" : "mengaktifkan";
    if (await showConfirm(`${item.isAktif ? 'Nonaktifkan' : 'Aktifkan'} Pengumuman?`, `Yakin ingin ${actionText} pengumuman ini?`, "Ya, Lanjutkan", item.isAktif)) {
      try {
        await updatePengumuman(item.id, item.judul, item.isi, !item.isAktif);
        toast.success(`Pengumuman berhasil di${actionText}`);
        loadData();
      } catch (err: any) {
        toast.error(`Gagal ${actionText} pengumuman`);
      }
    }
  };

  return (
    <Card className="mt-6 animate-in fade-in duration-300 slide-in-from-bottom-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Pengumuman Portal Ortu</CardTitle>
          <CardDescription>Kelola informasi dan pengumuman untuk ditampilkan di Dashboard Portal Ortu.</CardDescription>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pengumuman
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 p-4 rounded-lg border">
            <div className="space-y-2">
              <Label>Judul Pengumuman</Label>
              <Input 
                required 
                value={form.judul} 
                onChange={(e) => setForm({ ...form, judul: e.target.value })} 
                placeholder="Contoh: Libur Idul Fitri"
              />
            </div>
            <div className="space-y-2">
              <Label>Isi Pengumuman</Label>
              <Textarea 
                required 
                rows={4}
                value={form.isi} 
                onChange={(e) => setForm({ ...form, isi: e.target.value })} 
                placeholder="Tuliskan isi pengumuman..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isAktif"
                checked={form.isAktif}
                onChange={(e) => setForm({ ...form, isAktif: e.target.checked })} 
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="isAktif">Tampilkan di Portal Ortu (Aktif)</Label>
            </div>
            <div className="flex space-x-2 pt-2">
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Simpan
              </Button>
              <Button type="button" variant="outline" onClick={() => { setIsEditing(false); setForm({ id: "", judul: "", isi: "", isAktif: true }); }}>
                Batal
              </Button>
            </div>
          </form>
        ) : loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : data.length === 0 ? (
          <div className="text-center p-8 text-slate-500 border rounded-lg border-dashed">
            Belum ada pengumuman
          </div>
        ) : (
          <div className="space-y-4">
            {data.map((item) => (
              <div key={item.id} className="flex justify-between items-start p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-800">{item.judul}</h3>
                    {item.isAktif ? (
                      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle className="w-3 h-3 mr-1" /> Aktif
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        <XCircle className="w-3 h-3 mr-1" /> Non-Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{new Date(item.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="text-slate-700 mt-2 whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{ __html: formatWhatsAppStyle(item.isi) }}></p>
                </div>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleToggleAktif(item)} title={item.isAktif ? "Nonaktifkan" : "Aktifkan"}>
                    {item.isAktif ? <XCircle className="w-4 h-4 text-amber-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                    <Edit className="w-4 h-4 text-slate-600" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


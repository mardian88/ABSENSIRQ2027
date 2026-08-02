"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getCabangList, addCabang, deleteCabang, createCabangAdmin } from "./actions";
import { Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { showConfirm } from "@/lib/sweetalert";

export default function CabangPage() {
  const [cabangs, setCabangs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCabang, setNewCabang] = useState({ namaCabang: "", alamat: "" });

  const fetchCabang = async () => {
    setLoading(true);
    const res = await getCabangList();
    setCabangs(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchCabang();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await addCabang(newCabang);
    setNewCabang({ namaCabang: "", alamat: "" });
    await fetchCabang();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Yakin ingin menghapus cabang ini?", "Semua data absensi cabang ini akan terpengaruh.");
    if (confirmed) {
      await deleteCabang(id);
      await fetchCabang();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Manajemen Cabang</h1>

      <Card>
        <CardHeader>
          <CardTitle>Tambah Cabang Baru</CardTitle>
          <CardDescription>Tambahkan lokasi cabang baru untuk pendataan santri.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Nama Cabang</Label>
              <Input 
                value={newCabang.namaCabang} 
                onChange={e => setNewCabang({...newCabang, namaCabang: e.target.value})} 
                placeholder="Cabang Pusat"
                required 
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Alamat (Opsional)</Label>
              <Input 
                value={newCabang.alamat} 
                onChange={e => setNewCabang({...newCabang, alamat: e.target.value})} 
                placeholder="Jl. Keadilan No.1"
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Tambah
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Cabang</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : cabangs.length === 0 ? (
            <p className="text-slate-500 text-center py-4">Belum ada cabang terdaftar.</p>
          ) : (
            <div className="space-y-4">
              {cabangs.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-bold">{c.namaCabang}</p>
                    <p className="text-sm text-slate-500">{c.alamat || "-"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={async () => {
                      const username = prompt("Masukkan Username untuk Admin Cabang ini:");
                      if (!username) return;
                      const password = prompt("Masukkan Password untuk Admin Cabang ini (minimal 8 karakter):");
                      if (!password) return;
                      if (password.length < 8) {
                        toast.error("Password harus minimal 8 karakter");
                        return;
                      }
                      const res = await createCabangAdmin(c.id, username, password, c.namaCabang);
                      if (res.success) toast.success(res.message);
                      else toast.error("Gagal: " + res.message);
                    }}>
                      Buat Akun Admin
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

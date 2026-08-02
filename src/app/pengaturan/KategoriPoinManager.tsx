"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getKategoriPoin, createKategoriPoin, deleteKategoriPoin } from "../poin/actions";
import { Plus, Trash2, Loader2, Award, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { showConfirm } from "@/lib/sweetalert";

type Kategori = {
  id: string;
  nama: string;
  jenis: string;
  nilaiPoin: number;
};

export function KategoriPoinManager() {
  const [data, setData] = useState<Kategori[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form State
  const [nama, setNama] = useState("");
  const [jenis, setJenis] = useState<"reward" | "punishment">("reward");
  const [nilai, setNilai] = useState("");

  const fetchData = async () => {
    try {
      const res = await getKategoriPoin();
      setData(res);
    } catch (e) {
      toast.error("Gagal memuat kategori poin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || !nilai) return;

    setSaving(true);
    try {
      const res = await createKategoriPoin({
        nama,
        jenis,
        nilaiPoin: parseInt(nilai, 10)
      });
      if (res.success) {
        toast.success("Kategori poin ditambahkan");
        setNama("");
        setNilai("");
        fetchData();
      }
    } catch (e) {
      toast.error("Gagal menambahkan kategori poin");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Hapus Kategori?", "Apakah Anda yakin ingin menghapus kategori ini?", "Hapus", true);
    if (!confirmed) return;
    try {
      await deleteKategoriPoin(id);
      toast.success("Kategori dihapus");
      fetchData();
    } catch (e) {
      toast.error("Gagal menghapus kategori");
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const rewards = data.filter(d => d.jenis === 'reward');
  const punishments = data.filter(d => d.jenis === 'punishment');

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg text-slate-800">Master Kategori Poin</CardTitle>
          <CardDescription>
            Tambahkan jenis-jenis pelanggaran dan prestasi untuk digunakan saat memberi poin santri.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleCreate} className="bg-white border border-slate-200 p-4 rounded-xl mb-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="space-y-2 md:col-span-2">
                <Label>Nama Kategori</Label>
                <Input 
                  placeholder="Misal: Datang Terlambat, Setor Ziyadah..." 
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Jenis</Label>
                <select 
                  className="w-full h-10 px-3 py-2 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={jenis}
                  onChange={(e) => setJenis(e.target.value as any)}
                >
                  <option value="reward">Prestasi (Reward)</option>
                  <option value="punishment">Pelanggaran (Punishment)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Nilai Poin</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number"
                    min="1"
                    placeholder="Nilai" 
                    value={nilai}
                    onChange={(e) => setNilai(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 w-12 flex-shrink-0 p-0">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                  </Button>
                </div>
              </div>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rewards */}
            <div className="space-y-3">
              <div className="flex items-center text-emerald-600 font-bold mb-3 border-b border-emerald-100 pb-2">
                <Award className="w-5 h-5 mr-2" /> Poin Plus (Prestasi)
              </div>
              {rewards.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Belum ada kategori prestasi.</p>
              ) : (
                <ul className="space-y-2">
                  {rewards.map(item => (
                    <li key={item.id} className="flex justify-between items-center p-3 rounded-lg border border-emerald-100 bg-emerald-50/30 text-sm">
                      <span className="font-medium text-slate-700">{item.nama}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-emerald-600">+{item.nilaiPoin}</span>
                        <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Punishments */}
            <div className="space-y-3">
              <div className="flex items-center text-rose-600 font-bold mb-3 border-b border-rose-100 pb-2">
                <AlertCircle className="w-5 h-5 mr-2" /> Poin Minus (Pelanggaran)
              </div>
              {punishments.length === 0 ? (
                <p className="text-sm text-slate-500 italic">Belum ada kategori pelanggaran.</p>
              ) : (
                <ul className="space-y-2">
                  {punishments.map(item => (
                    <li key={item.id} className="flex justify-between items-center p-3 rounded-lg border border-rose-100 bg-rose-50/30 text-sm">
                      <span className="font-medium text-slate-700">{item.nama}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-rose-600">-{item.nilaiPoin}</span>
                        <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

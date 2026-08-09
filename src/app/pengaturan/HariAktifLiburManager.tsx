"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Trash2, CalendarIcon } from "lucide-react";
import toast from "react-hot-toast";
import { showConfirm } from "@/lib/sweetalert";
import { getHariAktifList, toggleHariAktif, getHariLiburList, addHariLibur, deleteHariLibur, toggleHariLibur } from "./actions";

export function HariAktifLiburManager() {
  const [loading, setLoading] = useState(true);
  const [hariAktif, setHariAktif] = useState<any[]>([]);
  const [hariLibur, setHariLibur] = useState<any[]>([]);
  
  const [formLibur, setFormLibur] = useState({ tanggal: "", keterangan: "" });
  const [savingLibur, setSavingLibur] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [aktifRes, liburRes] = await Promise.all([
      getHariAktifList(),
      getHariLiburList()
    ]);
    
    // Urutkan senin-minggu
    const order = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"];
    aktifRes.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    
    setHariAktif(aktifRes);
    setHariLibur(liburRes);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleAktif = async (id: string, current: boolean) => {
    toast.promise(toggleHariAktif(id, !current), {
      loading: 'Menyimpan...',
      success: 'Berhasil diubah',
      error: 'Gagal mengubah'
    });
    setHariAktif(prev => prev.map(h => h.id === id ? { ...h, isAktif: !current } : h));
  };

  const handleToggleLibur = async (id: string, current: boolean) => {
    toast.promise(toggleHariLibur(id, !current), {
      loading: 'Menyimpan...',
      success: 'Berhasil diubah',
      error: 'Gagal mengubah'
    });
    setHariLibur(prev => prev.map(h => h.id === id ? { ...h, isAktif: !current } : h));
  };

  const handleDeleteLibur = async (id: string) => {
    const confirmed = await showConfirm("Hapus Hari Libur?", "Apakah Anda yakin ingin menghapus hari libur ini?", "Hapus", true);
    if (!confirmed) return;
    await deleteHariLibur(id);
    toast.success("Dihapus");
    loadData();
  };

  const handleTanggalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length > 2 && val.length <= 4) {
      val = val.slice(0, 2) + ':' + val.slice(2);
    } else if (val.length > 4) {
      val = val.slice(0, 2) + ':' + val.slice(2, 4) + ':' + val.slice(4, 8);
    }
    setFormLibur({ ...formLibur, tanggal: val });
  };

  const handleAddLibur = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formLibur.tanggal.length !== 10) {
      return toast.error("Format tanggal harus DD:MM:YYYY");
    }
    
    // Convert DD:MM:YYYY to YYYY-MM-DD for DB storage
    const [dd, mm, yyyy] = formLibur.tanggal.split(':');
    const dbDate = `${yyyy}-${mm}-${dd}`;
    
    setSavingLibur(true);
    await addHariLibur({ ...formLibur, tanggal: dbDate });
    setFormLibur({ tanggal: "", keterangan: "" });
    setSavingLibur(false);
    toast.success("Berhasil ditambahkan");
    loadData();
  };

  if (loading) {
    return <Card><CardContent className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 slide-in-from-bottom-2">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Hari Aktif</CardTitle>
          <CardDescription>Pilih hari apa saja yang diberlakukan absensi reguler.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {hariAktif.map(h => (
              <label key={h.id} className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${h.isAktif ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'}`}>
                <input 
                  type="checkbox"
                  checked={h.isAktif}
                  onChange={() => handleToggleAktif(h.id, h.isAktif)}
                  className="h-5 w-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                />
                <span className={`font-medium ${h.isAktif ? 'text-emerald-900' : 'text-slate-500 line-through'}`}>{h.hari}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Hari Libur (Pengecualian)</CardTitle>
          <CardDescription>Tambahkan tanggal spesifik yang diliburkan meskipun jatuh di hari aktif.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddLibur} className="flex flex-col sm:flex-row gap-3 mb-6 bg-slate-50 p-4 rounded-lg border">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal Libur</label>
              <Input 
                type="text" 
                placeholder="DD:MM:YYYY"
                required 
                value={formLibur.tanggal}
                onChange={handleTanggalChange}
                maxLength={10}
              />
            </div>
            <div className="flex-[2]">
              <label className="text-xs font-semibold text-slate-500 uppercase">Keterangan / Nama Libur</label>
              <Input 
                type="text" 
                placeholder="Cth: Libur Idul Fitri"
                required 
                value={formLibur.keterangan}
                onChange={e => setFormLibur({...formLibur, keterangan: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={savingLibur}>
                {savingLibur ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Tambah
              </Button>
            </div>
          </form>

          {hariLibur.length === 0 ? (
            <div className="text-center p-8 text-slate-500 border rounded-lg border-dashed">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Belum ada daftar hari libur khusus.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {hariLibur.map(libur => (
                <div key={libur.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4">
                     <input 
                        type="checkbox"
                        checked={libur.isAktif}
                        onChange={() => handleToggleLibur(libur.id, libur.isAktif)}
                        className="h-5 w-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      />
                      <div className={!libur.isAktif ? 'opacity-50 line-through' : ''}>
                        <div className="font-semibold">
                          {libur.tanggal.includes('-') ? libur.tanggal.split('-').reverse().join(':') : libur.tanggal}
                        </div>
                        <div className="text-sm text-slate-500">{libur.keterangan}</div>
                      </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteLibur(libur.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

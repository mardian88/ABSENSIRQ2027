"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Edit2, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import { showConfirm } from "@/lib/sweetalert";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getSesiAbsensiList, createSesiAbsensi, updateSesiAbsensi, deleteSesiAbsensi } from "./actions";

const parseTime = (timeStr: string) => {
  if (!timeStr) return new Date();
  const [h, m] = timeStr.split(":");
  const d = new Date();
  d.setHours(parseInt(h || "0"), parseInt(m || "0"), 0);
  return d;
};

const formatTime = (d: Date | null) => {
  if (!d) return "00:00";
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

export function SesiAbsensiManager() {
  const [sesiList, setSesiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    namaSesi: "",
    waktuMulaiMasuk: "14:00",
    waktuBatasMasuk: "15:30",
    waktuMulaiPulang: "16:00",
    waktuNormalPulang: "17:00",
    waktuTutup: "18:00"
  });

  const loadData = async () => {
    setLoading(true);
    const data = await getSesiAbsensiList();
    setSesiList(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      namaSesi: "",
      waktuMulaiMasuk: "14:00",
      waktuBatasMasuk: "15:30",
      waktuMulaiPulang: "16:00",
      waktuNormalPulang: "17:00",
      waktuTutup: "18:00"
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sesi: any) => {
    setEditingId(sesi.id);
    setFormData({
      namaSesi: sesi.namaSesi,
      waktuMulaiMasuk: sesi.waktuMulaiMasuk,
      waktuBatasMasuk: sesi.waktuBatasMasuk,
      waktuMulaiPulang: sesi.waktuMulaiPulang,
      waktuNormalPulang: sesi.waktuNormalPulang,
      waktuTutup: sesi.waktuTutup
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Hapus Sesi?", "Apakah Anda yakin ingin menghapus sesi ini? Pastikan tidak ada santri yang terikat pada sesi ini.", "Hapus", true);
    if (confirmed) {
      await deleteSesiAbsensi(id);
      toast.success("Sesi berhasil dihapus");
      loadData();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await updateSesiAbsensi(editingId, formData);
        toast.success("Sesi berhasil diperbarui");
      } else {
        await createSesiAbsensi(formData);
        toast.success("Sesi baru berhasil ditambahkan");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      toast.error("Terjadi kesalahan sistem");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="animate-in fade-in duration-300 slide-in-from-bottom-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Pengaturan Sesi Absensi</CardTitle>
          <CardDescription>Buat jadwal (shift) absensi yang dapat ditetapkan ke masing-masing santri.</CardDescription>
        </div>
        <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Sesi Baru
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
        ) : sesiList.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
            Belum ada jadwal sesi yang dibuat. Silakan tambah sesi pertama Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sesiList.map((sesi) => (
              <div key={sesi.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm relative group overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-bold text-lg text-emerald-800">{sesi.namaSesi}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => handleOpenEdit(sesi)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(sesi.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <div className="text-sm">
                      <span className="text-slate-500 inline-block w-28">Mulai Masuk:</span>
                      <span className="font-semibold text-slate-700">{sesi.waktuMulaiMasuk}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                    <div className="text-sm">
                      <span className="text-slate-500 inline-block w-28">Batas Masuk:</span>
                      <span className="font-semibold text-slate-700">{sesi.waktuBatasMasuk} <span className="text-xs text-orange-600 font-normal">(Terlambat)</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    <div className="text-sm">
                      <span className="text-slate-500 inline-block w-28">Mulai Pulang:</span>
                      <span className="font-semibold text-slate-700">{sesi.waktuMulaiPulang}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    <div className="text-sm">
                      <span className="text-slate-500 inline-block w-28">Normal Pulang:</span>
                      <span className="font-semibold text-slate-700">{sesi.waktuNormalPulang} <span className="text-xs text-indigo-600 font-normal">(Sblm = Cepat)</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    <div className="text-sm">
                      <span className="text-slate-500 inline-block w-28">Tutup Akses:</span>
                      <span className="font-semibold text-slate-700">{sesi.waktuTutup}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800">{editingId ? "Edit Jadwal Sesi" : "Tambah Jadwal Sesi"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <Label>Nama Sesi (Contoh: Sesi Sore)</Label>
                <Input required value={formData.namaSesi} onChange={e => setFormData({...formData, namaSesi: e.target.value})} placeholder="Sesi Sore, Sesi Malam..." />
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1 flex flex-col">
                  <Label className="text-emerald-700 mb-1">Jam Mulai Masuk</Label>
                  <DatePicker
                    selected={parseTime(formData.waktuMulaiMasuk)}
                    onChange={(date) => setFormData({...formData, waktuMulaiMasuk: formatTime(date)})}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Waktu"
                    dateFormat="HH:mm"
                    timeFormat="HH:mm"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-orange-600 mb-1">Jam Batas Masuk <br/><span className="text-xs font-normal">(&gt; Terlambat)</span></Label>
                  <DatePicker
                    selected={parseTime(formData.waktuBatasMasuk)}
                    onChange={(date) => setFormData({...formData, waktuBatasMasuk: formatTime(date)})}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Waktu"
                    dateFormat="HH:mm"
                    timeFormat="HH:mm"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1 flex flex-col">
                  <Label className="text-blue-700 mb-1">Jam Mulai Pulang</Label>
                  <DatePicker
                    selected={parseTime(formData.waktuMulaiPulang)}
                    onChange={(date) => setFormData({...formData, waktuMulaiPulang: formatTime(date)})}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Waktu"
                    dateFormat="HH:mm"
                    timeFormat="HH:mm"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-1 flex flex-col">
                  <Label className="text-indigo-600 mb-1">Jam Normal Pulang <br/><span className="text-xs font-normal">(&lt; Pulang Cepat)</span></Label>
                  <DatePicker
                    selected={parseTime(formData.waktuNormalPulang)}
                    onChange={(date) => setFormData({...formData, waktuNormalPulang: formatTime(date)})}
                    showTimeSelect
                    showTimeSelectOnly
                    timeIntervals={15}
                    timeCaption="Waktu"
                    dateFormat="HH:mm"
                    timeFormat="HH:mm"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col">
                <Label className="text-rose-600 mb-1">Jam Mesin Tutup (Batas Akhir)</Label>
                <DatePicker
                  selected={parseTime(formData.waktuTutup)}
                  onChange={(date) => setFormData({...formData, waktuTutup: formatTime(date)})}
                  showTimeSelect
                  showTimeSelectOnly
                  timeIntervals={15}
                  timeCaption="Waktu"
                  dateFormat="HH:mm"
                  timeFormat="HH:mm"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
                <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Simpan Sesi
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Card>
  );
}

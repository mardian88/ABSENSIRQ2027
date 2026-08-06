"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Plus, Edit2, Trash2, MessageSquare, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { showConfirm } from "@/lib/sweetalert";
import { 
  getPengaturanHumas, 
  updatePengaturanHumas, 
  getTemplatePesanList, 
  saveTemplatePesan, 
  deleteTemplatePesan, 
  toggleTemplatePesan 
} from "./actions";

const JENIS_PESAN_OPTIONS = [
  { value: "absen_masuk", label: "Absen Masuk" },
  { value: "absen_pulang", label: "Absen Pulang" },
  { value: "absen_telat", label: "Terlambat Masuk" },
  { value: "absen_pulang_cepat", label: "Pulang Cepat" },
  { value: "reminder_absen", label: "Reminder Belum Absen" },
  { value: "izin_ortu", label: "Keterangan Izin ke Orang Tua" },
  { value: "alpa_ortu", label: "Alpa (Tanpa Keterangan) ke Orang Tua" },
  { value: "alpa_admin", label: "Info Alpa ke Admin" },
  { value: "gagal_absen_masuk", label: "Peringatan Pulang Sebelum Masuk" },
  { value: "lupa_absen_masuk", label: "Lupa Absen Masuk (Siang/Sore)" },
  { value: "reminder_absen_admin", label: "Reminder Belum Absen (Admin)" },
];

export function PesanOtomatisManager() {
  const [loading, setLoading] = useState(true);
  
  // Fonnte Settings
  const [humasId, setHumasId] = useState("");
  const [tokenFonnte, setTokenFonnte] = useState("");
  const [nomorAdmin, setNomorAdmin] = useState("");
  const [isFonnteAktif, setIsFonnteAktif] = useState(false);
  const [nomorReminder, setNomorReminder] = useState("");
  const [isReminderAktif, setIsReminderAktif] = useState(false);
  const [savingFonnte, setSavingFonnte] = useState(false);

  // Templates
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ jenisPesan: "", isiPesan: "", isAktif: true });
  const [savingTemplate, setSavingTemplate] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (silent: boolean = false) => {
    if (!silent) setLoading(true);
    const humas = await getPengaturanHumas();
    setTokenFonnte(humas.tokenFonnte || "");
    setNomorAdmin(humas.nomorAdmin || "");
    setIsFonnteAktif(humas.isAktif ?? false);
    setNomorReminder(humas.nomorReminder || "");
    setIsReminderAktif(humas.isReminderAktif ?? false);

    const tmpls = await getTemplatePesanList();
    // Sort templates by jenisPesan to group them together
    tmpls.sort((a, b) => a.jenisPesan.localeCompare(b.jenisPesan));
    setTemplates(tmpls);
    if (!silent) setLoading(false);
  };

  const handleSaveFonnte = async () => {
    setSavingFonnte(true);
    try {
      await updatePengaturanHumas({
        id: humasId,
        tokenFonnte,
        nomorAdmin,
        isAktif: isFonnteAktif,
        nomorReminder,
        isReminderAktif
      });
      toast.success("Pengaturan Fonnte berhasil disimpan!");
    } catch (e) {
      toast.error("Gagal menyimpan pengaturan.");
    } finally {
      setSavingFonnte(false);
    }
  };

  const openAddDialog = (initialIsiPesan: string = "") => {
    setEditingTemplateId(null);
    setFormData({ jenisPesan: "", isiPesan: initialIsiPesan, isAktif: true });
    setIsDialogOpen(true);
  };

  const handleDuplicateLengkap = async (tmpl: any) => {
    setSavingTemplate(true);
    try {
      await saveTemplatePesan({
        jenisPesan: tmpl.jenisPesan,
        isiPesan: tmpl.isiPesan,
        isAktif: tmpl.isAktif
      });
      toast.success("Template berhasil diduplikat!");
      loadData(true);
    } catch (e: any) {
      toast.error(e.message || "Gagal menduplikat");
    } finally {
      setSavingTemplate(false);
    }
  };

  const openEditDialog = (tmpl: any) => {
    setEditingTemplateId(tmpl.id);
    setFormData({ jenisPesan: tmpl.jenisPesan, isiPesan: tmpl.isiPesan, isAktif: tmpl.isAktif });
    setIsDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!formData.jenisPesan || !formData.isiPesan) {
      toast.error("Jenis pesan dan isi pesan wajib diisi!");
      return;
    }
    setSavingTemplate(true);
    try {
      await saveTemplatePesan({
        id: editingTemplateId || undefined,
        jenisPesan: formData.jenisPesan,
        isiPesan: formData.isiPesan,
        isAktif: formData.isAktif
      });
      toast.success("Template berhasil disimpan!");
      setIsDialogOpen(false);
      loadData(true);
    } catch (e: any) {
      toast.error(e.message || "Terjadi kesalahan");
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    const confirmed = await showConfirm("Hapus Template?", "Apakah Anda yakin ingin menghapus template ini?", "Hapus", true);
    if (confirmed) {
      await deleteTemplatePesan(id);
      toast.success("Template dihapus!");
      loadData(true);
    }
  };

  const handleToggleTemplate = async (id: string, currentStatus: boolean) => {
    await toggleTemplatePesan(id, !currentStatus);
    toast.success("Status template diperbarui!");
    loadData(true);
  };

  const getLabelJenisPesan = (val: string) => {
    return JENIS_PESAN_OPTIONS.find(o => o.value === val)?.label || val;
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      
      {/* Pengaturan API Fonnte */}
      <Card className="animate-in fade-in duration-300 slide-in-from-bottom-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-600" />
            Integrasi WhatsApp (Fonnte)
          </CardTitle>
          <CardDescription>
            Masukkan token API dari Fonnte (md.fonnte.com) untuk mengaktifkan pengiriman pesan otomatis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Token Fonnte</Label>
              <Input 
                value={tokenFonnte}
                onChange={(e) => setTokenFonnte(e.target.value)}
                placeholder="Contoh: xxxxxxxx-xxxx-xxxx-xxxx"
                type="password"
              />
            </div>
            <div className="space-y-2">
              <Label>Nomor WhatsApp Admin (Penerima Notif Izin)</Label>
              <Input 
                value={nomorAdmin}
                onChange={(e) => setNomorAdmin(e.target.value)}
                placeholder="Contoh: 081234567890"
              />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input 
                type="checkbox"
                id="fonnteAktif"
                checked={isFonnteAktif}
                onChange={(e) => setIsFonnteAktif(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <Label htmlFor="fonnteAktif" className="font-medium">Aktifkan Pengiriman Pesan Otomatis</Label>
            </div>
            
            <hr className="my-4" />
            
            <div className="space-y-2">
              <Label>Nomor WhatsApp Pengingat / Reminder</Label>
              <Input 
                value={nomorReminder}
                onChange={(e) => setNomorReminder(e.target.value)}
                placeholder="Contoh: 081234567890"
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input 
                type="checkbox"
                id="reminderAktif"
                checked={isReminderAktif}
                onChange={(e) => setIsReminderAktif(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <Label htmlFor="reminderAktif" className="font-medium">Aktifkan Reminder Otomatis (Cron)</Label>
            </div>

            <Button onClick={handleSaveFonnte} disabled={savingFonnte} className="bg-emerald-600 hover:bg-emerald-700">
              {savingFonnte ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Simpan Pengaturan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Template Pesan */}
      <Card className="animate-in fade-in duration-300 slide-in-from-bottom-3">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Template Pesan Otomatis</CardTitle>
            <CardDescription>Atur format pesan yang akan dikirimkan untuk tiap kejadian (Masuk, Pulang, Alpa, dll).</CardDescription>
          </div>
          <Button onClick={() => openAddDialog()} size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-1" /> Buat Template
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mt-4">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                Belum ada template pesan yang dibuat.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(tmpl => (
                  <div key={tmpl.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-emerald-800 text-sm">
                        {getLabelJenisPesan(tmpl.jenisPesan)}
                      </h4>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleToggleTemplate(tmpl.id, tmpl.isAktif)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tmpl.isAktif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}
                        >
                          {tmpl.isAktif ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-700 whitespace-pre-wrap font-mono line-clamp-4">
                      {tmpl.isiPesan}
                    </div>
                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100 flex-wrap">
                      <button onClick={() => handleDuplicateLengkap(tmpl)} className="flex items-center text-[10px] font-medium text-slate-500 hover:text-emerald-600 transition-colors" title="Duplikat jenis dan isi">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Duplikat
                      </button>
                      <button onClick={() => openAddDialog(tmpl.isiPesan)} className="flex items-center text-[10px] font-medium text-slate-500 hover:text-orange-600 transition-colors" title="Duplikat isinya saja ke jenis pesan lain">
                        <MessageSquare className="w-3.5 h-3.5 mr-1" /> Salin Isi
                      </button>
                      <button onClick={() => openEditDialog(tmpl)} className="flex items-center text-[10px] font-medium text-slate-500 hover:text-blue-600 transition-colors ml-auto">
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </button>
                      <button onClick={() => handleDeleteTemplate(tmpl.id)} className="flex items-center text-[10px] font-medium text-slate-500 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Buat/Edit Template */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                {editingTemplateId ? "Edit Template Pesan" : "Buat Template Baru"}
              </h2>
            </div>
            <div className="p-5 space-y-4">
              
              {!editingTemplateId && (
                <div className="space-y-1.5">
                  <Label>Jenis Pesan / Trigger</Label>
                  <select 
                    value={formData.jenisPesan}
                    onChange={e => setFormData({...formData, jenisPesan: e.target.value})}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Pilih Jenis Pesan --</option>
                    {JENIS_PESAN_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label} {templates.filter(t => t.jenisPesan === opt.value).length > 0 ? `(${templates.filter(t => t.jenisPesan === opt.value).length} Ada)` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingTemplateId && (
                <div className="space-y-1.5">
                  <Label>Jenis Pesan</Label>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium">
                    {getLabelJenisPesan(formData.jenisPesan)}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <Label>Isi Pesan (Gunakan Variabel di bawah)</Label>
                </div>
                <textarea 
                  value={formData.isiPesan}
                  onChange={e => setFormData({...formData, isiPesan: e.target.value})}
                  rows={6}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Assalamualaikum, Bapak/Ibu wali santri. Santri atas nama [NAMA_SANTRI] telah hadir pada pukul [WAKTU]."
                />
              </div>

              {/* Bantuan Variabel */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-xs text-emerald-800 space-y-2">
                <p className="font-semibold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> Variabel yang bisa digunakan:</p>
                <ul className="list-disc pl-4 space-y-1 opacity-90">
                  <li><code>[NAMA_SANTRI]</code> : Menampilkan nama lengkap santri</li>
                  <li><code>[NIS]</code> : Menampilkan Nomor Induk Santri</li>
                  <li><code>[WAKTU]</code> : Jam kejadian (Misal: 15:30)</li>
                  <li><code>[TANGGAL]</code> : Tanggal kejadian (Misal: 12 Okt 2024)</li>
                  <li><code>[HALAQAH]</code> : Nama Halaqah santri</li>
                  <li><code>[KETERANGAN]</code> : Keterangan detail (untuk Izin/Alpa)</li>
                </ul>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input 
                  type="checkbox"
                  id="templateAktif"
                  checked={formData.isAktif}
                  onChange={e => setFormData({...formData, isAktif: e.target.checked})}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <Label htmlFor="templateAktif">Aktifkan Template Ini</Label>
              </div>

            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
              <Button onClick={handleSaveTemplate} disabled={savingTemplate} className="bg-emerald-600 hover:bg-emerald-700">
                {savingTemplate ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

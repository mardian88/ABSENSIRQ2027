"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Plus, Edit2, Trash2, CheckCircle, XCircle, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";
import { showConfirm } from "@/lib/sweetalert";
import { 
  getIdCardTemplates, 
  saveIdCardTemplate, 
  deleteIdCardTemplate, 
  setActiveIdCardTemplate,
  uploadImageToCloudinary
} from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function IdCardManager() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ id: "", tipe: "santri", nama: "", backgroundUrl: "", isActive: false });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await getIdCardTemplates();
      setTemplates(data);
    } catch (e) {
      toast.error("Gagal memuat template ID Card");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const url = await uploadImageToCloudinary(uploadData);
      setFormData({ ...formData, backgroundUrl: url });
      toast.success("Gambar berhasil diunggah");
    } catch (error) {
      toast.error("Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama || !formData.backgroundUrl) {
      toast.error("Nama dan gambar background wajib diisi");
      return;
    }

    setSaving(true);
    try {
      await saveIdCardTemplate({
        id: formData.id || undefined,
        tipe: formData.tipe,
        nama: formData.nama,
        backgroundUrl: formData.backgroundUrl,
        isActive: formData.isActive
      });
      toast.success("Template berhasil disimpan");
      setIsAdding(false);
      setFormData({ id: "", tipe: "santri", nama: "", backgroundUrl: "", isActive: false });
      loadTemplates();
    } catch (error) {
      toast.error("Gagal menyimpan template");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Hapus Template?", "Template ini akan dihapus permanen.", "Hapus");
    if (confirmed) {
      try {
        await deleteIdCardTemplate(id);
        toast.success("Template dihapus");
        loadTemplates();
      } catch (error) {
        toast.error("Gagal menghapus");
      }
    }
  };

  const handleSetActive = async (id: string, tipe: string) => {
    try {
      await setActiveIdCardTemplate(id, tipe);
      toast.success("Template berhasil diaktifkan");
      loadTemplates();
    } catch (error) {
      toast.error("Gagal mengaktifkan template");
    }
  };

  const santriTemplates = templates.filter(t => t.tipe === "santri");
  const guruTemplates = templates.filter(t => t.tipe === "guru");

  const renderTemplateList = (list: any[], typeName: string) => {
    if (list.length === 0) {
      return <p className="text-sm text-slate-500 py-4 text-center border rounded-md bg-slate-50 border-dashed">Belum ada template {typeName}</p>;
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {list.map(t => (
          <div key={t.id} className={`border rounded-lg p-3 relative overflow-hidden flex flex-col ${t.isActive ? 'border-emerald-500 shadow-sm bg-emerald-50/20' : 'border-slate-200 bg-white'}`}>
            {t.isActive && (
              <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg z-10 flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" /> AKTIF
              </div>
            )}
            <div className="aspect-[54/86] w-full max-w-[200px] mx-auto bg-slate-100 rounded-md overflow-hidden relative border shadow-sm">
              <img src={t.backgroundUrl} alt={t.nama} className="w-full h-full object-cover" />
            </div>
            <div className="mt-4 flex-1">
              <h3 className="font-semibold text-sm line-clamp-1" title={t.nama}>{t.nama}</h3>
              <p className="text-xs text-slate-500 mb-4">Ditambahkan {new Date(t.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
            
            <div className="flex items-center gap-2 mt-auto pt-3 border-t">
              {!t.isActive ? (
                <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => handleSetActive(t.id, t.tipe)}>
                  Jadikan Aktif
                </Button>
              ) : (
                <Button variant="default" size="sm" className="flex-1 text-xs h-8 bg-emerald-600 hover:bg-emerald-700 cursor-default">
                  Sedang Aktif
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => handleDelete(t.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="animate-in fade-in duration-300 slide-in-from-bottom-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Template ID Card</CardTitle>
          <CardDescription>Kelola desain background ID Card untuk Siswa dan Guru.</CardDescription>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant={isAdding ? "outline" : "default"}>
          {isAdding ? "Batal" : <><Plus className="w-4 h-4 mr-2" /> Tambah Template</>}
        </Button>
      </CardHeader>
      <CardContent>
        {isAdding && (
          <div className="mb-8 p-4 border rounded-lg bg-slate-50 shadow-inner">
            <h3 className="font-medium text-sm mb-4 border-b pb-2">Tambah Template Baru</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipe Template</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={formData.tipe}
                    onChange={(e) => setFormData({...formData, tipe: e.target.value})}
                  >
                    <option value="santri">Siswa (Santri)</option>
                    <option value="guru">Guru (Asatidz)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Nama Template</Label>
                  <Input 
                    value={formData.nama}
                    onChange={e => setFormData({...formData, nama: e.target.value})}
                    placeholder="Contoh: Desain Merah Putih"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Upload Gambar Background (Disarankan rasio 54x86 potrait)</Label>
                <div className="flex items-center gap-4">
                  {formData.backgroundUrl && (
                    <div className="w-20 h-32 bg-slate-200 rounded overflow-hidden border shrink-0">
                      <img src={formData.backgroundUrl} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 relative">
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={handleUploadImage}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <Button type="button" variant="outline" className="w-full justify-start" disabled={uploading}>
                      {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                      {uploading ? "Mengunggah..." : formData.backgroundUrl ? "Ganti Gambar" : "Pilih Gambar"}
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="pt-2 flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Batal</Button>
                <Button type="submit" disabled={saving || uploading || !formData.nama || !formData.backgroundUrl}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Simpan Template
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold border-b pb-2 text-slate-800">Template Siswa</h3>
              {renderTemplateList(santriTemplates, "Siswa")}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold border-b pb-2 text-slate-800">Template Guru</h3>
              {renderTemplateList(guruTemplates, "Guru")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

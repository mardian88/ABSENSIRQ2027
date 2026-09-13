"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import { getPengaturanHalamanSukses, updatePengaturanHalamanSukses, uploadLogoHalamanSukses } from "./actions";

// Use dynamic import to prevent SSR issues with Quill
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false, loading: () => <p>Loading editor...</p> });

export function ThankYouPageManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ id: "", urlLogo: "", pesanHtml: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    getPengaturanHalamanSukses().then((res) => {
      setData({
        id: res.id,
        urlLogo: res.urlLogo || "",
        pesanHtml: res.pesanHtml,
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalUrlLogo = data.urlLogo;
      if (logoFile) {
        const formData = new FormData();
        formData.append("logo", logoFile);
        finalUrlLogo = await uploadLogoHalamanSukses(formData);
      }

      await updatePengaturanHalamanSukses(data.id, {
        urlLogo: finalUrlLogo,
        pesanHtml: data.pesanHtml,
      });
      
      if (logoFile) {
        setData(prev => ({...prev, urlLogo: finalUrlLogo}));
        setLogoFile(null);
        setLogoPreview(null);
      }
      toast.success("Pengaturan Thank You Page disimpan!");
    } catch (error: any) {
      toast.error(error.message || "Gagal mengunggah logo");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const modules = useMemo(() => ({
    toolbar: [
      [{ 'font': ['sans-serif', 'serif', 'monospace', 'Plus Jakarta Sans', 'Roboto'] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'header': 1 }, { 'header': 2 }, 'blockquote'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }, { 'align': [] }],
      ['link', 'clean']
    ]
  }), []);

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card className="animate-in fade-in duration-300 slide-in-from-bottom-2">
      <CardHeader>
        <CardTitle>Pengaturan Thank You Page (Form Izin)</CardTitle>
        <CardDescription>Sesuaikan tampilan halaman sukses setelah wali santri mengirimkan form pengajuan izin/sakit. Anda dapat mengubah teks, memasukkan tulisan Arab, hingga mewarnai huruf.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <Label>Logo Halaman (Opsional)</Label>
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 relative shrink-0">
                {(logoPreview || data.urlLogo) ? (
                  <img 
                    src={logoPreview || data.urlLogo || ""} 
                    alt="Logo Preview" 
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-slate-400 text-xs text-center px-2">Belum ada logo</span>
                )}
              </div>
              <div className="space-y-2 flex-1">
                <Input 
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  Atau masukkan URL logo (jika tidak ingin mengunggah file):
                </p>
                <Input 
                  value={data.urlLogo || ""} 
                  onChange={e => setData({...data, urlLogo: e.target.value})} 
                  placeholder="https://example.com/logo-thankyou.png"
                  disabled={!!logoFile}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Pesan Sukses (Rich Text)</Label>
            <div className="bg-white [&_.ql-container]:min-h-[250px]">
              <ReactQuill 
                theme="snow" 
                value={data.pesanHtml} 
                onChange={(val) => setData({...data, pesanHtml: val})}
                modules={modules}
                className="mb-12"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Gunakan tool perataan kanan (align right) atau tombol RTL (Right-to-Left) untuk mengetik tulisan bahasa Arab dengan rapi.</p>
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Simpan Pengaturan
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

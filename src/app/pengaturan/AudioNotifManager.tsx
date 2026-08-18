"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Save, Volume2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateAudioSettings } from "./actions";

import { Input } from "@/components/ui/input";

export function AudioNotifManager({ initialData }: { initialData: any }) {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    isAudioMasukAktif: initialData?.isAudioMasukAktif ?? true,
    isAudioPulangAktif: initialData?.isAudioPulangAktif ?? true,
    isAudioGagalAktif: initialData?.isAudioGagalAktif ?? true,
    urlAudioMasuk: initialData?.urlAudioMasuk || "",
    urlAudioPulang: initialData?.urlAudioPulang || "",
    urlAudioGagal: initialData?.urlAudioGagal || ""
  });

  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    masuk: null,
    pulang: null,
    gagal: null
  });

  const handleSave = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("isAudioMasukAktif", settings.isAudioMasukAktif.toString());
    formData.append("isAudioPulangAktif", settings.isAudioPulangAktif.toString());
    formData.append("isAudioGagalAktif", settings.isAudioGagalAktif.toString());
    
    if (settings.urlAudioMasuk) formData.append("urlAudioMasuk", settings.urlAudioMasuk);
    if (settings.urlAudioPulang) formData.append("urlAudioPulang", settings.urlAudioPulang);
    if (settings.urlAudioGagal) formData.append("urlAudioGagal", settings.urlAudioGagal);

    if (files.masuk) formData.append("fileMasuk", files.masuk);
    if (files.pulang) formData.append("filePulang", files.pulang);
    if (files.gagal) formData.append("fileGagal", files.gagal);

    const res = await updateAudioSettings(formData);
    setLoading(false);
    if (res.success) {
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
  };

  const handleFileChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
    }
  };

  return (
    <Card className="shadow-lg border-0 mb-8">
      <CardHeader className="bg-slate-50 border-b border-slate-100 rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Volume2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-xl text-slate-800">Notifikasi Audio Absensi</CardTitle>
            <CardDescription>Atur suara saat absensi masuk, pulang, atau gagal.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-8">
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Audio Absen Masuk</Label>
              <p className="text-sm text-slate-500">Berbunyi jika scan absen masuk berhasil</p>
            </div>
            <input type="checkbox" checked={settings.isAudioMasukAktif} onChange={(e) => setSettings({...settings, isAudioMasukAktif: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
          </div>
          <div className="flex items-center gap-4">
            <Input type="file" accept="audio/*" onChange={(e) => handleFileChange("masuk", e)} className="flex-1" />
            {settings.urlAudioMasuk && !files.masuk && (
              <audio src={settings.urlAudioMasuk} controls className="h-10" />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Audio Absen Pulang</Label>
              <p className="text-sm text-slate-500">Berbunyi jika scan absen pulang berhasil</p>
            </div>
            <input type="checkbox" checked={settings.isAudioPulangAktif} onChange={(e) => setSettings({...settings, isAudioPulangAktif: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
          </div>
          <div className="flex items-center gap-4">
            <Input type="file" accept="audio/*" onChange={(e) => handleFileChange("pulang", e)} className="flex-1" />
            {settings.urlAudioPulang && !files.pulang && (
              <audio src={settings.urlAudioPulang} controls className="h-10" />
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Audio Scan Gagal</Label>
              <p className="text-sm text-slate-500">Berbunyi jika scan ditolak atau gagal</p>
            </div>
            <input type="checkbox" checked={settings.isAudioGagalAktif} onChange={(e) => setSettings({...settings, isAudioGagalAktif: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
          </div>
          <div className="flex items-center gap-4">
            <Input type="file" accept="audio/*" onChange={(e) => handleFileChange("gagal", e)} className="flex-1" />
            {settings.urlAudioGagal && !files.gagal && (
              <audio src={settings.urlAudioGagal} controls className="h-10" />
            )}
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Simpan Pengaturan Audio
        </Button>
      </CardContent>
    </Card>
  );
}

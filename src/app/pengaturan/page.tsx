"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getPengaturanProfil, updatePengaturanProfil } from "./actions";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { SesiAbsensiManager } from "./SesiAbsensiManager";
import { HariAktifLiburManager } from "./HariAktifLiburManager";
import { AutoAlpaManager } from "./AutoAlpaManager";
import { ThankYouPageManager } from "./ThankYouPageManager";
import { KategoriPoinManager } from "./KategoriPoinManager";
import { PesanOtomatisManager } from "./PesanOtomatisManager";
import { KeuanganManager } from "./KeuanganManager";
import { SaudaraManager } from "./SaudaraManager";
import { PengumumanManager } from "./PengumumanManager";
import { AudioNotifManager } from "./AudioNotifManager";
import { getAudioSettings } from "./actions";

export default function PengaturanPage() {
  const [loading, setLoading] = useState(true);
  const [audioData, setAudioData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profil");
  const [data, setData] = useState({ id: "", namaRumahQuran: "", urlLogo: "", warnaTema: "", passwordAbsensi: "", isPsbAktif: true, isCountdownAktif: false, batasWaktuPsb: "" });

  useEffect(() => {
    getPengaturanProfil().then(res => {
      // Format date to YYYY-MM-DDThh:mm if exists
      let dateStr = "";
      if (res?.batasWaktuPsb) {
         const d = new Date(res.batasWaktuPsb);
         dateStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
      }

      if(res) setData({ 
        id: res.id, 
        namaRumahQuran: res.namaRumahQuran, 
        urlLogo: res.urlLogo || "", 
        warnaTema: res.warnaTema || "", 
        passwordAbsensi: res.passwordAbsensi || "",
        isPsbAktif: res.isPsbAktif ?? true,
        isCountdownAktif: res.isCountdownAktif ?? false,
        batasWaktuPsb: dateStr
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...data,
      batasWaktuPsb: data.batasWaktuPsb ? new Date(data.batasWaktuPsb) : null
    };
    await updatePengaturanProfil(payload);
    setSaving(false);
    toast.success("Pengaturan berhasil disimpan!");
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Pengaturan Sistem</h1>

      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 bg-slate-100 p-1 rounded-lg">
        <button 
          onClick={() => setActiveTab("profil")} 
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'profil' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
        >
          🏢 Profil Lembaga
        </button>
        <button 
          onClick={() => setActiveTab("absensi")} 
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'absensi' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
        >
          ⏰ Jadwal Sesi
        </button>
        <button 
          onClick={() => setActiveTab("hari")} 
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'hari' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
        >
          📅 Hari & Libur
        </button>

        <button 
          onClick={() => setActiveTab("pesan")} 
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'pesan' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
        >
          💬 Pesan Otomatis
        </button>
        <button 
          onClick={() => setActiveTab("ortu")} 
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'ortu' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
        >
          👨‍👩‍👧 Portal Ortu
        </button>
        <button 
          onClick={() => setActiveTab("poin")} 
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'poin' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
        >
          ⭐ Poin
        </button>
        <button 
          onClick={() => setActiveTab("cabang")} 
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'cabang' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
        >
          📍 Cabang
        </button>
        <button 
          onClick={() => setActiveTab("keuangan")} 
          className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all ${activeTab === 'keuangan' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
        >
          💰 Keuangan
        </button>
      </div>

      {activeTab === "profil" && (
        <>
        <Card className="animate-in fade-in duration-300 slide-in-from-bottom-2">
          <CardHeader>
            <CardTitle>Profil Rumah Qur'an</CardTitle>
            <CardDescription>Atur identitas lembaga Anda yang akan muncul di aplikasi.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nama Rumah Qur'an</Label>
                  <Input 
                    value={data.namaRumahQuran} 
                    onChange={e => setData({...data, namaRumahQuran: e.target.value})} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Logo Lembaga (URL atau Upload)</Label>
                  <div className="flex gap-2 items-start">
                    <div className="flex-1 space-y-2">
                      <Input 
                        value={data.urlLogo} 
                        onChange={e => setData({...data, urlLogo: e.target.value})} 
                        placeholder="https://example.com/logo.png"
                      />
                      {data.urlLogo && (
                        <div className="border rounded-md p-2 w-max max-h-32 bg-slate-50">
                          <img src={data.urlLogo} alt="Logo" className="h-24 w-auto object-contain" />
                        </div>
                      )}
                    </div>
                    <div className="relative shrink-0">
                      <Input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setSaving(true);
                            try {
                              const formData = new FormData();
                              formData.append("file", file);
                              const { uploadImageToCloudinary, updatePengaturanProfil } = await import("./actions");
                              const url = await uploadImageToCloudinary(formData);
                              
                              const updatedData = {...data, urlLogo: url};
                              setData(updatedData);
                              
                              await updatePengaturanProfil({
                                ...updatedData,
                                batasWaktuPsb: updatedData.batasWaktuPsb ? new Date(updatedData.batasWaktuPsb) : null
                              });
                              
                              toast.success("Logo berhasil diunggah dan disimpan");
                            } catch (error) {
                              toast.error("Gagal mengunggah logo");
                            }
                            setSaving(false);
                          }
                        }}
                      />
                      <Button type="button" variant="outline" className="px-4">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                        Upload Logo
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Password Akses Absensi (Kiosk)</Label>
                  <Input 
                    type="text" 
                    value={data.passwordAbsensi} 
                    onChange={e => setData({...data, passwordAbsensi: e.target.value})} 
                    placeholder="Contoh: 123456 atau absenrahasia"
                  />
                  <p className="text-xs text-slate-500">Gunakan password ini di perangkat publik untuk membuka halaman pemindaian tanpa login ke Dashboard.</p>
                </div>
                <div className="space-y-2 pt-2">
                  <Label>Status Pendaftaran Santri Baru (PSB)</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={data.isPsbAktif ? "aktif" : "tidak_aktif"}
                    onChange={e => setData({...data, isPsbAktif: e.target.value === "aktif"})}
                  >
                    <option value="aktif">Pendaftaran Dibuka</option>
                    <option value="tidak_aktif">Pendaftaran Ditutup</option>
                  </select>
                </div>
                <div className="space-y-2 pt-2">
                  <Label className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      checked={data.isCountdownAktif}
                      onChange={e => setData({...data, isCountdownAktif: e.target.checked})}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Aktifkan Hitung Mundur (Countdown) Penutupan PSB</span>
                  </Label>
                </div>
                {data.isCountdownAktif && (
                  <div className="space-y-2 pl-6">
                    <Label>Batas Waktu Penutupan PSB</Label>
                    <DatePicker
                      selected={data.batasWaktuPsb ? new Date(data.batasWaktuPsb) : null}
                      onChange={(date: Date | null) => {
                         if(date) {
                           const tzOffset = date.getTimezoneOffset() * 60000;
                           const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
                           setData({...data, batasWaktuPsb: localISOTime});
                         } else {
                           setData({...data, batasWaktuPsb: ""});
                         }
                      }}
                      showTimeSelect
                      timeFormat="HH:mm"
                      timeIntervals={15}
                      timeCaption="Waktu"
                      dateFormat="dd/MM/yyyy HH:mm"
                      className="w-full h-10 px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      placeholderText="DD/MM/YYYY HH:MM"
                    />
                    <p className="text-xs text-slate-500">Tentukan tanggal dan jam penutupan pendaftaran. Countdown akan menghitung mundur ke waktu ini.</p>
                  </div>
                )}
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Simpan Profil
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <PengumumanManager />
      </>)}

      {activeTab === "absensi" && (
        <>
          <SesiAbsensiManager />
          <AudioNotifManager initialData={audioData} />
        </>
      )}

      {activeTab === "hari" && (
        <HariAktifLiburManager />
      )}

      {activeTab === "pesan" && (
        <div className="space-y-6">
          <AutoAlpaManager />
          <PesanOtomatisManager />
        </div>
      )}
      
      {activeTab === "keuangan" && (
        <div className="space-y-6">
          <KeuanganManager />
          <SaudaraManager />
        </div>
      )}

      {activeTab === "ortu" && (
        <ThankYouPageManager />
      )}

      {activeTab === "poin" && (
        <KategoriPoinManager />
      )}

      {activeTab === "cabang" && (
        <Card className="animate-in fade-in duration-300 slide-in-from-bottom-2">
          <CardHeader>
            <CardTitle>Pengaturan Cabang</CardTitle>
            <CardDescription>Kelola data cabang Rumah Qur'an dan sinkronisasi data antar cabang.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📍</span>
              </div>
              <p className="font-medium">Manajemen Cabang akan hadir di Fase 4.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

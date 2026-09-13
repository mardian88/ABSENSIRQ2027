"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { getPengaturanAbsensiGlobal, toggleAutoAlpa } from "./actions";

export function AutoAlpaManager() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ id: string, isAutoAlpaAktif: boolean } | null>(null);

  useEffect(() => {
    getPengaturanAbsensiGlobal().then(res => {
      setData(res as any);
      setLoading(false);
    });
  }, []);

  const handleToggle = async () => {
    if (!data) return;
    const newValue = !data.isAutoAlpaAktif;
    toast.promise(toggleAutoAlpa(data.id, newValue), {
      loading: 'Menyimpan pengaturan...',
      success: 'Pengaturan Otomatisasi berhasil diperbarui',
      error: 'Gagal memperbarui'
    });
    setData({ ...data, isAutoAlpaAktif: newValue });
  };

  if (loading || !data) {
    return <Card><CardContent className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></CardContent></Card>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 slide-in-from-bottom-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-amber-500" />
            <span>Otomatisasi Auto-Alpa</span>
          </CardTitle>
          <CardDescription>
            Atur sistem untuk memberikan status "Alpa" secara otomatis kepada santri yang tidak memiliki rekam absensi (Hadir/Izin/Sakit) pada hari aktif.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`p-6 border rounded-xl flex items-start justify-between transition-colors ${data.isAutoAlpaAktif ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
            <div className="space-y-2 max-w-[80%]">
              <h3 className={`font-semibold text-lg ${data.isAutoAlpaAktif ? 'text-emerald-800' : 'text-slate-700'}`}>
                {data.isAutoAlpaAktif ? "Status: AKTIF" : "Status: NONAKTIF"}
              </h3>
              <p className="text-sm text-slate-600">
                {data.isAutoAlpaAktif 
                  ? "Sistem akan mengecek kehadiran santri pada pukul 23:59 (lewat Cron Job). Jika hari ini adalah Hari Aktif dan bukan Hari Libur, santri yang kosong datanya akan ditandai ALPA."
                  : "Sistem tidak akan melakukan perubahan otomatis. Santri yang tidak absen akan dibiarkan kosong (tanpa keterangan) di database."}
              </p>
              {data.isAutoAlpaAktif && (
                <div className="mt-4 flex items-start space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  <AlertTriangle className="h-5 w-5 shrink-0" />
                  <p className="text-xs">Pastikan Anda telah mengatur <strong>Endpoint Cron Job</strong> (/api/cron/auto-alpa) di layanan seperti Vercel Cron atau UptimeRobot agar fungsi ini berjalan tepat waktu.</p>
                </div>
              )}
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={data.isAutoAlpaAktif}
                onChange={handleToggle}
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

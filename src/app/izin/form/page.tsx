"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ArrowLeft, Upload, Camera } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function FormIzinPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [jumlahHari, setJumlahHari] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [keterangan, setKeterangan] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File terlalu besar. Maksimal ukuran gambar adalah 50 MB.");
        e.target.value = "";
        setPreviewUrl(null);
        return;
      }
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      const keteranganStr = formData.get("keterangan") as string;
      const alphanumeric = keteranganStr.replace(/[^a-zA-Z0-9]/g, "");
      if (alphanumeric.length < 50) {
        toast.error(`Keterangan terlalu singkat. Minimal 50 huruf (saat ini ${alphanumeric.length})`);
        setLoading(false);
        return;
      }

      const buktiFile = formData.get("buktiFile") as File | null;
      if (jumlahHari >= 2 && (!buktiFile || buktiFile.size === 0)) {
        toast.error("Wajib melampirkan foto bukti untuk izin 2 hari atau lebih!");
        setLoading(false);
        return;
      }

      formData.append("jumlahHari", jumlahHari.toString());
      
      // Needs to fetch the current user's ID via an API or we can just send it to a server action that knows it from cookies.
      // Let's call our server action via fetch to an API route, or just use the server action directly.
      // Wait, server actions with FormData can just be imported.
      const { submitIzin, getOrtuSession } = await import("../actions");
      const session = await getOrtuSession();
      if (!session) {
        toast.error("Sesi telah habis");
        return router.push("/izin");
      }

      formData.append("idSantri", session.id);
      
      setUploadProgress(10);
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) return prev;
          return prev + 15;
        });
      }, 300);

      const res = await submitIzin(formData);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      if (res.success) {
        setTimeout(() => router.push("/izin/sukses"), 400);
      } else {
        toast.error(res.message || "Gagal mengirim pengajuan");
        setLoading(false);
      }
    } catch (err) {
      toast.error("Terjadi kesalahan sistem");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      <div className="bg-white p-4 flex items-center border-b border-slate-200 sticky top-0 z-10">
        <Link href="/izin/dashboard" className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold text-slate-800 ml-2">Formulir Pengajuan</h1>
      </div>

      <div className="p-6 pb-20">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-slate-700">Kategori Pengajuan <span className="text-rose-500">*</span></Label>
            <div className="grid grid-cols-2 gap-3">
              <label className="cursor-pointer">
                <input type="radio" name="kategori" value="Sakit" className="peer sr-only" required />
                <div className="p-3 text-center rounded-xl border border-slate-200 bg-white peer-checked:bg-rose-50 peer-checked:border-rose-500 peer-checked:text-rose-700 font-medium transition-all">
                  🤒 Sakit
                </div>
              </label>
              <label className="cursor-pointer">
                <input type="radio" name="kategori" value="Izin" className="peer sr-only" required />
                <div className="p-3 text-center rounded-xl border border-slate-200 bg-white peer-checked:bg-amber-50 peer-checked:border-amber-500 peer-checked:text-amber-700 font-medium transition-all">
                  ✈️ Izin
                </div>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Izin Berapa Hari? <span className="text-rose-500">*</span></Label>
            <Input 
              type="number" 
              name="jumlahHari" 
              value={jumlahHari}
              onChange={(e) => setJumlahHari(Math.max(1, Math.min(9, parseInt(e.target.value) || 1)))}
              min={1} 
              max={9}
              required 
              className="bg-white text-lg font-bold" 
            />
          </div>

          <div className="space-y-2">
            <Label className="text-slate-700">Keterangan Lengkap <span className="text-rose-500">*</span></Label>
            <Textarea 
              name="keterangan" 
              placeholder="Jelaskan alasan izin / sakit secara rinci (Minimal 50 huruf)..." 
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              required 
              className="min-h-[120px] bg-white resize-none"
            />
            <p className={`text-[11px] mt-1 ${keterangan.replace(/[^a-zA-Z0-9]/g, "").length < 50 ? "text-rose-500 font-medium" : "text-emerald-500 font-medium"}`}>
              {keterangan.replace(/[^a-zA-Z0-9]/g, "").length < 50 
                ? `Minimal 50 huruf (tidak termasuk tanda baca & spasi). Kurang ${50 - keterangan.replace(/[^a-zA-Z0-9]/g, "").length} huruf lagi.` 
                : `Minimal tercapai (${keterangan.replace(/[^a-zA-Z0-9]/g, "").length} huruf).`}
            </p>
          </div>

          {jumlahHari >= 2 && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
              <Label className="text-slate-700">Lampiran Bukti <span className="text-rose-500">*</span></Label>
              <p className="text-xs text-slate-500 -mt-1">Wajib menyertakan foto surat sakit atau bukti lainnya.</p>
              
              <label className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed border-slate-300 rounded-xl bg-white hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden">
                {previewUrl ? (
                  <div className="relative w-full h-48">
                    <img src={previewUrl} alt="Preview Bukti" className="w-full h-full object-contain bg-slate-100" />
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white mb-2" />
                      <p className="text-white text-sm font-medium">Ubah Foto</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="flex gap-2 mb-2 text-slate-400 group-hover:text-emerald-500 transition-colors">
                      <Camera className="w-6 h-6" />
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Ambil Foto / Pilih Galeri</p>
                    <p className="text-xs text-slate-400 mt-1">Tap di sini untuk memilih</p>
                  </div>
                )}
                <input type="file" name="buktiFile" className="hidden" accept="image/*" onChange={handleFileChange} />
              </label>

              {loading && uploadProgress > 0 && (
                <div className="w-full bg-slate-200 rounded-full h-3 mt-3 overflow-hidden shadow-inner">
                  <div className="bg-emerald-500 h-3 rounded-full transition-all duration-300 ease-out flex items-center justify-center text-[8px] font-bold text-white" style={{ width: `${uploadProgress}%` }}>
                    {uploadProgress}%
                  </div>
                </div>
              )}
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-base font-bold shadow-md shadow-emerald-200 mt-8"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Kirim Pengajuan"}
          </Button>
        </form>
      </div>
    </div>
  );
}

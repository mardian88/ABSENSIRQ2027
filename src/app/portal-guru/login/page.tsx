"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginGuru } from "../actions";
import { showError } from "@/lib/sweetalert";
import { Briefcase, Loader2, ArrowRight } from "lucide-react";

export default function LoginGuruClient() {
  const [nip, setNip] = useState("");
  const [wa, setWa] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await loginGuru(nip, wa);
    if (res.success) {
      router.push("/portal-guru");
    } else {
      showError("Gagal Login", res.message || "Pastikan NIP dan No WA benar.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <div className="md:w-1/2 bg-emerald-700 p-8 flex flex-col justify-center text-white min-h-[40vh] md:min-h-screen">
        <div className="max-w-md mx-auto w-full space-y-6">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-xl">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Portal HRIS Guru & Pengurus</h1>
            <p className="text-emerald-100 text-lg">Masuk untuk melihat absensi, menandatangani kontrak, dan memeriksa gaji (kafalah) Anda.</p>
          </div>
        </div>
      </div>
      
      <div className="md:w-1/2 p-8 flex flex-col justify-center min-h-[60vh] md:min-h-screen items-center bg-white">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Selamat Datang Kembali</h2>
            <p className="text-slate-500 mt-1">Silakan masuk menggunakan identitas yang terdaftar.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nomor Induk Pengurus (NIP)</label>
              <input 
                type="text" 
                required
                value={nip}
                onChange={e => setNip(e.target.value)}
                placeholder="Contoh: NIP-12345"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nomor WhatsApp Terdaftar</label>
              <input 
                type="text" 
                required
                value={wa}
                onChange={e => setWa(e.target.value)}
                placeholder="Contoh: 081234567890"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
              <p className="text-xs text-slate-500 mt-1.5">*Gunakan nomor WA yang biasa menerima notifikasi absensi</p>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 hover:shadow-lg transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Memeriksa data...</>
              ) : (
                <>Masuk ke Portal <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

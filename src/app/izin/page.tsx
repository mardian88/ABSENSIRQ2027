"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loginOrtu } from "./actions";
import { getPengaturanHalamanSukses } from "../pengaturan/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginIzinPage() {
  const [nis, setNis] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    getPengaturanHalamanSukses().then(res => setLogoUrl(res.urlLogo));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis.trim()) return toast.error("Masukkan NIS terlebih dahulu");
    
    setLoading(true);
    const res = await loginOrtu(nis);
    setLoading(false);
    
    if (res.success) {
      toast.success("Berhasil masuk");
      router.push("/izin/dashboard");
    } else {
      toast.error(res.message || "Gagal masuk");
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 flex flex-col justify-center px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mb-4 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <ShieldCheck className="w-8 h-8" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Portal Wali Santri</h1>
          <p className="text-sm text-slate-500 mt-2">Masuk menggunakan Nomor Induk Santri (NIS) untuk mengajukan izin ketidakhadiran</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Input 
              type="text" 
              placeholder="Masukkan NIS Santri" 
              value={nis}
              onChange={e => setNis(e.target.value)}
              className="h-14 text-center text-lg font-bold tracking-widest bg-white"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-base"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Masuk"}
            {!loading && <ArrowRight className="w-5 h-5 ml-2" />}
          </Button>
        </form>
      </div>
      
      <div className="p-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Sistem Absensi Rumah Qur'an
      </div>
    </div>
  );
}

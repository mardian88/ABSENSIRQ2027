"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Users } from "lucide-react";
import { loginOrtu } from "../actions";
import { showSuccess, showError } from "@/lib/sweetalert";

export function LoginOrtuClient() {
  const [nis, setNis] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis) return showError("Gagal", "NIS harus diisi.");
    
    setLoading(true);
    const res = await loginOrtu(nis);
    setLoading(false);

    if (res.success) {
      showSuccess("Login Berhasil", "Selamat datang di Portal Wali Santri.");
      router.push("/portal-ortu");
    } else {
      showError("Login Gagal", res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-emerald-700 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-800/30 pattern-dots" />
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm relative z-10">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold relative z-10">Portal Wali Santri</h1>
          <p className="text-emerald-100 text-sm mt-2 relative z-10">Mutabaah & Perizinan Terpadu</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">NIS Santri</label>
            <input 
              type="text" 
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              placeholder="Masukkan Nomor Induk Santri"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-center tracking-wider text-lg"
              required
            />
            <p className="text-xs text-slate-500 mt-2 text-center">Gunakan NIS anak Anda untuk mengakses portal ini.</p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? 'Mengecek data...' : <><LogIn className="w-5 h-5" /> Masuk Portal</>}
          </button>
        </form>
      </div>
    </div>
  );
}

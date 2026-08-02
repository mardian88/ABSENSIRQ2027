"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Save, ShieldCheck } from "lucide-react";

export default function PengaturanFonntePage() {
  const [token, setToken] = useState("");
  const [isAktif, setIsAktif] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("Pengaturan Fonnte berhasil disimpan (Simulasi)");
    }, 1000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Pengaturan Fonnte (WhatsApp)</h2>
        <p className="text-slate-500 text-sm mt-1">
          Hubungkan sistem dengan Fonnte API untuk mengirim notifikasi WhatsApp otomatis.
        </p>
      </div>

      <div className="space-y-5 bg-slate-50 p-6 rounded-xl border border-slate-200">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Fonnte API Token</label>
          <input 
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Masukkan Token Fonnte..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
          <p className="text-xs text-slate-500 mt-2">
            Dapatkan token di dashboard <a href="https://md.fonnte.com/" target="_blank" rel="noreferrer" className="text-emerald-600 hover:underline">md.fonnte.com</a>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            id="aktif"
            checked={isAktif}
            onChange={(e) => setIsAktif(e.target.checked)}
            className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
          />
          <label htmlFor="aktif" className="text-sm font-medium text-slate-700 cursor-pointer">
            Aktifkan Pengiriman Notifikasi Otomatis
          </label>
        </div>

        <div className="pt-4 border-t border-slate-200">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-bold transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Menyimpan..." : "Simpan Pengaturan"}
          </button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 text-blue-800">
        <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="text-sm leading-relaxed">
          Token Anda akan disimpan secara aman dan dienkripsi di dalam database.
        </div>
      </div>
    </div>
  );
}

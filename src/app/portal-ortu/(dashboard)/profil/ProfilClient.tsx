"use client";

import { User, LogOut, Phone, Shield } from "lucide-react";
import { logoutOrtu } from "../../actions";
import toast from "react-hot-toast";

export function ProfilClient({ profil, santriData }: any) {

  const handleLogout = async () => {
    try {
      await logoutOrtu();
      toast.success("Berhasil keluar");
      // Redirect happens in action
    } catch (err) {
      toast.error("Gagal keluar");
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-6 bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Profil Saya</h1>
        <div className="p-2 bg-emerald-100/50 rounded-full text-emerald-700">
          <User className="w-5 h-5" />
        </div>
      </header>

      <div className="px-6 mt-2 space-y-6">
        <div className="flex flex-col items-center mt-6">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center border-4 border-white shadow-md mb-4">
            {profil.urlFotoWajah ? (
              <img src={profil.urlFotoWajah} alt="Foto" className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-10 h-10 text-emerald-600" />
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-800">{profil.namaLengkap}</h2>
          <span className="text-sm text-slate-500 font-medium mt-1">Wali Santri</span>
        </div>

        <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Informasi Kontak</h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Nomor Kontak</div>
                <div className="font-medium text-slate-800">{profil.kontakOrtu || "-"}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Nama Ayah / Wali</div>
                <div className="font-medium text-slate-800">{santriData?.namaAyah || "-"}</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Nama Ibu</div>
                <div className="font-medium text-slate-800">{santriData?.namaIbu || "-"}</div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl p-4 flex items-center justify-center gap-2 transition-colors border border-red-100 mt-8 active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          Keluar dari Aplikasi
        </button>
      </div>
    </div>
  );
}

"use client";

import { User, LogOut, Phone, Shield, Camera, Trash2, Loader2 } from "lucide-react";
import { logoutOrtu, updateFotoProfil, resetFotoProfil } from "../../actions";
import toast from "react-hot-toast";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function ProfilClient({ profil, santriData }: any) {
  const [loadingPic, setLoadingPic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleLogout = async () => {
    const { showConfirm } = await import("@/lib/sweetalert");
    const isConfirmed = await showConfirm("Konfirmasi Keluar", "Apakah Anda yakin ingin keluar?", "Ya, Keluar");
    if(!isConfirmed) return;

    try {
      await logoutOrtu();
      toast.success("Berhasil keluar");
      window.location.href = "/portal-ortu/login";
    } catch (err) {
      toast.error("Gagal keluar");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingPic(true);
    const formData = new FormData();
    formData.append("fotoFile", file);
    
    try {
      const res = await updateFotoProfil(profil.id, formData);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat mengunggah foto.");
    } finally {
      setLoadingPic(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleResetPic = async () => {
    const { showConfirm } = await import("@/lib/sweetalert");
    const isConfirmed = await showConfirm("Hapus Foto", "Apakah Anda yakin ingin menghapus foto profil?", "Hapus");
    if (!isConfirmed) return;

    setLoadingPic(true);
    try {
      const res = await resetFotoProfil(profil.id);
      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("Terjadi kesalahan.");
    } finally {
      setLoadingPic(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-6 bg-slate-50">
      <header className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-slate-800">Profil Saya</h1>
        <div className="p-2 bg-emerald-100/50 rounded-full text-emerald-700">
          <User className="w-5 h-5" />
        </div>
      </header>

      <div className="px-6 mt-2 space-y-6">
        <div className="flex flex-col items-center mt-6">
          <div className="relative w-28 h-28 mb-4 group">
            <div className="w-full h-full bg-emerald-100 rounded-full flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
              {loadingPic ? (
                <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
              ) : profil.urlFotoWajah ? (
                <img src={profil.urlFotoWajah} alt="Foto" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-emerald-600" />
              )}
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={loadingPic}
              className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full shadow-lg hover:bg-emerald-700 transition active:scale-95 disabled:opacity-50"
            >
              <Camera className="w-4 h-4" />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              capture="user"
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </div>

          <div className="flex gap-2">
            {profil.urlFotoWajah && (
              <button 
                onClick={handleResetPic}
                disabled={loadingPic}
                className="text-xs text-rose-500 font-medium flex items-center gap-1 hover:text-rose-600 bg-rose-50 px-3 py-1.5 rounded-full mb-2 disabled:opacity-50"
              >
                <Trash2 className="w-3 h-3" /> Hapus Foto
              </button>
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

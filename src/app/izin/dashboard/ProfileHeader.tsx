"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, Loader2, RotateCcw } from "lucide-react";
import { updateFotoProfil, resetFotoProfil } from "../actions";
import toast from "react-hot-toast";

export function ProfileHeader({ santri }: { santri: any }) {
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(santri.urlFotoWajah);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit for profile picture
      toast.error("Ukuran foto maksimal 5MB");
      e.target.value = "";
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("fotoFile", file);

    const res = await updateFotoProfil(santri.id, formData);
    if (res.success && res.url) {
      setLocalUrl(res.url);
      toast.success(res.message);
    } else {
      toast.error(res.message || "Gagal mengunggah foto");
    }
    
    setLoading(false);
    e.target.value = ""; // reset input
  };

  const handleReset = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus foto profil ini?")) return;
    
    setResetting(true);
    const res = await resetFotoProfil(santri.id);
    if (res.success) {
      setLocalUrl(null);
      toast.success(res.message);
    } else {
      toast.error(res.message);
    }
    setResetting(false);
  };

  return (
    <div className="bg-emerald-600 text-white p-6 rounded-b-3xl shadow-md">
      <div className="flex justify-between items-start mb-6">
        <h1 className="text-xl font-bold">Perizinan</h1>
        {localUrl && (
          <button 
            onClick={handleReset}
            disabled={resetting || loading}
            className="flex items-center text-xs bg-emerald-700 hover:bg-emerald-800 px-3 py-1.5 rounded-full transition-colors disabled:opacity-50"
            title="Hapus foto profil"
          >
            {resetting ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RotateCcw className="w-3 h-3 mr-1" />}
            Reset Foto
          </button>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <label className="relative w-16 h-16 bg-emerald-100 rounded-full flex flex-col items-center justify-center overflow-hidden border-2 border-white cursor-pointer group flex-shrink-0">
          {loading ? (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-20">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <Camera className="w-5 h-5 text-white" />
            </div>
          )}
          
          {localUrl ? (
            <Image src={localUrl} alt={santri.namaLengkap} width={64} height={64} className="object-cover w-full h-full z-10" />
          ) : (
            <span className="text-emerald-600 font-bold text-2xl z-10">{santri.namaLengkap.charAt(0)}</span>
          )}
          
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={loading} />
        </label>
        
        <div className="overflow-hidden">
          <h2 className="text-lg font-bold truncate">{santri.namaLengkap}</h2>
          <p className="text-emerald-100 text-sm opacity-90 truncate">NIS: {santri.nomorInduk}</p>
        </div>
      </div>
    </div>
  );
}

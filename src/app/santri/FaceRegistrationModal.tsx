"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, CheckCircle2, X } from "lucide-react";
import { registerFace } from "./actions";

export function FaceRegistrationModal({ 
  santri, 
  onClose 
}: { 
  santri: { id: string; namaLengkap: string } | null; 
  onClose: () => void; 
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  useEffect(() => {
    if (santri) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [santri]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      setCameraError("Tidak dapat mengakses kamera. Pastikan izin diberikan.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  const handleRegister = async () => {
    setIsSimulating(true);
    // Simulasi proses ekstraksi vektor oleh face-api.js (butuh 2 detik)
    setTimeout(async () => {
      // Mock vector data
      const mockVector = JSON.stringify(Array.from({ length: 128 }, () => Math.random() * 2 - 1));
      await registerFace(santri!.id, mockVector);
      setIsSimulating(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }, 2000);
  };

  if (!santri) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full hover:bg-slate-700 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Daftarkan Wajah</h2>
          <p className="text-slate-400">Arahkan wajah <span className="text-emerald-400 font-semibold">{santri.namaLengkap}</span> ke kamera.</p>
        </div>

        <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden mb-6 border-4 border-slate-800 shadow-inner flex items-center justify-center">
          {success ? (
            <div className="flex flex-col items-center justify-center text-emerald-400 animate-in fade-in zoom-in">
              <CheckCircle2 className="w-24 h-24 mb-4" />
              <p className="text-xl font-bold">Wajah Berhasil Disimpan!</p>
            </div>
          ) : cameraError ? (
            <div className="flex flex-col items-center justify-center text-rose-400 p-6 text-center">
              <Camera className="w-16 h-16 mb-4 opacity-50" />
              <p className="font-medium">{cameraError}</p>
            </div>
          ) : (
            <>
              <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              
              {/* Face Guide Overlay */}
              <div className="absolute inset-0 border-[6px] border-emerald-500/50 rounded-full m-8 pointer-events-none">
                <div className="absolute inset-0 border-4 border-dashed border-emerald-500 rounded-full animate-[spin_10s_linear_infinite] opacity-30"></div>
              </div>

              {isSimulating && (
                <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center z-10 backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-500 mb-4"></div>
                  <p className="text-emerald-400 font-semibold">Mengekstrak fitur wajah...</p>
                </div>
              )}
            </>
          )}
        </div>

        {!success && !cameraError && (
          <button 
            onClick={handleRegister}
            disabled={isSimulating}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-500 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSimulating ? "Memproses..." : "Simpan Data Wajah"}
          </button>
        )}
      </div>
    </div>
  );
}

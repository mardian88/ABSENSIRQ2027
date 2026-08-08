"use client";

import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { Camera, X, CheckCircle, Loader2 } from "lucide-react";
import { updateGuruFaceData } from "./actions";

interface RegisterWajahGuruModalProps {
  isOpen: boolean;
  onClose: () => void;
  guru: { id: string; namaLengkap: string } | null;
}

export function RegisterWajahGuruModal({ isOpen, onClose, guru }: RegisterWajahGuruModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<Float32Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load Models
  useEffect(() => {
    if (isOpen) {
      const loadModels = async () => {
        try {
          const MODEL_URL = '/models';
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
            faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
          ]);
          setIsModelLoaded(true);
        } catch (err) {
          console.error("Gagal memuat model:", err);
          setCameraError("Gagal memuat model pendeteksi wajah. Pastikan file model tersedia.");
        }
      };
      
      loadModels();
    } else {
      stopCamera();
      setFaceDescriptor(null);
      setMessage(null);
    }
  }, [isOpen]);

  // Start Camera after models are loaded
  useEffect(() => {
    if (isOpen && isModelLoaded) {
      startCamera();
    }
    return () => stopCamera();
  }, [isOpen, isModelLoaded]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setCameraError("Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Video Playing handler to detect face
  const handleVideoPlay = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Sesuaikan ukuran canvas dengan video
    const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
    faceapi.matchDimensions(canvas, displaySize);

    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        return;
      }

      const detection = await faceapi.detectSingleFace(
        video, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks().withFaceDescriptor();

      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (detection) {
        // Gambar kotak dan landmarks
        const resizedDetections = faceapi.resizeResults(detection, displaySize);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

        // Simpan descriptor terbaru
        setFaceDescriptor(detection.descriptor);
      } else {
        setFaceDescriptor(null);
      }
    }, 500);

    return () => clearInterval(interval);
  };

  const handleSimpan = async () => {
    if (!guru || !faceDescriptor) return;
    
    setIsProcessing(true);
    setMessage(null);
    
    try {
      // Ubah Float32Array menjadi array biasa lalu stringify
      const vektorArray = Array.from(faceDescriptor);
      const dataVektor = JSON.stringify(vektorArray);
      
      const res = await updateGuruFaceData(guru.id, dataVektor);
      
      if (res.success) {
        setMessage({ type: 'success', text: res.message });
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: res.message });
      }
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || "Gagal menyimpan data" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-400" />
            Daftarkan Wajah
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <h2 className="text-lg font-bold text-slate-800">Daftarkan Wajah Guru</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">Sistem akan mengambil data biometrik untuk {guru?.namaLengkap}. Pastikan pencahayaan cukup dan wajah terlihat jelas dalam bingkai biru.</p>

          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner flex flex-col items-center justify-center">
            {!isModelLoaded ? (
              <div className="flex flex-col items-center justify-center text-slate-400 p-8">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                <p>Memuat AI Model Wajah...</p>
                <p className="text-xs mt-2 text-slate-500 text-center">Proses ini memakan waktu beberapa detik pada muat pertama.</p>
              </div>
            ) : cameraError ? (
              <div className="text-amber-400 p-6 text-center text-sm">
                <p>{cameraError}</p>
              </div>
            ) : (
              <>
                <video 
                  ref={videoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  onPlay={handleVideoPlay}
                  onLoadedMetadata={(e) => {
                    if (videoRef.current && canvasRef.current) {
                      canvasRef.current.width = videoRef.current.videoWidth;
                      canvasRef.current.height = videoRef.current.videoHeight;
                    }
                  }}
                  className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" 
                />
                <canvas 
                  ref={canvasRef} 
                  className="absolute inset-0 w-full h-full object-cover transform -scale-x-100 pointer-events-none" 
                />
                
                {/* Panduan UI Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                   <div className={`w-48 h-48 sm:w-64 sm:h-64 border-2 rounded-full transition-colors duration-300 ${faceDescriptor ? 'border-emerald-500 bg-emerald-500/10' : 'border-blue-500/50 bg-transparent'} border-dashed`}></div>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-col items-center text-center">
            {faceDescriptor ? (
              <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in zoom-in">
                <CheckCircle className="w-4 h-4" /> Wajah terdeteksi dan siap didaftarkan
              </div>
            ) : isModelLoaded && !cameraError ? (
              <div className="bg-amber-500/10 text-amber-400 px-4 py-2 rounded-lg text-sm font-medium animate-pulse">
                Mencari wajah di kamera...
              </div>
            ) : null}
            
            {message && (
              <div className={`mt-4 w-full p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {message.text}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-900/80 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Batal
          </button>
          <button 
            type="button"
            onClick={handleSimpan}
            disabled={!faceDescriptor || isProcessing}
            className={`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-2 shadow-lg
              ${!faceDescriptor || isProcessing ? 'bg-blue-600/50 cursor-not-allowed text-white/50 shadow-none' : 'bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5'}`}
          >
            {isProcessing ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</> : "Simpan Wajah Ini"}
          </button>
        </div>
      </div>
    </div>
  );
}

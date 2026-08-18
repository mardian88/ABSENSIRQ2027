"use client";

import { useEffect, useRef, useState } from "react";
import type { Human, Config } from "@vladmandic/human";

const humanConfig: Partial<Config> = {
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
  face: {
    enabled: true,
    detector: { return: true, rotation: true, maxDetected: 1, iouThreshold: 0.1, minConfidence: 0.5 },
    mesh: { enabled: true },
    iris: { enabled: false },
    description: { enabled: true },
    emotion: { enabled: false },
    antispoof: { enabled: false },
    liveness: { enabled: false },
  },
  body: { enabled: false },
  hand: { enabled: false },
  object: { enabled: false },
  gesture: { enabled: false },
  filter: { enabled: false }
};

let humanInstance: Human | null = null;
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
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [captureProgress, setCaptureProgress] = useState<number>(0);
  const [isCapturingSamples, setIsCapturingSamples] = useState(false);
  const samplesRef = useRef<number[][]>([]);
  const lastCaptureTimeRef = useRef<number>(0);
  const requestRef = useRef<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // Load Models
  useEffect(() => {
    if (isOpen) {
      const loadModels = async () => {
        try {
          if (!humanInstance) {
            const humanModule = await import("@vladmandic/human");
            humanInstance = new humanModule.Human(humanConfig);
            await humanInstance.load();
          }
          setIsModelLoaded(true);
        } catch (err) {
          console.error("Gagal memuat model:", err);
          setCameraError("Gagal memuat model pendeteksi wajah. Pastikan koneksi internet stabil.");
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
  }, [isOpen, isModelLoaded, facingMode]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => {
          if (e.name !== 'AbortError') console.error('Video play error:', e);
        });
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
    if (!videoRef.current || !canvasRef.current || !humanInstance) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const detectLoop = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        requestRef.current = requestAnimationFrame(detectLoop);
        return;
      }

      try {
        const result = await humanInstance!.detect(video);

        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (result.face && result.face.length > 0) {
          const face = result.face[0];

          // Gambar kotak
          if (context && face.box) {
            context.strokeStyle = '#10b981';
            context.lineWidth = 4;
            let drawX = face.box[0];
            if (facingMode === 'user') {
              drawX = canvas.width - face.box[0] - face.box[2];
            }
            context.strokeRect(drawX, face.box[1], face.box[2], face.box[3]);
            if (face.mesh) {
              context.fillStyle = 'rgba(16, 185, 129, 0.4)';
              for (let i = 0; i < face.mesh.length; i++) {
                let px = face.mesh[i][0];
                if (facingMode === 'user') px = canvas.width - px;
                context.beginPath();
                context.arc(px, face.mesh[i][1], 1.5, 0, 2 * Math.PI);
                context.fill();
              }
            }
          }

          if (face.embedding) {
            setFaceDescriptor(Array.from(face.embedding));
          } else {
            setFaceDescriptor(null);
          }
        } else {
          setFaceDescriptor(null);
        }
      } catch (e) {
        // Abaikan error deteksi sementara
      } finally {
        requestRef.current = requestAnimationFrame(detectLoop);
      }
    };

    detectLoop();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  };

  const saveMultiAngleData = async (samples: number[][]) => {
    try {
      const dataVektor = JSON.stringify(samples);
      const res = await updateGuruFaceData(guru!.id, dataVektor);
      
      if (res.success) {
        setMessage({ type: 'success', text: res.message || "Berhasil merekam sampel wajah" });
        setTimeout(() => {
          onClose();
          setCaptureProgress(0);
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

  const saveMultiAngleData = async (samples: number[][]) => {
    setIsProcessing(true);
    try {
      const dataVektor = JSON.stringify(samples);
      const res = await updateGuruFaceData(guru!.id, dataVektor);
      
      if (res.success) {
        setMessage({ type: 'success', text: res.message || "Berhasil merekam sampel wajah" });
        setTimeout(() => {
          onClose();
          setCaptureProgress(0);
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

  const handleSimpan = async () => {
    if (!guru || !faceDescriptor) return;
    setMessage(null);
    
    samplesRef.current = [];
    lastCaptureTimeRef.current = performance.now();
    setIsCapturingSamples(true);
    setCaptureProgress(0);
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
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFacingMode(prev => prev === "user" ? "environment" : "user")} 
              className="px-3 py-1.5 flex items-center gap-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
              title="Balik Kamera"
            >
              Tukar
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <h2 className="text-lg font-bold text-slate-800">Daftarkan Wajah Guru</h2>
          <p className="text-sm text-slate-500 mt-1 mb-4">Sistem akan mengambil data biometrik untuk {guru?.namaLengkap}. Pastikan pencahayaan cukup dan wajah terlihat jelas dalam bingkai biru.</p>

          <div className="relative w-full aspect-square sm:aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner flex flex-col items-center justify-center">
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
                  muted 
                  playsInline 
                  onPlay={handleVideoPlay}
                  onLoadedMetadata={(e) => {
                    if (videoRef.current && canvasRef.current) {
                      canvasRef.current.width = videoRef.current.videoWidth;
                      canvasRef.current.height = videoRef.current.videoHeight;
                    }
                  }}
                  className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "transform -scale-x-100" : ""}`} 
                />
                <canvas 
                  ref={canvasRef} 
                  className={`absolute inset-0 w-full h-full object-cover pointer-events-none`} 
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

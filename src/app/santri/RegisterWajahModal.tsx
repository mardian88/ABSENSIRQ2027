"use client";

import { useEffect, useRef, useState } from "react";
import type { Human, Config } from "@vladmandic/human";
import { Camera, X, CheckCircle, Loader2, Search, FlipHorizontal } from "lucide-react";
import { simpanVektorWajah } from "./actions";

interface RegisterWajahModalProps {
  isOpen: boolean;
  onClose: () => void;
  santri: { id: string; namaLengkap: string; nomorInduk?: string } | null;
  santriList?: { id: string; namaLengkap: string; nomorInduk?: string }[];
}

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

export function RegisterWajahModal({ isOpen, onClose, santri, santriList = [] }: RegisterWajahModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [captureProgress, setCaptureProgress] = useState<number>(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const samplesRef = useRef<number[][]>([]);
  const isCapturingRef = useRef(false);
  const activeSantriIdRef = useRef<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  // Selection state
  const [activeSantriId, setActiveSantriId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Keep ref in sync with state
  useEffect(() => { activeSantriIdRef.current = activeSantriId; }, [activeSantriId]);

  useEffect(() => {
    if (isOpen && santri) {
      setActiveSantriId(santri.id);
    }
  }, [isOpen, santri]);

  const activeSantriObj = santriList.find(s => s.id === activeSantriId) || santri;

  const filteredSantriList = santriList.filter(s => 
    s.namaLengkap.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.nomorInduk && s.nomorInduk.includes(searchQuery))
  ).slice(0, 50);

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
          setCameraError("Gagal memuat model pendeteksi wajah. Pastikan koneksi internet stabil untuk unduh model pertama kali.");
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
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  // Save multi-angle data
  const doSaveMultiAngle = async (samples: number[][]) => {
    setIsProcessing(true);
    try {
      const dataVektor = JSON.stringify(samples);
      const res = await simpanVektorWajah(activeSantriIdRef.current!, dataVektor);
      
      if (res.success) {
        setMessage({ type: 'success', text: `Berhasil merekam ${samples.length} angle wajah!` });
        setTimeout(() => {
          setActiveSantriId(null);
          setFaceDescriptor(null);
          setSearchQuery("");
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

  const CAPTURE_STEPS = [
    "1. Tahan, menghadap LURUS ke depan...",
    "2. Tolehkan wajah sedikit ke KIRI...",
    "3. Tolehkan wajah sedikit ke KANAN...",
    "4. Tundukkan wajah sedikit ke BAWAH...",
    "5. Dongakkan wajah sedikit ke ATAS..."
  ];

  // Video Playing handler to detect face
  const handleVideoPlay = async () => {
    if (!videoRef.current || !canvasRef.current || !humanInstance) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const detectFrame = async () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;

      const result = await humanInstance!.detect(video);
      
      const context = canvas.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }

      if (result.face && result.face.length > 0) {
        const face = result.face[0];
        
        if (context && face.box) {
          context.strokeStyle = '#3b82f6';
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

        if (face.embedding && activeSantriIdRef.current) {
          setFaceDescriptor(Array.from(face.embedding));
        }
      } else {
        setFaceDescriptor(null);
      }
      
      requestRef.current = requestAnimationFrame(detectFrame);
    };
    
    detectFrame();
  };

  const handleAmbilSampel = () => {
    if (!activeSantriId || !faceDescriptor) return;
    setMessage(null);

    samplesRef.current.push([...faceDescriptor]);
    const count = samplesRef.current.length;
    setCaptureProgress(count);

    if (count >= 5) {
      setIsProcessing(true);
      const collectedSamples = [...samplesRef.current];
      doSaveMultiAngle(collectedSamples);
    }
  };

  const handleReset = () => {
    samplesRef.current = [];
    setCaptureProgress(0);
    setMessage(null);
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
              onClick={toggleCamera} 
              className="px-3 py-1.5 flex items-center gap-1.5 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-sm font-medium transition-colors"
              title="Balik Kamera (Depan/Belakang)"
            >
              <FlipHorizontal className="w-4 h-4" />
              Tukar
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Form Pencarian Santri */}
          <div className="mb-5 relative">
            <label className="block text-sm font-medium text-slate-300 mb-2">Pilih Santri yang Direkam:</label>
            <div className="relative">
              {activeSantriId && activeSantriObj ? (
                <div className="flex items-center justify-between bg-slate-800 border border-emerald-500/50 p-3 rounded-xl shadow-inner">
                  <div>
                    <div className="font-semibold text-emerald-400">{activeSantriObj.namaLengkap}</div>
                    {activeSantriObj.nomorInduk && <div className="text-xs text-slate-400">NIS: {activeSantriObj.nomorInduk}</div>}
                  </div>
                  <button 
                    onClick={() => {
                      setActiveSantriId(null);
                      setFaceDescriptor(null);
                      setSearchQuery("");
                      handleReset();
                    }} 
                    className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Ketik nama / NIS santri..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setIsDropdownOpen(true);
                      }}
                      onFocus={() => setIsDropdownOpen(true)}
                      className="w-full pl-9 pr-4 py-3 bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {isDropdownOpen && searchQuery.length > 0 && (
                    <div className="absolute z-[110] left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl max-h-60 overflow-y-auto shadow-2xl">
                      {filteredSantriList.length === 0 ? (
                        <div className="p-4 text-center text-slate-400 text-sm">Tidak ditemukan.</div>
                      ) : (
                        filteredSantriList.map((s) => (
                          <div 
                            key={s.id} 
                            onClick={() => {
                              setActiveSantriId(s.id);
                              setIsDropdownOpen(false);
                            }}
                            className="p-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0"
                          >
                            <div className="font-medium text-white">{s.namaLengkap}</div>
                            {s.nomorInduk && <div className="text-xs text-slate-400">NIS: {s.nomorInduk}</div>}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Tutup Dropdown kalau klik di luar area */}
            {isDropdownOpen && (
              <div 
                className="fixed inset-0 z-[105]" 
                onClick={() => setIsDropdownOpen(false)}
              ></div>
            )}
          </div>

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
                   <div className={`w-48 h-48 sm:w-64 sm:h-64 border-2 rounded-full transition-colors duration-300 ${faceDescriptor && activeSantriId ? 'border-emerald-500 bg-emerald-500/10' : 'border-blue-500/50 bg-transparent'} border-dashed`}></div>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-col items-center text-center">
            {activeSantriId && captureProgress < 5 ? (
              <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-6 py-4 rounded-xl text-lg font-bold shadow-lg flex flex-col items-center gap-3 w-full">
                <div className="flex items-center gap-3">
                  Progress: {captureProgress}/5 Sampel
                </div>
                <div className="text-xl text-white tracking-wide">
                  {CAPTURE_STEPS[Math.min(captureProgress, 4)]}
                </div>
              </div>
            ) : captureProgress >= 5 ? (
              <div className="bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 animate-in fade-in zoom-in">
                <CheckCircle className="w-4 h-4" /> Selesai merekam 5 angle!
              </div>
            ) : (
              <div className="bg-slate-800 text-slate-400 px-4 py-2 rounded-lg text-sm font-medium">
                Pilih santri terlebih dahulu untuk merekam
              </div>
            )}
            
            {message && (
              <div className={`mt-4 w-full p-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {message.text}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-900/80 flex flex-col gap-2">
          <div className="flex justify-between items-center w-full">
            {captureProgress > 0 && captureProgress < 5 ? (
              <button 
                type="button"
                onClick={handleReset}
                className="text-slate-400 hover:text-rose-400 text-sm font-medium transition-colors underline"
              >
                Ulangi
              </button>
            ) : <div />}
            
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Tutup
              </button>
              <button 
                type="button"
                onClick={handleAmbilSampel}
                disabled={!faceDescriptor || !activeSantriId || isProcessing || captureProgress >= 5}
                className={`px-5 py-2.5 text-sm font-semibold text-white rounded-lg transition-all flex items-center gap-2 shadow-lg
                  ${!faceDescriptor || !activeSantriId || isProcessing || captureProgress >= 5 ? 'bg-blue-600/50 cursor-not-allowed text-white/50 shadow-none' : 'bg-blue-600 hover:bg-blue-500 hover:-translate-y-0.5'}`}
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : (
                  `Ambil Sampel ${captureProgress + 1}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

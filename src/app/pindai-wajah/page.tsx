"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CheckCircle2, ArrowLeft, CheckCircle, XCircle, Loader2, RefreshCcw, Flashlight } from "lucide-react";
import Link from "next/link";
import { recordAbsensiById } from "../absensi/actions";
import { getFaces } from "./actions";
import { useRouter } from "next/navigation";
import { formatTimeID } from "@/lib/date";
import { getAudioSettings } from "@/app/pengaturan/actions";
import { showError } from "@/lib/sweetalert";
import { KioskNav } from "@/components/KioskNav";
import type { Human, Config } from "@vladmandic/human";
import { RegisterWajahModal } from "../santri/RegisterWajahModal";

const humanConfig: Partial<Config> = {
  modelBasePath: 'https://cdn.jsdelivr.net/npm/@vladmandic/human/models/',
  face: {
    enabled: true,
    detector: { return: true, rotation: true, maxDetected: 1, iouThreshold: 0.1, minConfidence: 0.6 },
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

// --- Konfigurasi Akurasi ---
const SIMILARITY_THRESHOLD = 0.74;       // Minimum similarity untuk dianggap cocok (dinaikkan dari 0.55 agar tidak salah orang)
const MIN_GAP_TO_SECOND = 0.15;          // Minimal selisih antara best match dan second best (dinaikkan dari 0.08)
const REQUIRED_CONSECUTIVE_FRAMES = 5;   // Jumlah frame berturut-turut harus cocok orang yang sama (dinaikkan dari 3)
const MIN_FACE_SIZE = 80;                // Minimum ukuran wajah (pixel) agar bisa diproses
const SCAN_COOLDOWN_MS = 5000;           // Jeda antar scan untuk orang yang sama

let humanInstance: Human | null = null;
let registeredFaces: { id: string; nama: string; embedding: number[] }[] = [];


export default function PindaiWajah() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [hasFaceData, setHasFaceData] = useState(false);
  
  const [scanResult, setScanResult] = useState<{ nama: string; waktu: string; jenis: string } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [jenisAbsen, setJenisAbsenState] = useState<"masuk" | "pulang">("masuk");
  const jenisAbsenRef = useRef<"masuk" | "pulang">("masuk");

  const setJenisAbsen = (val: "masuk" | "pulang") => {
    setJenisAbsenState(val);
    jenisAbsenRef.current = val;
  };

  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("user");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioConfig, setAudioConfig] = useState<any>(null);

  // Multi-frame verification buffer
  const consecutiveMatchId = useRef<string | null>(null);
  const consecutiveMatchCount = useRef<number>(0);

  const playAudioResult = (success: boolean, jenis: string) => {
    if (!audioConfig) {
      // Fallback: mainkan audio default lokal
      if (success) new Audio('/notif/berhasil.wav').play().catch(() => {});
      else new Audio('/notif/gagal.wav').play().catch(() => {});
      return;
    }
    try {
      if (success) {
        if (jenis === 'masuk' && audioConfig.isAudioMasukAktif && audioConfig.urlAudioMasuk) {
          new Audio(audioConfig.urlAudioMasuk).play().catch(() => {});
        } else if (jenis === 'pulang' && audioConfig.isAudioPulangAktif && audioConfig.urlAudioPulang) {
          new Audio(audioConfig.urlAudioPulang).play().catch(() => {});
        } else if ((jenis === 'masuk' && audioConfig.isAudioMasukAktif) || (jenis === 'pulang' && audioConfig.isAudioPulangAktif)) {
          new Audio('/notif/berhasil.wav').play().catch(() => {});
        }
      } else {
        if (audioConfig.isAudioGagalAktif && audioConfig.urlAudioGagal) {
          new Audio(audioConfig.urlAudioGagal).play().catch(() => {});
        } else if (audioConfig.isAudioGagalAktif) {
          new Audio('/notif/gagal.wav').play().catch(() => {});
        }
      }
    } catch (e) {}
  };

  useEffect(() => { getAudioSettings().then(setAudioConfig); }, []);

  // Buffer untuk debounce scan per orang (jangan sampai 1 wajah kescan 10x per detik)
  const lastScannedId = useRef<string | null>(null);
  const lastScannedTime = useRef<number>(0);

  // Dapatkan daftar kamera (sekadar info)
  useEffect(() => {
    navigator.mediaDevices.enumerateDevices()
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setCameras(videoDevices);
      })
      .catch(err => console.error("Gagal mendapatkan daftar kamera", err));
  }, []);

  // Muat model dan data wajah santri
  useEffect(() => {
    let isMounted = true;
    const initializeApp = async () => {
      try {
        if (!humanInstance) {
          const humanModule = await import("@vladmandic/human");
          humanInstance = new humanModule.Human(humanConfig);
          await humanInstance.load();
        }

        const dataSantri = await getFaces();
        
        registeredFaces = dataSantri.flatMap((santri: any) => {
            try {
              const arr = JSON.parse(santri.dataVektorWajah);
              // Handle new Multi-Angle format (array of arrays)
              if (Array.isArray(arr) && arr.length > 0 && Array.isArray(arr[0])) {
                return arr.map((vector: number[]) => ({ id: santri.id, nama: santri.namaLengkap, embedding: vector }));
              }
              // Handle old Single format (array of numbers)
              return [{ id: santri.id, nama: santri.namaLengkap, embedding: arr }];
            } catch (e) {
              console.error("Gagal memproses data wajah untuk santri", santri.id);
              return [];
            }
          });

        if (isMounted) {
          if (registeredFaces.length > 0) {
            setHasFaceData(true);
          }
          setIsModelLoaded(true);
        }
      } catch (err) {
        console.error("Gagal inisialisasi model:", err);
        if (isMounted) setCameraError("Gagal memuat sistem pendeteksi wajah. Pastikan model tersedia.");
      }
    };
    
    initializeApp();
    return () => { isMounted = false; };
  }, []);

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [santriListForRegistration, setSantriListForRegistration] = useState<any[]>([]);

  useEffect(() => {
    import("./actions").then(actions => {
      actions.getAllActiveForRegistration().then(list => setSantriListForRegistration(list));
    });
  }, []);

  // Mulai kamera saat model siap atau arah kamera diganti
  useEffect(() => {
    if (isModelLoaded && !isRegisterModalOpen) {
      setTimeout(() => startVideo(), 600);
    } else if (isRegisterModalOpen) {
      // CLEANUP CAMERA IF MODAL OPEN
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    }
    
    // CLEANUP CAMERA ON UNMOUNT OR CHANGE
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream && typeof stream.getTracks === 'function') {
           stream.getTracks().forEach((track) => track.stop());
        }
      }
    };
  }, [facingMode, isModelLoaded, isRegisterModalOpen]);

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const toggleTorch = async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        const track = stream.getVideoTracks()[0];
        if (track) {
          // @ts-ignore
          await track.applyConstraints({ advanced: [{ torch: !isTorchOn }] });
          setIsTorchOn(!isTorchOn);
        }
      } catch (err) {
        console.error("Gagal menyalakan senter", err);
        showError("Gagal", "Senter tidak didukung pada perangkat/kamera ini.");
      }
    }
  };

  const startVideo = async () => {
    setCameraError(null);
    setIsTorchOn(false);
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    const constraints: MediaStreamConstraints = {
      video: { facingMode: facingMode, frameRate: { ideal: 30 } }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => {
          if (e.name !== 'AbortError') console.error('Video play error:', e);
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError("Akses kamera ditolak. Harap izinkan di peramban.");
      } else {
        setCameraError("Kamera tidak ditemukan atau sedang digunakan.");
      }
    }
  };

  const handleVideoPlay = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !humanInstance || isProcessing) return;

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

          // --- Validasi kualitas wajah ---
          const faceWidth = face.box ? face.box[2] : 0;
          const faceHeight = face.box ? face.box[3] : 0;
          const faceScore = face.score || 0;

          if (faceWidth < MIN_FACE_SIZE || faceHeight < MIN_FACE_SIZE) {
            // Wajah terlalu kecil, skip matching tapi tetap gambar box
            if (context && face.box) {
              context.strokeStyle = '#94a3b8';
              context.lineWidth = 2;
              let drawX = face.box[0];
              if (facingMode === 'user') drawX = canvas.width - face.box[0] - face.box[2];
              context.strokeRect(drawX, face.box[1], face.box[2], face.box[3]);
            if (face.mesh) {
              context.fillStyle = '#94a3b8';
              for (let i = 0; i < face.mesh.length; i++) {
                let px = face.mesh[i][0];
                if (facingMode === 'user') px = canvas.width - px;
                context.beginPath();
                context.arc(px, face.mesh[i][1], 1.5, 0, 2 * Math.PI);
                context.fill();
              }
            }
              context.fillStyle = '#94a3b8';
              context.font = "bold 16px Arial";
              context.fillText("Dekatkan wajah...", drawX, face.box[1] > 20 ? face.box[1] - 10 : 20);
            }
            // Reset consecutive counter karena wajah tidak valid
            consecutiveMatchId.current = null;
            consecutiveMatchCount.current = 0;
            requestRef.current = requestAnimationFrame(detectLoop);
            return;
          }

          // --- Cari kecocokan terbaik dan kedua terbaik ---
          let bestMatch = { id: '', nama: 'Tidak Dikenal', similarity: 0 };
          let secondBest = { id: '', nama: '', similarity: 0 };
          
          if (face.embedding && registeredFaces.length > 0) {
            for (const reg of registeredFaces) {
              const sim = humanInstance!.match.similarity(face.embedding, reg.embedding);
              if (sim > bestMatch.similarity) {
                secondBest = { ...bestMatch };
                bestMatch = { id: reg.id, nama: reg.nama, similarity: sim };
              } else if (sim > secondBest.similarity) {
                secondBest = { id: reg.id, nama: reg.nama, similarity: sim };
              }
            }
          }

          // --- Kriteria kecocokan yang lebih ketat ---
          const gap = bestMatch.similarity - secondBest.similarity;
          const isMatch = bestMatch.similarity > SIMILARITY_THRESHOLD && gap > MIN_GAP_TO_SECOND;

          // Draw custom bounding box
          if (context && face.box) {
            context.strokeStyle = isMatch ? '#10b981' : '#f43f5e';
            context.lineWidth = 4;
            
            let drawX = face.box[0];
            if (facingMode === 'user') {
               drawX = canvas.width - face.box[0] - face.box[2];
            }
            
            context.strokeRect(drawX, face.box[1], face.box[2], face.box[3]);
            if (face.mesh) {
              context.fillStyle = isMatch ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)';
              for (let i = 0; i < face.mesh.length; i++) {
                let px = face.mesh[i][0];
                if (facingMode === 'user') px = canvas.width - px;
                context.beginPath();
                context.arc(px, face.mesh[i][1], 1.5, 0, 2 * Math.PI);
                context.fill();
              }
            }
            
            context.fillStyle = isMatch ? '#10b981' : '#f43f5e';
            context.font = "bold 20px Arial";
            context.fillText(
              isMatch ? `${bestMatch.nama} (${Math.round(bestMatch.similarity * 100)}%)` : "Tidak Dikenal", 
              drawX, 
              face.box[1] > 20 ? face.box[1] - 10 : 20
            );
          }

          if (isMatch) {
            // --- Multi-frame verification ---
            if (consecutiveMatchId.current === bestMatch.id) {
              consecutiveMatchCount.current++;
            } else {
              // Orang berbeda dari frame sebelumnya, reset counter
              consecutiveMatchId.current = bestMatch.id;
              consecutiveMatchCount.current = 1;
            }

            // Hanya proses jika sudah melewati REQUIRED_CONSECUTIVE_FRAMES
            if (consecutiveMatchCount.current >= REQUIRED_CONSECUTIVE_FRAMES) {
              const now = Date.now();
              if (lastScannedId.current === bestMatch.id && (now - lastScannedTime.current) < SCAN_COOLDOWN_MS) {
                // skip (sudah baru saja di-scan)
              } else if (!isProcessing) {
                consecutiveMatchCount.current = 0; // Reset setelah proses
                processAttendance(bestMatch.id, bestMatch.nama);
              }
            }
          } else {
            // Tidak cocok, reset consecutive counter
            consecutiveMatchId.current = null;
            consecutiveMatchCount.current = 0;
          }
        } else {
          // Tidak ada wajah terdeteksi, reset counter
          consecutiveMatchId.current = null;
          consecutiveMatchCount.current = 0;
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
  }, [hasFaceData, isProcessing, jenisAbsen, facingMode]);

  const processAttendance = async (id: string, nama: string) => {
    setIsProcessing(true);
    lastScannedId.current = id;
    lastScannedTime.current = Date.now();
    
    const currentJenis = jenisAbsenRef.current;
    
    try {
      const res = await recordAbsensiById(id, currentJenis, 'wajah', 'hadir');
      if (res.success) {
        playAudioResult(true, currentJenis);
        setScanResult({
          nama: nama,
          waktu: res.data?.waktu || formatTimeID(new Date()),
          jenis: currentJenis
        });
      } else {
        playAudioResult(false, currentJenis);
        setScanResult({
          nama: res.message || "Gagal Absen",
          waktu: formatTimeID(new Date()),
          jenis: "error"
        });
      }
    } catch (e: any) {
      playAudioResult(false, currentJenis);
      setScanResult({
        nama: "Gagal Sistem",
        waktu: formatTimeID(new Date()),
        jenis: "error"
      });
    } finally {
      setTimeout(() => {
        setScanResult(null);
        setIsProcessing(false);
      }, 1200); // Dipercepat menjadi 1.2 detik
    }
  };


  return (
    <div className="p-4 md:p-8 min-h-screen flex flex-col items-center justify-center bg-slate-900 relative overflow-hidden">
      <KioskNav onRekamWajah={() => setIsRegisterModalOpen(true)} />

      {isRegisterModalOpen && (
        <RegisterWajahModal 
          isOpen={isRegisterModalOpen}
          onClose={() => setIsRegisterModalOpen(false)} 
          santri={null}
          santriList={santriListForRegistration}
        />
      )}

      <div className="max-w-2xl w-full flex flex-col items-center mt-16 md:mt-0 z-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-6 text-center">Pindai Wajah</h1>

        <div className="flex flex-col sm:flex-row bg-slate-800 p-1 rounded-xl mb-6 shadow-inner w-full sm:w-auto gap-1">
          <button 
            onClick={() => setJenisAbsen("masuk")}
            className={`px-8 py-3 sm:py-2 rounded-lg font-semibold transition-all w-full sm:w-auto ${jenisAbsen === "masuk" ? "bg-emerald-500 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
          >
            Absen Masuk
          </button>
          <button 
            onClick={() => setJenisAbsen("pulang")}
            className={`px-8 py-3 sm:py-2 rounded-lg font-semibold transition-all w-full sm:w-auto ${jenisAbsen === "pulang" ? "bg-amber-500 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
          >
            Absen Pulang
          </button>
        </div>

        {/* Tombol Kontrol Kamera & Senter */}
        <div className="flex flex-row justify-center gap-2 mb-4 w-full max-w-sm">
          <button
            onClick={toggleFacingMode}
            className="px-4 py-2 bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm shadow-sm"
            title="Balik Kamera (Depan/Belakang)"
          >
            <RefreshCcw className="w-4 h-4" /> Balik
          </button>
          <button
            onClick={toggleTorch}
            className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 border transition-colors text-sm shadow-sm ${isTorchOn ? 'bg-amber-500 text-white border-amber-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'}`}
            title="Nyalakan/Matikan Senter"
          >
            <Flashlight className="w-4 h-4" /> Senter
          </button>
        </div>

        <div className="relative w-full aspect-square max-w-sm md:max-w-md bg-slate-800 rounded-3xl overflow-hidden border-4 border-slate-700 shadow-2xl flex items-center justify-center">
          {!isModelLoaded ? (
            <div className="flex flex-col items-center text-slate-400 p-6 text-center">
              <Loader2 className="animate-spin h-10 w-10 md:h-12 md:w-12 text-blue-500 mb-4" />
              <p className="text-sm md:text-base font-medium">Memuat Model AI Wajah...</p>
              <p className="text-xs mt-2 opacity-70">Mengunduh aset pertama kali (sekitar 5MB)</p>
            </div>
          ) : cameraError ? (
            <div className="flex flex-col items-center text-rose-400 p-6 text-center">
              <Camera className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-50" />
              <p className="text-sm md:text-base font-medium">{cameraError}</p>
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
                className={`w-full h-full object-cover transform ${facingMode === 'user' ? '-scale-x-100' : ''}`} 
              />
              <canvas 
                ref={canvasRef} 
                className={`absolute top-0 left-0 w-full h-full object-cover pointer-events-none`}
              />
              
              <div className={`absolute inset-0 border-4 ${jenisAbsen === 'masuk' ? 'border-emerald-500' : 'border-amber-500'} rounded-2xl m-4 md:m-8 opacity-60 transition-colors pointer-events-none`}></div>

              {isProcessing && !scanResult && (
                <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700/50 flex items-center gap-3 z-10 shadow-lg animate-in fade-in slide-in-from-top-4">
                  <Loader2 className={`animate-spin w-4 h-4 ${jenisAbsen === 'masuk' ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="text-white text-xs font-medium tracking-wide">Memverifikasi...</span>
                </div>
              )}

              {/* Flash effect when success */}
              {scanResult && scanResult.jenis !== 'error' && (
                <div className="absolute inset-0 bg-emerald-500/10 mix-blend-overlay z-10 animate-in fade-in duration-300"></div>
              )}
            </>
          )}
        </div>

        <p className="mt-6 text-slate-400 text-sm text-center max-w-sm">
          {!hasFaceData ? "Belum ada wajah santri yang terdaftar di sistem." : "Arahkan wajah Anda ke kamera untuk mencatat absensi secara otomatis."}
        </p>

        {/* Notifikasi Hasil Absen Mewah & Cepat */}
        {scanResult && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] animate-in zoom-in-90 fade-in duration-200">
            <div className={`backdrop-blur-xl px-8 py-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border flex flex-col items-center gap-4 text-center transform transition-all
              ${scanResult.jenis === 'error' ? 'bg-rose-950/80 border-rose-500/30' : scanResult.jenis === 'masuk' ? 'bg-emerald-950/80 border-emerald-500/30' : 'bg-amber-950/80 border-amber-500/30'}`}>
              
              <div className={`p-3 rounded-full ${scanResult.jenis === 'error' ? 'bg-rose-500/20 text-rose-400' : scanResult.jenis === 'masuk' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {scanResult.jenis === 'error' ? (
                  <XCircle className="w-12 h-12" />
                ) : (
                  <CheckCircle className="w-12 h-12" />
                )}
              </div>
              
              <div>
                <p className="text-white/70 text-xs font-semibold tracking-wider uppercase mb-1">
                  {scanResult.jenis === 'error' ? 'Gagal' : scanResult.jenis === 'masuk' ? 'Berhasil Masuk' : 'Berhasil Pulang'}
                </p>
                <h3 className={`text-white font-bold leading-tight ${scanResult.jenis === 'error' ? 'text-lg md:text-xl max-w-[320px] mx-auto' : 'text-2xl tracking-tight max-w-[250px] truncate'}`}>{scanResult.nama}</h3>
                {scanResult.waktu && <p className="text-white/60 text-sm mt-2 font-medium">{scanResult.waktu}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

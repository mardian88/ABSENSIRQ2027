"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Camera, CheckCircle2, ArrowLeft, CheckCircle, XCircle, Loader2, RefreshCcw, Flashlight } from "lucide-react";
import Link from "next/link";
import { recordAbsensiById } from "../absensi/actions";
import { getFaces } from "./actions";
import { useRouter } from "next/navigation";
import { formatTimeID } from "@/lib/date";
import { showError } from "@/lib/sweetalert";
import { KioskNav } from "@/components/KioskNav";
import * as faceapi from "face-api.js";

export default function PindaiWajah() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [faceMatcher, setFaceMatcher] = useState<faceapi.FaceMatcher | null>(null);
  
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
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);

        const dataSantri = await getFaces();
        
        const labeledDescriptors = dataSantri.map((santri: any) => {
          try {
            const arr = JSON.parse(santri.dataVektorWajah);
            const float32Arr = new Float32Array(arr);
            return new faceapi.LabeledFaceDescriptors(
              JSON.stringify({ id: santri.id, nama: santri.namaLengkap }),
              [float32Arr]
            );
          } catch (e) {
            console.error("Gagal memproses data wajah untuk santri", santri.id);
            return null;
          }
        }).filter(Boolean) as faceapi.LabeledFaceDescriptors[];

        if (isMounted) {
          if (labeledDescriptors.length > 0) {
            // Distance threshold 0.5 for strict matching (default is 0.6)
            setFaceMatcher(new faceapi.FaceMatcher(labeledDescriptors, 0.5));
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

  // Mulai kamera saat model siap atau arah kamera diganti
  useEffect(() => {
    if (isModelLoaded) {
      startVideo();
    }
  }, [facingMode, isModelLoaded]);

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
      video: { facingMode: facingMode, frameRate: { ideal: 60 } }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
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
    if (!videoRef.current || !canvasRef.current || !faceMatcher || isProcessing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    const displaySize = { width: video.videoWidth || 640, height: video.videoHeight || 480 };
    faceapi.matchDimensions(canvas, displaySize);

    let stopRequested = false;
    let isDetecting = false;

    const detectLoop = async () => {
      if (stopRequested) return;

      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        // Jika video belum siap, tunggu sebentar lalu coba lagi
        setTimeout(detectLoop, 100);
        return;
      }

      if (isDetecting) {
        requestAnimationFrame(detectLoop);
        return;
      }

      isDetecting = true;

      try {
        const detection = await faceapi.detectSingleFace(
          video, 
          new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        ).withFaceLandmarks().withFaceDescriptor();

        const context = canvas.getContext('2d');
        if (context) {
          context.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (detection) {
          const resizedDetections = faceapi.resizeResults(detection, displaySize);
          
          const match = faceMatcher.findBestMatch(detection.descriptor);
          
          // Gambar kotak bounding box
          const box = resizedDetections.detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, { 
            label: match.label !== 'unknown' ? JSON.parse(match.label).nama : "Tidak Dikenal",
            boxColor: match.label !== 'unknown' ? '#10b981' : '#f43f5e'
          });
          drawBox.draw(canvas);

          if (match.label !== 'unknown' && match.distance < 0.5) {
            const santriData = JSON.parse(match.label);
            
            // Mencegah scan berulang (debounce 5 detik per orang) dan cegah proses tumpang tindih
            const now = Date.now();
            if (lastScannedId.current === santriData.id && (now - lastScannedTime.current) < 5000) {
              // skip
            } else if (!isProcessing) {
              processAttendance(santriData.id, santriData.nama);
            }
          }
        }
      } catch (e) {
        // Abaikan error deteksi sementara
      } finally {
        isDetecting = false;
        if (!stopRequested) {
          // Panggil frame berikutnya secepat mungkin
          requestAnimationFrame(detectLoop);
        }
      }
    };

    detectLoop();

    return () => {
      stopRequested = true;
    };
  }, [faceMatcher, isProcessing, jenisAbsen]);

  const processAttendance = async (id: string, nama: string) => {
    setIsProcessing(true);
    lastScannedId.current = id;
    lastScannedTime.current = Date.now();
    
    const currentJenis = jenisAbsenRef.current;
    
    try {
      const res = await recordAbsensiById(id, currentJenis, 'wajah', 'hadir');
      if (res.success) {
        new Audio('/notif/berhasil.wav').play().catch(e => console.error("Audio error:", e));
        setScanResult({
          nama: nama,
          waktu: res.data?.waktu || formatTimeID(new Date()),
          jenis: currentJenis
        });
      } else {
        new Audio('/notif/gagal.wav').play().catch(err => console.error("Audio error:", err));
        setScanResult({
          nama: res.message || "Gagal Absen",
          waktu: formatTimeID(new Date()),
          jenis: "error"
        });
      }
    } catch (e: any) {
      new Audio('/notif/gagal.wav').play().catch(err => console.error("Audio error:", err));
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
      <KioskNav />

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

        <div className="relative w-full aspect-[3/4] sm:aspect-video bg-slate-800 rounded-3xl overflow-hidden border-4 border-slate-700 shadow-2xl flex items-center justify-center">
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
                className={`w-full h-full object-cover transform ${facingMode === 'user' ? '-scale-x-100' : ''}`} 
              />
              <canvas 
                ref={canvasRef} 
                className={`absolute top-0 left-0 w-full h-full object-cover pointer-events-none transform ${facingMode === 'user' ? '-scale-x-100' : ''}`}
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
          {!faceMatcher ? "Belum ada wajah santri yang terdaftar di sistem." : "Arahkan wajah Anda ke kamera untuk mencatat absensi secara otomatis."}
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

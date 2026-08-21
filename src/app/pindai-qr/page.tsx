"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, QrCode, Camera, Keyboard, Flashlight, RefreshCcw, XCircle } from "lucide-react";
import jsQR from "jsqr";
import { getAudioSettings } from "@/app/pengaturan/actions";
import { showError } from "@/lib/sweetalert";
import { recordAbsensiByQR } from "../absensi/actions";
import { formatTimeID } from "@/lib/date";
import { KioskNav } from "@/components/KioskNav";

export default function PindaiQR() {
  const [scanResult, setScanResult] = useState<{ nama: string; waktu: string; jenis: string } | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [jenisAbsen, setJenisAbsen] = useState<"masuk" | "pulang">("masuk");
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioConfig, setAudioConfig] = useState<any>(null);

  const playAudioResult = (success: boolean, jenis: string) => {
    const config = audioConfig || {
      isAudioMasukAktif: true,
      isAudioPulangAktif: true,
      isAudioGagalAktif: true,
      urlAudioMasuk: "",
      urlAudioPulang: "",
      urlAudioGagal: ""
    };

    try {
      if (success) {
        if (jenis === 'masuk' && config.isAudioMasukAktif) {
          const url = config.urlAudioMasuk || "/notif/absen%20masuk.wav";
          new Audio(url).play().catch((e) => console.log("Autoplay blocked:", e));
        } else if (jenis === 'pulang' && config.isAudioPulangAktif) {
          const url = config.urlAudioPulang || "/notif/absen%20pulang.wav";
          new Audio(url).play().catch((e) => console.log("Autoplay blocked:", e));
        }
      } else {
        if (config.isAudioGagalAktif) {
          const url = config.urlAudioGagal || "/notif/gagal.wav";
          new Audio(url).play().catch((e) => console.log("Autoplay blocked:", e));
        }
      }
    } catch (e) {
      console.error("Audio error", e);
    }
  };

  useEffect(() => { getAudioSettings().then(setAudioConfig); }, []);

  // Fitur Kamera vs Fisik
  const [inputMode, setInputMode] = useState<"kamera" | "fisik">("kamera");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [fisikInput, setFisikInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const jenisAbsenRef = useRef(jenisAbsen);
  const scanResultRef = useRef(scanResult);
  const isProcessingRef = useRef(isProcessing);
  
  // Custom Scanner Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => { jenisAbsenRef.current = jenisAbsen; }, [jenisAbsen]);
  useEffect(() => { scanResultRef.current = scanResult; }, [scanResult]);
  useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);

  // Autofocus input fisik
  useEffect(() => {
    if (inputMode === "fisik" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputMode]);

  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !overlayCanvasRef.current || inputMode !== "kamera") return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && !isProcessingRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const overlayCanvas = overlayCanvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const overlayCtx = overlayCanvas.getContext("2d");

      if (ctx && overlayCtx) {
        // Samakan ukuran canvas overlay dengan ukuran tampilannya di CSS (karena kita pakai class w-full h-full)
        if (overlayCanvas.width !== video.clientWidth) {
           overlayCanvas.width = video.clientWidth;
           overlayCanvas.height = video.clientHeight;
        }
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Mengambil sekitar 65% dari panjang sisi terpendek
        const size = Math.min(canvas.width, canvas.height) * 0.65;
        const x = (canvas.width - size) / 2;
        const y = (canvas.height - size) / 2;
        
        const imageData = ctx.getImageData(x, y, size, size);
        
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert", 
        });

        if (code && code.data) {
          // === ANIMASI LOCK-ON GRAB ===
          // Kalkulasi proporsi video scaling akibat CSS object-cover
          const scale = Math.max(overlayCanvas.width / video.videoWidth, overlayCanvas.height / video.videoHeight);
          const drawnWidth = video.videoWidth * scale;
          const drawnHeight = video.videoHeight * scale;
          const offsetX = (overlayCanvas.width - drawnWidth) / 2;
          const offsetY = (overlayCanvas.height - drawnHeight) / 2;
          
          const mapCoord = (point: { x: number, y: number }) => {
            const vidX = point.x + x;
            const vidY = point.y + y;
            return {
              x: (vidX * scale) + offsetX,
              y: (vidY * scale) + offsetY
            };
          };

          const pt1 = mapCoord(code.location.topLeftCorner);
          const pt2 = mapCoord(code.location.topRightCorner);
          const pt3 = mapCoord(code.location.bottomRightCorner);
          const pt4 = mapCoord(code.location.bottomLeftCorner);

          overlayCtx.beginPath();
          overlayCtx.moveTo(pt1.x, pt1.y);
          overlayCtx.lineTo(pt2.x, pt2.y);
          overlayCtx.lineTo(pt3.x, pt3.y);
          overlayCtx.lineTo(pt4.x, pt4.y);
          overlayCtx.closePath();

          overlayCtx.lineWidth = 5;
          overlayCtx.strokeStyle = "#10b981"; // emerald-500
          overlayCtx.fillStyle = "rgba(16, 185, 129, 0.4)";
          overlayCtx.stroke();
          overlayCtx.fill();

          // Kunci status agar kamera berhenti scan
          isProcessingRef.current = true;
          setIsProcessing(true);
          
          // Bersihkan kotak hijau setelah 100ms (0.1 detik)
          setTimeout(() => {
             overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          }, 100);

          // Eksekusi API secara INSTAN (paralel tanpa ditunda)
          handleProcessScan(code.data, true);

          return; 
        }
      }
    }
    
    animationFrameId.current = requestAnimationFrame(tick);
  };

  const handleProcessScan = async (decodedText: string, skipCheck = false) => {
    if (!skipCheck && (scanResultRef.current || isProcessingRef.current)) return;
    setIsProcessing(true);

    try {
      const res = await recordAbsensiByQR(decodedText, jenisAbsenRef.current);
      if (res.success && 'data' in res && res.data) {
        playAudioResult(true, jenisAbsenRef?.current || jenisAbsen);
        setScanResult({
          nama: res.data.namaLengkap,
          waktu: res.data.waktu,
          jenis: jenisAbsenRef.current
        });
      } else {
        playAudioResult(false, jenisAbsenRef?.current || jenisAbsen);
        setScanResult({
          nama: (res as any).message || "Santri tidak ditemukan",
          waktu: formatTimeID(new Date()),
          jenis: "error"
        });
      }
    } catch (e: any) {
      console.error(e);
      playAudioResult(false, jenisAbsenRef?.current || jenisAbsen);
      setScanResult({
        nama: e.message || "Gagal Server",
        waktu: formatTimeID(new Date()),
        jenis: "error"
      });
    } finally {
      setTimeout(() => {
        setScanResult(null);
        setIsProcessing(false);
        if (inputMode === "fisik" && inputRef.current) {
          inputRef.current.focus();
        } else if (inputMode === "kamera") {
          animationFrameId.current = requestAnimationFrame(tick);
        }
      }, 3000);
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsTorchOn(false);
  };

  const startCamera = async (cameraId?: string) => {
    stopCamera();
    setCameraError(null);
    try {
      // Constraints agresif untuk sat-set: 1080p, continuous focus
      const constraints: MediaStreamConstraints = {
        video: cameraId
          ? { deviceId: { exact: cameraId }, width: { ideal: 1280 }, height: { ideal: 720 }, advanced: [{ focusMode: "continuous" } as any] }
          : { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 }, advanced: [{ focusMode: "continuous" } as any] }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true"); // Wajib untuk iOS Safari
        await videoRef.current.play();
        animationFrameId.current = requestAnimationFrame(tick);
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      setCameraError("Kamera tidak dapat diakses atau diblokir oleh browser.");
    }
  };

  // Muat daftar kamera saat pertama kali
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        const videoDevices = devices.filter(d => d.kind === "videoinput");
        setCameras(videoDevices);
      }).catch(err => {
        console.log("No cameras found or permission denied.", err);
      });
    }
  }, []);

  // Mulai/Hentikan kamera berdasarkan Mode & Pilihan Kamera
  useEffect(() => {
    if (inputMode === "kamera") {
      setTimeout(() => startCamera(selectedCamera || undefined), 500);
    } else {
      stopCamera();
    }
    
    return () => { stopCamera(); };
  }, [inputMode, selectedCamera, facingMode]);

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
    setSelectedCamera(""); // Reset selected camera ID
  };

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          await track.applyConstraints({
            advanced: [{ torch: !isTorchOn } as any]
          });
          setIsTorchOn(!isTorchOn);
        } catch (err) {
          console.error("Gagal menyalakan senter", err);
          showError("Gagal", "Senter tidak didukung pada perangkat/kamera ini.");
        }
      }
    }
  };

  const handleFisikSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fisikInput.trim() !== "") {
      handleProcessScan(fisikInput.trim());
      setFisikInput("");
    }
  };

  return (
    <div className="p-4 md:p-8 min-h-screen flex flex-col items-center justify-center bg-slate-900 relative overflow-hidden">
      <KioskNav />

      <div className="max-w-2xl w-full flex flex-col items-center mt-16 md:mt-0 z-10">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-6 text-center">Pindai QR Santri</h1>

        {/* Pemilihan Jenis Absen */}
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

        {/* Pemilihan Mode Input */}
        <div className="flex gap-4 mb-4">
          <button 
            onClick={() => setInputMode("kamera")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${inputMode === "kamera" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
          >
            <Camera className="w-4 h-4" /> Kamera
          </button>
          <button 
            onClick={() => setInputMode("fisik")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${inputMode === "fisik" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}
          >
            <Keyboard className="w-4 h-4" /> Scanner Fisik
          </button>
        </div>

        {/* Dropdown Pemilih Kamera & Kontrol Ekstra */}
        {inputMode === "kamera" && (
          <div className="mb-4 w-full max-w-sm flex flex-col sm:flex-row gap-2">
            {cameras.length > 1 && (
              <select 
                className="flex-1 p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500 text-sm"
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
              >
                <option value="">Deteksi Otomatis ({facingMode === 'environment' ? 'Belakang' : 'Depan'})</option>
                {cameras.map(cam => (
                  <option key={cam.deviceId} value={cam.deviceId}>{cam.label || "Kamera"}</option>
                ))}
              </select>
            )}
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <button
                onClick={toggleFacingMode}
                className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg flex items-center justify-center gap-2 border border-slate-700 transition-colors text-sm"
                title="Balik Kamera (Depan/Belakang)"
              >
                <RefreshCcw className="w-4 h-4" /> Balik
              </button>
              <button
                onClick={toggleTorch}
                className={`px-4 py-2 rounded-lg flex items-center justify-center gap-2 border transition-colors text-sm ${isTorchOn ? 'bg-yellow-500 text-white border-yellow-400' : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'}`}
                title="Nyalakan/Matikan Senter"
              >
                <Flashlight className="w-4 h-4" /> Senter
              </button>
            </div>
          </div>
        )}

        {/* Layar Kamera */}
        <div className="relative w-full aspect-square max-w-sm md:max-w-md bg-slate-800 rounded-3xl overflow-hidden border-4 border-slate-700 shadow-2xl flex items-center justify-center">
          
          <video 
            ref={videoRef}
            className={`w-full h-full object-cover ${facingMode === 'user' ? '-scale-x-100' : ''} ${inputMode === 'kamera' && !cameraError ? 'block' : 'hidden'}`}
            muted
          ></video>

          <canvas ref={canvasRef} className="hidden"></canvas>
          <canvas ref={overlayCanvasRef} className={`absolute inset-0 w-full h-full pointer-events-none z-20 ${facingMode === 'user' ? '-scale-x-100' : ''}`}></canvas>

          {inputMode === "kamera" && cameraError && (
            <div className="flex flex-col items-center text-amber-400 text-center p-6 absolute inset-0 z-20 bg-slate-800">
              <Camera className="w-12 h-12 md:w-16 md:h-16 mb-4 opacity-50" />
              <p className="font-medium text-sm md:text-base">{cameraError}</p>
              <button onClick={() => startCamera(selectedCamera || undefined)} className="mt-6 px-6 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors text-sm font-semibold">
                Coba Lagi
              </button>
            </div>
          )}

          {inputMode === "fisik" && (
            <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center bg-slate-800 absolute inset-0 z-20" onClick={() => inputRef.current?.focus()}>
              <QrCode className="w-24 h-24 text-slate-600 mb-6 animate-pulse" />
              <p className="text-slate-300 font-medium mb-4">Siap Menerima Scan...</p>
              <p className="text-slate-500 text-sm">Gunakan Scanner QR fisik Anda (USB/Bluetooth) untuk menembak ID Santri.</p>
              <form onSubmit={handleFisikSubmit} className="mt-4">
                <input 
                  ref={inputRef}
                  type="text" 
                  value={fisikInput}
                  onChange={(e) => setFisikInput(e.target.value)}
                  onBlur={() => {
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className="opacity-10 absolute -z-10 w-1 h-1" 
                  autoFocus
                />
              </form>
            </div>
          )}

          {/* Kotak Scanner Overlay (Target Area) */}
          {!cameraError && !scanResult && inputMode === "kamera" && !isProcessing && (
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
               <div className="w-[65%] aspect-square border-2 border-emerald-500 rounded-xl relative shadow-[0_0_0_9999px_rgba(15,23,42,0.6)]">
                 {/* Garis scan animasi dihapus agar lebih clean, animasi grab tetap ada */}
               </div>
             </div>
          )}

          {scanResult && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center z-30 animate-in fade-in zoom-in duration-100 p-6 text-center">
              {scanResult.jenis === 'error' ? (
                <>
                  <XCircle className="w-20 h-20 md:w-24 md:h-24 mb-4 text-amber-500" />
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Peringatan</h2>
                  <p className="text-lg md:text-xl font-bold px-4 max-w-sm text-amber-400">{scanResult.nama}</p>
                </>
              ) : (
                <>
                  <CheckCircle2 className={`w-20 h-20 md:w-24 md:h-24 mb-4 ${scanResult.jenis === 'masuk' ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Absen {scanResult.jenis === 'masuk' ? 'Masuk' : 'Pulang'} Berhasil</h2>
                  <p className={`text-3xl md:text-4xl font-extrabold px-4 ${scanResult.jenis === 'masuk' ? 'text-emerald-400' : 'text-amber-400'}`}>{scanResult.nama}</p>
                </>
              )}
              <p className="text-slate-400 mt-4 text-lg md:text-xl">Waktu: {scanResult.waktu}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

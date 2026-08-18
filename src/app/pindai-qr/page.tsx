"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle2, QrCode, Camera, Keyboard, Flashlight, RefreshCcw, XCircle } from "lucide-react";
import { Html5Qrcode, CameraDevice } from "html5-qrcode";
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
    if (!audioConfig) {
      if (success) playAudioResult(true, jenisAbsenRef?.current || jenisAbsen);
      else playAudioResult(false, jenisAbsenRef?.current || jenisAbsen);
      return;
    }
    try {
      if (success) {
        if (jenis === 'masuk' && audioConfig.isAudioMasukAktif && audioConfig.urlAudioMasuk) {
          new Audio(audioConfig.urlAudioMasuk).play().catch(() => {});
        } else if (jenis === 'pulang' && audioConfig.isAudioPulangAktif && audioConfig.urlAudioPulang) {
          new Audio(audioConfig.urlAudioPulang).play().catch(() => {});
        } else if ((jenis === 'masuk' && audioConfig.isAudioMasukAktif) || (jenis === 'pulang' && audioConfig.isAudioPulangAktif)) {
          playAudioResult(true, jenisAbsenRef?.current || jenisAbsen);
        }
      } else {
        if (audioConfig.isAudioGagalAktif && audioConfig.urlAudioGagal) {
          new Audio(audioConfig.urlAudioGagal).play().catch(() => {});
        } else if (audioConfig.isAudioGagalAktif) {
          playAudioResult(false, jenisAbsenRef?.current || jenisAbsen);
        }
      }
    } catch (e) {}
  };

  useEffect(() => { getAudioSettings().then(setAudioConfig); }, []);

  // Fitur Kamera vs Fisik
  const [inputMode, setInputMode] = useState<"kamera" | "fisik">("kamera");
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [fisikInput, setFisikInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const jenisAbsenRef = useRef(jenisAbsen);
  const scanResultRef = useRef(scanResult);
  const isProcessingRef = useRef(isProcessing);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const transitionLockRef = useRef(false);

  useEffect(() => {
    jenisAbsenRef.current = jenisAbsen;
  }, [jenisAbsen]);

  useEffect(() => {
    scanResultRef.current = scanResult;
  }, [scanResult]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Autofocus input fisik
  useEffect(() => {
    if (inputMode === "fisik" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputMode]);

  const handleProcessScan = async (decodedText: string) => {
    if (scanResultRef.current || isProcessingRef.current) return;
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
        }
      }, 3000);
    }
  };

  const startCamera = async (cameraId?: string) => {
    if (transitionLockRef.current) {
      // If already transitioning, wait a bit and retry
      setTimeout(() => startCamera(cameraId), 300);
      return;
    }
    transitionLockRef.current = true;

    try {
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop().catch((e) => {
            const errStr = String(e);
            if (!errStr.includes("The play() request was interrupted") && !errStr.includes("AbortError")) {
              console.error(e);
            }
          });
        }
      }
      
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");

      setCameraError(null);
      setIsTorchOn(false);
      
      const config = {
        fps: 60, // Super agresif: 60 frame per detik!
        // qrbox dihapus agar sistem membaca seluruh layar penuh, tidak hanya di tengah kotak
        disableFlip: false, // Membaca QR yang mungkin terbalik
      };

      const camConfig = cameraId 
        ? { deviceId: { exact: cameraId } } 
        : { facingMode: facingMode };

      await html5QrCodeRef.current.start(
        camConfig,
        config,
        (decodedText) => handleProcessScan(decodedText),
        (errorMessage) => { /* ignore */ }
      );
    } catch (err: any) {
      const errStr = String(err);
      if (!errStr.includes("The play() request was interrupted") && !errStr.includes("AbortError")) {
        console.error(err);
        setCameraError("Kamera tidak dapat diakses atau sedang memulai.");
      }
    } finally {
      transitionLockRef.current = false;
    }
  };

  const stopCamera = async () => {
    if (transitionLockRef.current) {
       setTimeout(() => stopCamera(), 300);
       return;
    }
    
    if (html5QrCodeRef.current) {
      transitionLockRef.current = true;
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {
        const errStr = String(err);
        if (!errStr.includes("The play() request was interrupted") && !errStr.includes("AbortError")) {
          console.error(err);
        }
      } finally {
        html5QrCodeRef.current = null;
        transitionLockRef.current = false;
      }
    }
  };

  // Muat daftar kamera saat pertama kali
  useEffect(() => {
    Html5Qrcode.getCameras().then((devices) => {
      if (devices && devices.length > 0) {
        setCameras(devices);
        if (!selectedCamera) {
          setSelectedCamera(devices[0].id);
        }
      }
    }).catch(err => {
      console.log("No cameras found or permission denied.", err);
    });
  }, []);

  // Mulai/Hentikan kamera berdasarkan Mode & Pilihan Kamera
  useEffect(() => {
    if (inputMode === "kamera") {
      startCamera(selectedCamera || undefined);
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [inputMode, selectedCamera, facingMode]);

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
    setSelectedCamera(""); // Clear selected so it respects facingMode
  };

  const toggleTorch = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.applyVideoConstraints({
          advanced: [{ torch: !isTorchOn } as any]
        });
        setIsTorchOn(!isTorchOn);
      } catch (err) {
        console.error("Gagal menyalakan senter", err);
        showError("Gagal", "Senter tidak didukung pada perangkat/kamera ini.");
      }
    }
  };


  const handleFisikSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fisikInput.trim() !== "") {
      handleProcessScan(fisikInput.trim());
      setFisikInput(""); // reset setelah dikirim
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
                  <option key={cam.id} value={cam.id}>{cam.label || `Kamera ${cam.id}`}</option>
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

        <div className="relative w-full aspect-square max-w-sm md:max-w-md bg-slate-800 rounded-3xl overflow-hidden border-4 border-slate-700 shadow-2xl flex items-center justify-center">
          
          <div 
            id="qr-reader" 
            className={`w-full h-full bg-black [&>div]:w-full [&>div]:h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover ${facingMode === 'user' ? '[&_video]:!-scale-x-100' : ''} ${inputMode === 'kamera' && !cameraError ? 'block' : 'hidden'}`}
          ></div>

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

          {/* Custom overlay */}
          {!cameraError && !scanResult && inputMode === "kamera" && (
             <div className="absolute inset-0 border-4 border-slate-500 rounded-2xl m-8 opacity-40 pointer-events-none"></div>
          )}

          {scanResult && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center z-10 animate-in fade-in zoom-in duration-300 p-6 text-center">
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

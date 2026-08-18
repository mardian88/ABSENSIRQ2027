const fs = require('fs');

const file = 'src/app/admin-guru/RegisterWajahGuruModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states
const stateTarget = `const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);`;
const stateReplacement = `const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
  const [captureProgress, setCaptureProgress] = useState<number>(0);
  const [isCapturingSamples, setIsCapturingSamples] = useState(false);
  const samplesRef = useRef<number[][]>([]);
  const lastCaptureTimeRef = useRef<number>(0);`;

// 2. Modify detect logic
const detectFrameTarget = `if (face.embedding) {
              setFaceDescriptor(Array.from(face.embedding));
            } else {
              setFaceDescriptor(null);
            }`;

const detectFrameReplacement = `if (face.embedding) {
              setFaceDescriptor(Array.from(face.embedding));
              
              if (isCapturingSamples) {
                 const now = performance.now();
                 if (now - lastCaptureTimeRef.current > 300) { // capture every 300ms
                   samplesRef.current.push(Array.from(face.embedding));
                   lastCaptureTimeRef.current = now;
                   setCaptureProgress(samplesRef.current.length);
                   
                   if (samplesRef.current.length >= 10) {
                      setIsCapturingSamples(false);
                      saveMultiAngleData(samplesRef.current);
                   }
                 }
              }
            } else {
              setFaceDescriptor(null);
            }`;

// 3. handleSimpan replacement
const handleSimpanTarget = `const handleSimpan = async () => {
    if (!guru || !faceDescriptor) return;
    
    setIsProcessing(true);
    setMessage(null);
    
    try {
      // Array sudah berupa number[]
      const dataVektor = JSON.stringify(faceDescriptor);
      
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
  };`;

const handleSimpanReplacement = `const saveMultiAngleData = async (samples: number[][]) => {
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
    
    setIsProcessing(true);
    setMessage(null);
    
    samplesRef.current = [];
    lastCaptureTimeRef.current = performance.now();
    setIsCapturingSamples(true);
    setCaptureProgress(0);
  };`;

const buttonTarget = `<button
                  onClick={handleSimpan}
                  disabled={isProcessing}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Simpan Wajah
                    </>
                  )}
                </button>`;

const buttonReplacement = `<button
                  onClick={handleSimpan}
                  disabled={isProcessing || isCapturingSamples}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isCapturingSamples ? (
                    <>
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                      Merekam Sampel... {captureProgress}/10
                    </>
                  ) : isProcessing ? (
                    <>
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Mulai Rekam Wajah (10 Sampel)
                    </>
                  )}
                </button>
                {isCapturingSamples && (
                  <div className="text-center text-amber-400 font-medium text-sm mt-2 animate-pulse">
                    Mohon gerakkan wajah ke kiri/kanan perlahan...
                  </div>
                )}`;

if (!content.includes('Mulai Rekam Wajah')) {
    content = content.replace(stateTarget, stateReplacement);
    content = content.replace(detectFrameTarget, detectFrameReplacement);
    content = content.replace(handleSimpanTarget, handleSimpanReplacement);
    content = content.replace(buttonTarget, buttonReplacement);
    fs.writeFileSync(file, content);
    console.log("Updated guru modal");
} else {
    console.log("Already updated");
}

const fs = require('fs');

const file = 'src/app/santri/RegisterWajahModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add new state for progress and samples
const stateTarget = `const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);`;
const stateReplacement = `const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);
    const [captureProgress, setCaptureProgress] = useState<number>(0);
    const [isCapturingSamples, setIsCapturingSamples] = useState(false);
    const samplesRef = useRef<number[][]>([]);
    const lastCaptureTimeRef = useRef<number>(0);`;

// 2. Modify detectFrame to capture samples
const detectFrameTarget = `if (face.embedding && activeSantriId) {
            setFaceDescriptor(Array.from(face.embedding));
          }`;

const detectFrameReplacement = `if (face.embedding && activeSantriId) {
            setFaceDescriptor(Array.from(face.embedding));
            
            // MULTI-ANGLE CAPTURE LOGIC
            if (isCapturingSamples) {
               const now = performance.now();
               if (now - lastCaptureTimeRef.current > 300) { // capture every 300ms
                 samplesRef.current.push(Array.from(face.embedding));
                 lastCaptureTimeRef.current = now;
                 setCaptureProgress(samplesRef.current.length);
                 
                 if (samplesRef.current.length >= 10) {
                    setIsCapturingSamples(false);
                    // trigger save automatically
                    saveMultiAngleData(samplesRef.current);
                 }
               }
            }
          }`;

// 3. Modify handleSimpan to start capture process
const handleSimpanTarget = `const handleSimpan = async () => {
      if (!activeSantriId || !faceDescriptor) return;
      
      setIsProcessing(true);
      setMessage(null);
      
      try {
        const vektorArray = Array.from(faceDescriptor);
        const dataVektor = JSON.stringify(vektorArray);
        
        const res = await simpanVektorWajah(activeSantriId, dataVektor);
        
        if (res.success) {
          setMessage({ type: 'success', text: "Berhasil! Silakan pilih santri selanjutnya jika ingin merekam lagi." });
          
          // Kosongkan form agar langsung bisa scan yang lain
          setTimeout(() => {
            setActiveSantriId(null);
            setFaceDescriptor(null);
            setSearchQuery("");
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
        const res = await simpanVektorWajah(activeSantriId!, dataVektor);
        
        if (res.success) {
          setMessage({ type: 'success', text: "Berhasil merekam 10 sampel wajah!" });
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

    const handleSimpan = async () => {
      if (!activeSantriId || !faceDescriptor) return;
      setIsProcessing(true);
      setMessage(null);
      
      // Start multi-angle capture
      samplesRef.current = [];
      lastCaptureTimeRef.current = performance.now();
      setIsCapturingSamples(true);
      setCaptureProgress(0);
    };`;

// 4. Update the Button text in the render
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


if (content.includes('Mulai Rekam Wajah')) {
    console.log("Already updated");
} else {
    content = content.replace(stateTarget, stateReplacement);
    content = content.replace(detectFrameTarget, detectFrameReplacement);
    content = content.replace(handleSimpanTarget, handleSimpanReplacement);
    content = content.replace(buttonTarget, buttonReplacement);
    fs.writeFileSync(file, content);
    console.log("Updated santri modal");
}

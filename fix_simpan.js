const fs = require('fs');

function replaceBlock(file, fnName, newBlock) {
    let content = fs.readFileSync(file, 'utf8');
    const regex = new RegExp(`const ${fnName} = async \\(\\) => \\{[\\s\\S]*?\\};`, 'g');
    if (regex.test(content)) {
        content = content.replace(regex, newBlock);
        fs.writeFileSync(file, content);
        console.log(`Replaced ${fnName} in ${file}`);
    } else {
        console.log(`Could not find ${fnName} in ${file}`);
    }
}

// SANTRI
const santriBlock = `const saveMultiAngleData = async (samples: number[][]) => {
      setIsProcessing(true);
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
      setMessage(null);
      
      // Start multi-angle capture
      samplesRef.current = [];
      lastCaptureTimeRef.current = performance.now();
      setIsCapturingSamples(true);
      setCaptureProgress(0);
    };`;

replaceBlock('src/app/santri/RegisterWajahModal.tsx', 'handleSimpan', santriBlock);

// GURU
const guruBlock = `const saveMultiAngleData = async (samples: number[][]) => {
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
  };`;

replaceBlock('src/app/admin-guru/RegisterWajahGuruModal.tsx', 'handleSimpan', guruBlock);

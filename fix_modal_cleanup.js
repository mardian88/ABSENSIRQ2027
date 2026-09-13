const fs = require('fs');

function fixCleanupModal(file) {
    let c = fs.readFileSync(file, 'utf8');

    const targetStr = `useEffect(() => {
    if (isOpen && isModelLoaded) {
      startVideo();
    }
  }, [facingMode, isOpen, isModelLoaded]);`;

    const replacement = `useEffect(() => {
    if (isOpen && isModelLoaded) {
      startVideo();
    }

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        if (stream && typeof stream.getTracks === 'function') {
           stream.getTracks().forEach((track) => track.stop());
        }
      }
    };
  }, [facingMode, isOpen, isModelLoaded]);`;

    if (c.includes(targetStr)) {
        c = c.replace(targetStr, replacement);
        fs.writeFileSync(file, c);
        console.log("Fixed", file);
    }
}

fixCleanupModal('src/app/santri/RegisterWajahModal.tsx');
fixCleanupModal('src/app/admin-guru/RegisterWajahGuruModal.tsx');

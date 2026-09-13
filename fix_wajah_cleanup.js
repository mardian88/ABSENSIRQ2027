const fs = require('fs');
let c = fs.readFileSync('src/app/pindai-wajah/page.tsx', 'utf8');

const targetStr = `useEffect(() => {
    if (isModelLoaded) {
      startVideo();
    }
  }, [facingMode, isModelLoaded]);`;

const replacement = `useEffect(() => {
    if (isModelLoaded) {
      startVideo();
    }
    
    // CLEANUP CAMERA ON UNMOUNT OR CHANGE
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        if (stream && typeof stream.getTracks === 'function') {
           stream.getTracks().forEach((track) => track.stop());
        }
      }
    };
  }, [facingMode, isModelLoaded]);`;

if (c.includes(targetStr)) {
    c = c.replace(targetStr, replacement);
    fs.writeFileSync('src/app/pindai-wajah/page.tsx', c);
}

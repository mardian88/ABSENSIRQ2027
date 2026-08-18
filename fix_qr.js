const fs = require('fs');

const file = 'src/app/pindai-qr/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldStr = `  // Mulai/Hentikan kamera berdasarkan Mode & Pilihan Kamera
  useEffect(() => {
    if (inputMode === "kamera") {
      startCamera(selectedCamera || undefined);
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [inputMode, selectedCamera, facingMode]);`;

const newStr = `  // Mulai/Hentikan kamera berdasarkan Mode & Pilihan Kamera
  useEffect(() => {
    if (inputMode === "kamera") {
      setTimeout(() => startCamera(selectedCamera || undefined), 800);
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
      // Force hardware release for mobile browsers
      try {
        const video = document.querySelector('#qr-reader video');
        if (video && video.srcObject) {
          video.srcObject.getTracks().forEach(t => t.stop());
        }
      } catch(e) {}
    };
  }, [inputMode, selectedCamera, facingMode]);`;

if (content.includes(oldStr)) {
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(file, content);
    console.log("Success");
} else {
    console.log("Not found");
}

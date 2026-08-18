const fs = require('fs');
let c = fs.readFileSync('src/app/pindai-qr/page.tsx', 'utf8');

// Add timeout to startCamera in useEffect
const targetStart = `if (inputMode === "kamera") {
      startCamera(selectedCamera || undefined);
    }`;
const replaceStart = `if (inputMode === "kamera") {
      setTimeout(() => startCamera(selectedCamera || undefined), 600);
    }`;

if (c.includes(targetStart)) {
    c = c.replace(targetStart, replaceStart);
}

// Add forceful cleanup in stopCamera's cleanup
const targetCleanup = `return () => {
      stopCamera();
    };`;
const replaceCleanup = `return () => {
      stopCamera();
      // Force hardware release for mobile browsers
      try {
        const video = document.querySelector('#qr-reader video');
        if (video && video.srcObject) {
          video.srcObject.getTracks().forEach(t => t.stop());
        }
      } catch(e) {}
    };`;

if (c.includes(targetCleanup)) {
    c = c.replace(targetCleanup, replaceCleanup);
}

fs.writeFileSync('src/app/pindai-qr/page.tsx', c);

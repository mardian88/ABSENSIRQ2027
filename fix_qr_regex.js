const fs = require('fs');

const file = 'src/app/pindai-qr/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /\/\/ Mulai\/Hentikan kamera berdasarkan Mode & Pilihan Kamera\s*useEffect\(\(\) => \{\s*if \(inputMode === "kamera"\) \{\s*startCamera\(selectedCamera \|\| undefined\);\s*\} else \{\s*stopCamera\(\);\s*\}\s*return \(\) => \{\s*stopCamera\(\);\s*\};\s*\}, \[inputMode, selectedCamera, facingMode\]\);/g;

const newStr = `// Mulai/Hentikan kamera berdasarkan Mode & Pilihan Kamera
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

if (regex.test(content)) {
    content = content.replace(regex, newStr);
    fs.writeFileSync(file, content);
    console.log("Success with Regex");
} else {
    console.log("Regex Not found");
}

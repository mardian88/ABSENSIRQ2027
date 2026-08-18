const fs = require('fs');

function fixInfiniteLoop(filePath, isManual) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix recursive calls inside playAudioResult
  const badTrue = isManual ? 'playAudioResult(true, jenis);' : 'playAudioResult(true, jenisAbsenRef?.current || jenisAbsen);';
  const badFalse = isManual ? 'playAudioResult(false, jenis);' : 'playAudioResult(false, jenisAbsenRef?.current || jenisAbsen);';

  // regex to fix the exact structure
  content = content.replace("if (success) " + badTrue + "\\n        else " + badFalse, 
    "if (success) new Audio('/notif/berhasil.wav').play().catch(() => {});\\n        else new Audio('/notif/gagal.wav').play().catch(() => {});");
  
  content = content.replace("if (success) " + badTrue + "\\r\\n        else " + badFalse, 
    "if (success) new Audio('/notif/berhasil.wav').play().catch(() => {});\\n        else new Audio('/notif/gagal.wav').play().catch(() => {});");

  // Fix the other fallback inside playAudioResult
  content = content.replace("}) {\\n          " + badTrue + "\\n        }", 
    "}) {\\n          new Audio('/notif/berhasil.wav').play().catch(() => {});\\n        }");
  content = content.replace("}) {\\r\\n          " + badTrue + "\\r\\n        }", 
    "}) {\\n          new Audio('/notif/berhasil.wav').play().catch(() => {});\\n        }");

  content = content.replace("isAudioGagalAktif) {\\n          " + badFalse + "\\n        }", 
    "isAudioGagalAktif) {\\n          new Audio('/notif/gagal.wav').play().catch(() => {});\\n        }");
  content = content.replace("isAudioGagalAktif) {\\r\\n          " + badFalse + "\\r\\n        }", 
    "isAudioGagalAktif) {\\n          new Audio('/notif/gagal.wav').play().catch(() => {});\\n        }");

  fs.writeFileSync(filePath, content);
}

fixInfiniteLoop('src/app/pindai-qr/page.tsx', false);
fixInfiniteLoop('src/app/pindai-wajah/page.tsx', false);
fixInfiniteLoop('src/app/absensi/manual/ManualAbsenClient.tsx', true);

const fs = require('fs');

function updateCalls(filePath, isManual) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Specific replacements
  const replMasuk = isManual ? 'playAudioResult(true, jenis);' : 'playAudioResult(true, jenisAbsenRef?.current || jenisAbsen);';
  const replGagal = isManual ? 'playAudioResult(false, jenis);' : 'playAudioResult(false, jenisAbsenRef?.current || jenisAbsen);';

  content = content.replace(/new Audio\('\/notif\/berhasil\.wav'\)\.play\(\)\.catch\([^;]+\);/g, replMasuk);
  content = content.replace(/new Audio\('\/notif\/gagal\.wav'\)\.play\(\)\.catch\([^;]+\);/g, replGagal);

  // Fallback for simple ones
  content = content.replace(/new Audio\('\/notif\/berhasil\.wav'\)\.play\(\);/g, replMasuk);
  content = content.replace(/new Audio\('\/notif\/gagal\.wav'\)\.play\(\);/g, replGagal);

  fs.writeFileSync(filePath, content);
}

updateCalls('src/app/pindai-qr/page.tsx', false);
updateCalls('src/app/pindai-wajah/page.tsx', false);
updateCalls('src/app/absensi/manual/ManualAbsenClient.tsx', true);

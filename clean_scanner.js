const fs = require('fs');

function updateFile(filePath, isManual) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Inject import
  if (!content.includes('getAudioSettings')) {
    if (isManual) {
      content = content.replace('import { recordAbsensiById }', 'import { getAudioSettings } from "@/app/pengaturan/actions";\nimport { recordAbsensiById }');
    } else {
      content = content.replace('import { showError', 'import { getAudioSettings } from "@/app/pengaturan/actions";\nimport { showError');
    }
  }

  // Inject state and hook
  if (!content.includes('audioConfig')) {
    content = content.replace('const [isProcessing, setIsProcessing] = useState(false);', 
      'const [isProcessing, setIsProcessing] = useState(false);\n  const [audioConfig, setAudioConfig] = useState<any>(null);\n  useEffect(() => { getAudioSettings().then(setAudioConfig); }, []);');
  }

  // Inject helper function
  if (!content.includes('playAudioResult')) {
    const helper = `
  const playAudioResult = (success: boolean, jenis: string) => {
    if (!audioConfig) {
      if (success) new Audio('/notif/berhasil.wav').play().catch(() => {});
      else new Audio('/notif/gagal.wav').play().catch(() => {});
      return;
    }
    try {
      if (success) {
        if (jenis === 'masuk' && audioConfig.isAudioMasukAktif && audioConfig.urlAudioMasuk) {
          new Audio(audioConfig.urlAudioMasuk).play().catch(() => {});
        } else if (jenis === 'pulang' && audioConfig.isAudioPulangAktif && audioConfig.urlAudioPulang) {
          new Audio(audioConfig.urlAudioPulang).play().catch(() => {});
        } else if ((jenis === 'masuk' && audioConfig.isAudioMasukAktif) || (jenis === 'pulang' && audioConfig.isAudioPulangAktif)) {
          new Audio('/notif/berhasil.wav').play().catch(() => {});
        }
      } else {
        if (audioConfig.isAudioGagalAktif && audioConfig.urlAudioGagal) {
          new Audio(audioConfig.urlAudioGagal).play().catch(() => {});
        } else if (audioConfig.isAudioGagalAktif) {
          new Audio('/notif/gagal.wav').play().catch(() => {});
        }
      }
    } catch (e) {}
  };
`;
    // Insert after audioConfig state
    content = content.replace('const [audioConfig, setAudioConfig] = useState<any>(null);', 'const [audioConfig, setAudioConfig] = useState<any>(null);\n' + helper);
  }

  // Replace all new Audio calls
  content = content.replace(/new Audio\('\/notif\/berhasil\.wav'\)\.play\(\)\.catch\([^\)]+\);/g, 'playAudioResult(true, jenisAbsenRef?.current || jenisAbsen);');
  content = content.replace(/new Audio\('\/notif\/gagal\.wav'\)\.play\(\)\.catch\([^\)]+\);/g, 'playAudioResult(false, jenisAbsenRef?.current || jenisAbsen);');
  
  // also fix ManualAbsenClient where `jenisAbsen` is not defined locally? wait, manual absen sets `jenis` from its own arg!
  if (isManual) {
    content = content.replace(/playAudioResult\(true, jenisAbsenRef\?\.current \|\| jenisAbsen\);/g, 'playAudioResult(true, jenis);');
    content = content.replace(/playAudioResult\(false, jenisAbsenRef\?\.current \|\| jenisAbsen\);/g, 'playAudioResult(false, jenis);');
  }

  fs.writeFileSync(filePath, content);
}

updateFile('src/app/pindai-qr/page.tsx', false);
updateFile('src/app/pindai-wajah/page.tsx', false);
updateFile('src/app/absensi/manual/ManualAbsenClient.tsx', true);

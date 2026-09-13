const fs = require('fs');

function updateFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Inject import
  if (!content.includes('getAudioSettings')) {
    content = content.replace('import { showError', 'import { getAudioSettings } from "@/app/pengaturan/actions";\\nimport { showError');
  }

  // Inject state and hook
  if (!content.includes('audioConfig')) {
    content = content.replace('const [isProcessing, setIsProcessing] = useState(false);', 
      'const [isProcessing, setIsProcessing] = useState(false);\\n  const [audioConfig, setAudioConfig] = useState<any>(null);\\n  useEffect(() => { getAudioSettings().then(setAudioConfig); }, []);');
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
    // Insert just before useEffect or similar
    content = content.replace('useEffect(() => { getAudioSettings', helper + '\\n  useEffect(() => { getAudioSettings');
  }

  // Replace all new Audio calls
  content = content.replace(/new Audio\('\/notif\/berhasil\.wav'\)\.play\(\)\.catch\([^\)]+\);/g, 'playAudioResult(true, jenisAbsenRef?.current || jenisAbsen);');
  content = content.replace(/new Audio\('\/notif\/gagal\.wav'\)\.play\(\)\.catch\([^\)]+\);/g, 'playAudioResult(false, jenisAbsenRef?.current || jenisAbsen);');

  fs.writeFileSync(filePath, content);
}

updateFile('src/app/pindai-qr/page.tsx');
updateFile('src/app/pindai-wajah/page.tsx');
updateFile('src/app/absensi/manual/ManualAbsenClient.tsx');

const fs = require('fs');

function injectAudioLogic(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  // Add import if not present
  if (!content.includes('getAudioSettings')) {
    content = content.replace('import { showError', 'import { getAudioSettings } from "@/app/pengaturan/actions";\\nimport { showError');
  }

  // Add state
  if (!content.includes('audioConfig')) {
    content = content.replace('const [isProcessing, setIsProcessing] = useState(false);', 'const [isProcessing, setIsProcessing] = useState(false);\\n  const [audioConfig, setAudioConfig] = useState<any>(null);\\n  useEffect(() => { getAudioSettings().then(setAudioConfig); }, []);');
  }
  
  // Create play function helper just above the play logic
  if (!content.includes('playAudioResult')) {
    const helper = `
  const playAudioResult = (success: boolean, jenis: string) => {
    if (!audioConfig) {
      // Fallback
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
        } else if (!audioConfig.urlAudioMasuk && !audioConfig.urlAudioPulang) {
          new Audio('/notif/berhasil.wav').play().catch(() => {});
        }
      } else {
        if (audioConfig.isAudioGagalAktif && audioConfig.urlAudioGagal) {
          new Audio(audioConfig.urlAudioGagal).play().catch(() => {});
        } else if (!audioConfig.urlAudioGagal) {
          new Audio('/notif/gagal.wav').play().catch(() => {});
        }
      }
    } catch (e) {}
  };
`;
    // Find the first return statement or a good place to put it
    // Actually, I'll just use regex replacement
  }
}

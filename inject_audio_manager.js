const fs = require('fs');
let content = fs.readFileSync('src/app/pengaturan/page.tsx', 'utf8');

// Add import
const importStr = `import { AudioNotifManager } from "./AudioNotifManager";\\nimport { getAudioSettings } from "./actions";\\n`;
content = content.replace('import { PengumumanManager } from "./PengumumanManager";', 'import { PengumumanManager } from "./PengumumanManager";\\n' + importStr);

// Add state for audio data
content = content.replace('const [loading, setLoading] = useState(true);', 'const [loading, setLoading] = useState(true);\\n  const [audioData, setAudioData] = useState<any>(null);');

// Add fetch
content = content.replace('getPengaturanProfil().then(setProfil);', 'getPengaturanProfil().then(setProfil);\\n      getAudioSettings().then(setAudioData);');

// Add component below SesiAbsensiManager
content = content.replace('<SesiAbsensiManager />', '<SesiAbsensiManager />\\n        <AudioNotifManager initialData={audioData} />');

fs.writeFileSync('src/app/pengaturan/page.tsx', content);

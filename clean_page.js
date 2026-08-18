const fs = require('fs');

let content = fs.readFileSync('src/app/pengaturan/page.tsx', 'utf8');

const imports = `import { AudioNotifManager } from "./AudioNotifManager";
import { getAudioSettings } from "./actions";`;

content = content.replace('import { PengumumanManager } from "./PengumumanManager";', 'import { PengumumanManager } from "./PengumumanManager";\n' + imports);

content = content.replace('const [loading, setLoading] = useState(true);', `const [loading, setLoading] = useState(true);
  const [audioData, setAudioData] = useState<any>(null);`);

content = content.replace('getPengaturanProfil().then(setProfil);', `getPengaturanProfil().then(setProfil);
      getAudioSettings().then(setAudioData);`);

content = content.replace('{activeTab === "absensi" && (\\n        <SesiAbsensiManager />\\n      )}', `{activeTab === "absensi" && (
        <>
          <SesiAbsensiManager />
          <AudioNotifManager initialData={audioData} />
        </>
      )}`);
// Regex approach for JSX replace to avoid newline matching issues
content = content.replace(/\{activeTab === "absensi" && \(\s*<SesiAbsensiManager \/>\s*\)\}/, `{activeTab === "absensi" && (
        <>
          <SesiAbsensiManager />
          <AudioNotifManager initialData={audioData} />
        </>
      )}`);

fs.writeFileSync('src/app/pengaturan/page.tsx', content);

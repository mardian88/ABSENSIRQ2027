const fs = require('fs'); 
let c = fs.readFileSync('src/app/absensi/manual/ManualAbsenClient.tsx', 'utf8'); 
c = c.replace('import { recordAbsensiById }', 'import { getAudioSettings } from "@/app/pengaturan/actions";\nimport { recordAbsensiById }'); 
fs.writeFileSync('src/app/absensi/manual/ManualAbsenClient.tsx', c);

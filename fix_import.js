const fs = require('fs');
let c = fs.readFileSync('src/app/pengaturan/AudioNotifManager.tsx', 'utf8');
c = c.replace('import { Switch } from "@/components/ui/switch";', '');
fs.writeFileSync('src/app/pengaturan/AudioNotifManager.tsx', c);

const fs = require('fs');
let c = fs.readFileSync('src/app/pindai-qr/page.tsx', 'utf8');
c = c.replace('[&_video]:!-scale-x-100', "${facingMode === 'user' ? '[&_video]:!-scale-x-100' : ''}");
fs.writeFileSync('src/app/pindai-qr/page.tsx', c);

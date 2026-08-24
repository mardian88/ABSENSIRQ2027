const fs = require('fs');

let content = fs.readFileSync('src/app/laporan-absensi/perizinan/actions.ts', 'utf8');
content = content.replace(/export type AlpaData =[\s\S]*$/, '');
fs.writeFileSync('src/app/laporan-absensi/perizinan/actions.ts', content, 'utf8');
console.log('Done');

const fs = require('fs');
let c = fs.readFileSync('src/app/portal-ortu/(dashboard)/izin/riwayat/page.tsx', 'utf8');
c = c.replace('href="/izin/dashboard"', 'href="/portal-ortu/izin"');
fs.writeFileSync('src/app/portal-ortu/(dashboard)/izin/riwayat/page.tsx', c);

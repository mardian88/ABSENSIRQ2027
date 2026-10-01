const fs = require('fs');
const file = 'src/components/AppLayout.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /pathname\.startsWith\("\/portal-ortu"\) \|\| pathname\.startsWith\("\/mutabaah"\)/,
  'pathname.startsWith("/portal-ortu") || pathname.startsWith("/mutabaah") || pathname.startsWith("/portal-privat")'
);

fs.writeFileSync(file, content);
console.log("Updated AppLayout!");

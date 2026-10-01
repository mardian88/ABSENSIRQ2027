const fs = require('fs');
const file = 'src/proxy.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /path\.startsWith\('\/portal-ortu'\)/g,
  "path.startsWith('/portal-ortu') || path.startsWith('/portal-privat')"
);

fs.writeFileSync(file, content);
console.log("Updated proxy.ts!");

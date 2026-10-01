const fs = require('fs');
const file = 'src/app/portal-guru/PortalGuruClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove all occurrences of "use client";
content = content.replace(/"use client";\n?/g, '');
// Add it at the top
content = '"use client";\n' + content;

fs.writeFileSync(file, content);
console.log("Fixed PortalGuruClient!");

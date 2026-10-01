const fs = require('fs');

const file = 'src/app/admin-guru/actions.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/statusAktif: data\.statusAktif,/g, "statusAktif: data.statusAktif,\n      isGuruPrivat: data.isGuruPrivat,");

fs.writeFileSync(file, content);
console.log("Updated admin-guru/actions.ts!");

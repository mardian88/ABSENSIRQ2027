const fs = require('fs');

function replaceFileContent(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');
  content = content.replace(/from "\.\.\/actions"/g, 'from "../../actions"');
  content = content.replace(/from "\.\.\/\.\.\/actions"/g, 'from "../../actions"');
  // fix mutabaah actions too
  content = content.replace(/from "\.\/actions"/g, 'from "../actions"');
  fs.writeFileSync(filepath, content);
}

replaceFileContent('src/app/portal-ortu/izin/form/page.tsx');
replaceFileContent('src/app/portal-ortu/izin/riwayat/page.tsx');

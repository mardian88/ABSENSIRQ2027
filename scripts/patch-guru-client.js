const fs = require('fs');
const file = 'src/app/admin-guru/AdminGuruClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add boolean conversion for isGuruPrivat
content = content.replace("payload.statusAktif = payload.statusAktif === 'true';", "payload.statusAktif = payload.statusAktif === 'true';\n    payload.isGuruPrivat = payload.isGuruPrivat === 'true';");

// 2. Add form field
const formFieldStr = `                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status Guru Privat</label>
                  <select name="isGuruPrivat" defaultValue={editingData ? String(editingData.isGuruPrivat) : "false"} className="w-full p-2 border border-slate-300 rounded-lg">
                    <option value="true">Ya (Mengajar Privat)</option>
                    <option value="false">Tidak</option>
                  </select>
                </div>`;

content = content.replace(
  /<select name="statusAktif"[\s\S]*?<\/select>\n\s*<\/div>/,
  `$&
${formFieldStr}`
);

fs.writeFileSync(file, content);
console.log("Updated AdminGuruClient!");

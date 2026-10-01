const fs = require('fs');
const file = 'src/app/portal-guru/PortalGuruClient.tsx';
let content = fs.readFileSync(file, 'utf8');

// Also need to make sure Link is imported, let's check
if (!content.includes('import Link from')) {
    content = 'import Link from "next/link";\n' + content;
}

const insertion = `{initialData.profil.isGuruPrivat && (
              <div className="bg-purple-50 p-5 rounded-2xl border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-purple-800 text-lg">Area Guru Privat</h3>
                  <p className="text-sm text-purple-600 mt-1">Kelola presensi, mutaba'ah hafalan, dan tagihan santri privat Anda.</p>
                </div>
                <Link href="/portal-guru/absensi-privat" className="whitespace-nowrap px-5 py-2.5 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition shadow-sm border border-purple-700">
                  Masuk Menu Privat
                </Link>
              </div>
            )}`;

content = content.replace('{/* PENGUMUMAN SECTION */}', insertion + '\n\n              {/* PENGUMUMAN SECTION */}');

fs.writeFileSync(file, content);
console.log("Updated PortalGuruClient!");

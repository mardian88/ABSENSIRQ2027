const fs = require('fs');

let c = fs.readFileSync('src/app/portal-ortu/mutabaah/MutabaahOrtuClient.tsx', 'utf8');

c = c.replace(/import \{ logoutMutabaahOrtu.*? \} from "\.\.\/actions";/, 'import { tandaiTelahDilihat, tambahSetoranLiburOrtu } from "../actions";');
c = c.replace(/const handleLogout = async \(\) => \{[\s\S]*?\};/, '');
c = c.replace(/<div className="bg-emerald-700 text-white p-6 relative overflow-hidden shrink-0">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '<div className="mb-6"><h1 className="text-2xl font-bold text-slate-800">Mutabaah Santri</h1><p className="text-slate-500">Pantau capaian mengaji dan hafalan</p></div>');
c = c.replace(/<div className="min-h-screen bg-slate-50">/, '<div className="p-6 md:p-10 max-w-5xl mx-auto w-full">');

fs.writeFileSync('src/app/portal-ortu/mutabaah/MutabaahOrtuClient.tsx', c);

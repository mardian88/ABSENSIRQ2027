const fs = require('fs');

const izinActions = fs.readFileSync('src/app/izin/actions.ts', 'utf8');
const mutabaahActions = fs.readFileSync('src/app/mutabaah/actions.ts', 'utf8');

let unified = izinActions.replace(/import { santri, perizinanSantri, absensi, pengaturanHumas } from "@\/db\/schema";/g, 'import { santri, perizinanSantri, absensi, pengaturanHumas, mutabaahSetoran } from "@/db/schema";') + '\n\n// --- MUTABAAH ACTIONS ---\n' + 
  mutabaahActions.replace(/getSessionSantriId/g, 'getOrtuSession')
                 .replace(/const ORTU_MUTABAAH_SESSION = "ortu_mutabaah_session";/g, '')
                 .replace(/import .* from "next\/headers";/g, '')
                 .replace(/import .* from "next\/cache";/g, '')
                 .replace(/import .* from "drizzle-orm";/g, '')
                 .replace(/import { v4 as uuidv4 } from "uuid";/g, '')
                 .replace(/"use server";/g, '')
                 .replace(/import { db } from "@\/db";/g, '')
                 .replace(/import { santri, mutabaahSetoran, halaqoh } from "@\/db\/schema";/g, '')
                 .replace(/export async function loginMutabaahOrtu.*?\n\}/s, '') // delete loginMutabaahOrtu since we use loginOrtu from izin
                 .replace(/export async function logoutMutabaahOrtu.*?\n\}/s, '') // delete logoutMutabaahOrtu
                 .replace(/const santriId = await getOrtuSession\(\);\n  if \(!santriId\) return null;/g, 'const sessionSantri = await getOrtuSession();\n  if (!sessionSantri) return null;\n  const santriId = sessionSantri.id;')
                 .replace(/const santriId = await getOrtuSession\(\);\n  if \(!santriId\) return { success: false, message: "Akses ditolak" };/g, 'const sessionSantri = await getOrtuSession();\n  if (!sessionSantri) return { success: false, message: "Akses ditolak" };\n  const santriId = sessionSantri.id;');

// Replace revalidatePath("/mutabaah") with revalidatePath("/portal-ortu/mutabaah")
unified = unified.replace(/\/mutabaah/g, '/portal-ortu/mutabaah');

fs.writeFileSync('src/app/portal-ortu/actions.ts', unified);
console.log('Merged successfully');

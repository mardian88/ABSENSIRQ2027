const fs = require('fs');
let c = fs.readFileSync('src/app/absensi/actions.ts', 'utf8');

if (!c.includes('perizinanSantri')) {
  c = c.replace('import { absensi, absensiGuru, santri, guru, halaqoh, sesiAbsensi, pengaturanHariAktif, hariLibur, pengaturanHumas } from "@/db/schema";', 
    'import { absensi, absensiGuru, santri, guru, halaqoh, sesiAbsensi, pengaturanHariAktif, hariLibur, pengaturanHumas, perizinanSantri } from "@/db/schema";');
}

if (!c.includes('lte') || !c.includes('gte')) {
  c = c.replace(/import \{ eq, or, and, desc, between \} from "drizzle-orm";/, 
    'import { eq, or, and, desc, between, lte, gte } from "drizzle-orm";');
}

const checkBlock = `
    // Cek apakah santri sedang dalam masa izin/sakit
    const activeIzin = await db.select().from(perizinanSantri).where(
      and(
        eq(perizinanSantri.idSantri, idSantri),
        lte(perizinanSantri.tanggalMulai, endOfDayWIB),
        gte(perizinanSantri.tanggalSelesai, startOfDayWIB)
      )
    ).limit(1);

    if (activeIzin.length > 0) {
      return { success: false, message: \`Santri sedang dalam masa \${activeIzin[0].kategori} (\${activeIzin[0].keterangan})\` };
    }
`;

const targetStr = `const liburData = await db.select().from(hariLibur).where(eq(hariLibur.tanggal, wibDateString));
    if (liburData.length > 0) {
      return { success: false, message: \`Sistem absensi libur: \${liburData[0].keterangan}\` };
    }
    // -----------------------------`;

if (!c.includes('activeIzin.length > 0')) {
  c = c.replace(targetStr, targetStr + "\\n" + checkBlock);
}

fs.writeFileSync('src/app/absensi/actions.ts', c);

const fs = require('fs');
let c = fs.readFileSync('src/app/absensi/actions.ts', 'utf8');

const rx = /(\/\/ -----------------------------)/g;
const check = `
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

    $1`;

if (!c.includes('activeIzin.length > 0')) {
    c = c.replace(rx, check);
    fs.writeFileSync('src/app/absensi/actions.ts', c);
}

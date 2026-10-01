const fs = require('fs');

const file = 'src/app/admin-keuangan/privat/actions.ts';
let content = fs.readFileSync(file, 'utf8');

const newGenerator = `export async function generateTagihanBulanan(bulan: number, tahun: number) {
  try {
    const aktifSantri = await db.select().from(santriPrivat).where(eq(santriPrivat.statusSantri, 'aktif'));
    
    // Ambil data absensi sebulan penuh untuk semua santri privat
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999);
    
    // We import absensiPrivat dynamically to ensure it's in scope if not imported
    const { absensiPrivat } = await import('@/db/schema');
    const { and, gte, lte } = await import('drizzle-orm');
    
    const absensiBulanIni = await db.select().from(absensiPrivat).where(
      and(
        gte(absensiPrivat.waktuSesi, startDate),
        lte(absensiPrivat.waktuSesi, endDate),
        eq(absensiPrivat.statusKehadiran, 'hadir')
      )
    );
    
    let tagihanDibuat = 0;
    
    for (const s of aktifSantri) {
      let tagihan = 0;
      
      if (s.jenisTagihan === 'per_pertemuan') {
        const totalHadir = absensiBulanIni.filter(a => a.idSantriPrivat === s.id).length;
        if (totalHadir === 0 || s.tarifPerPertemuan <= 0) continue; // Jangan generate jika tidak pernah hadir
        tagihan = totalHadir * s.tarifPerPertemuan;
      } else {
        if (s.nominalTagihanBulanan <= 0) continue;
        tagihan = s.nominalTagihanBulanan;
      }
      
      const [existing] = await db.select().from(keuanganPrivat).where(
        and(
          eq(keuanganPrivat.idSantriPrivat, s.id),
          eq(keuanganPrivat.bulan, bulan),
          eq(keuanganPrivat.tahun, tahun)
        )
      );
      
      if (!existing) {
        await db.insert(keuanganPrivat).values({
          id: uuidv4(),
          idSantriPrivat: s.id,
          bulan,
          tahun,
          nominalTagihan: tagihan,
          status: 'belum_lunas'
        });
        tagihanDibuat++;
      }
    }
    
    revalidatePath("/admin-keuangan/privat");
    return { success: true, message: \`\${tagihanDibuat} tagihan berhasil di-generate.\` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}`;

const startIndex = content.indexOf("export async function generateTagihanBulanan");
const endIndex = content.indexOf("export async function bayarTagihan");

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + newGenerator + "\n\n" + content.substring(endIndex);
  fs.writeFileSync(file, content);
  console.log("Updated generateTagihanBulanan!");
} else {
  console.error("Could not find function bounds.");
}

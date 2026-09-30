import 'dotenv/config';
import { db } from '../../../src/db';
import { santriPrivat, keuanganPrivat, absensiPrivat } from '../../../src/db/schema';

async function main() {
  const santri = await db.select().from(santriPrivat);
  const keuangan = await db.select().from(keuanganPrivat);
  const absensi = await db.select().from(absensiPrivat);

  console.log('Santri count:', santri.length);
  console.log('Keuangan count:', keuangan.length);
  console.log('Absensi count:', absensi.length);

  console.log('\n--- Keuangan records ---');
  for (const k of keuangan) {
    console.log(`ID: ${k.id}, Santri: ${k.idSantriPrivat}, Bulan: ${k.bulan}, Tahun: ${k.tahun}, Nominal: ${k.nominalTagihan}, Status: ${k.status}, Lunas: ${k.tanggalLunas}`);
  }

  console.log('\n--- Santri records ---');
  for (const s of santri) {
    console.log(`ID: ${s.id}, Nama: ${s.namaLengkap}, Status: ${s.statusSantri}, Nominal: ${s.nominalTagihanBulanan}`);
  }
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
  process.exit(1);
});

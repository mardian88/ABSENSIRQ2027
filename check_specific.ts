import { db } from "./src/db";
import { perizinanSantri } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function checkNames() {
  const result = await db.select().from(perizinanSantri).orderBy(sql`${perizinanSantri.waktuPengajuan} DESC`).limit(5);
  
  for (const row of result) {
    const fmt = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' });
    console.log(`UI Pengajuan: ${fmt.format(row.waktuPengajuan)} | UI Mulai: ${fmt.format(row.tanggalMulai)} | Raw: ${row.waktuPengajuan.toISOString()}`);
  }
}

checkNames();

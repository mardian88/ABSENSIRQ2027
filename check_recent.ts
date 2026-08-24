import { db } from "./src/db";
import { perizinanSantri } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function checkNames() {
  const result = await db.select().from(perizinanSantri);
  for (const row of result) {
    if (row.waktuPengajuan.getTime() > new Date('2026-08-23').getTime()) {
      console.log(`Mulai: ${row.tanggalMulai.toISOString()} - Pengajuan: ${row.waktuPengajuan.toISOString()}`);
    }
  }
}

checkNames();

import { db } from "./src/db";
import { perizinanSantri } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function checkTime() {
  const result = await db.select().from(perizinanSantri);
  for (const row of result) {
    console.log(`ID: ${row.idSantri}, Mulai: ${row.tanggalMulai.toISOString()}, Pengajuan: ${row.waktuPengajuan.toISOString()}`);
  }
}

checkTime();

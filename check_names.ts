import { db } from "./src/db";
import { perizinanSantri, santri } from "./src/db/schema";
import { sql, eq } from "drizzle-orm";

async function checkNames() {
  const result = await db.select().from(perizinanSantri).innerJoin(santri, eq(perizinanSantri.idSantri, santri.id));
  for (const row of result) {
    if (["Binar Lituhayu Abhitah", "Muhammad Kahfi Al Azzam", "Muhammad Fajar Habibie"].includes(row.santri.namaLengkap)) {
      console.log(`${row.santri.namaLengkap} - Mulai: ${row.perizinan_santri.tanggalMulai.toISOString()} - Pengajuan: ${row.perizinan_santri.waktuPengajuan.toISOString()}`);
    }
  }
}

checkNames();

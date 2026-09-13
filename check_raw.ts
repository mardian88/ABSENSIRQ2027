import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function checkRaw() {
  const result = await db.all(sql`SELECT tanggal_mulai, waktu_pengajuan FROM perizinan_santri`);
  console.log(result);
}

checkRaw();

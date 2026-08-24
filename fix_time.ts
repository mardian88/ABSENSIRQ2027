import { db } from "./src/db";
import { perizinanSantri } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function fixTime() {
  // Subtract 7 hours from waktuPengajuan (since it was saved +7 hours ahead in UTC)
  // SQLite datetime manipulation: datetime(waktuPengajuan / 1000, 'unixepoch', '-7 hours')
  // Wait, Turso stores dates as integer timestamps in milliseconds!
  // So we just subtract 7 * 60 * 60 * 1000 = 25200000 milliseconds
  await db.run(sql`UPDATE perizinan_santri SET waktu_pengajuan = waktu_pengajuan - 25200000;`);
  console.log("Fixed waktuPengajuan");
}

fixTime();

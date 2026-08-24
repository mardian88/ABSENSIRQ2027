import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function fixTime() {
  // 1. ADD back the 25.2 million seconds to ALL rows to undo the catastrophe
  await db.run(sql`UPDATE perizinan_santri SET waktu_pengajuan = waktu_pengajuan + 25200000;`);
  
  // 2. Subtract 25200 seconds (7 hours) from rows created before 1787593320 (Aug 24 17:42 UTC)
  // This fixes the original bug!
  await db.run(sql`UPDATE perizinan_santri SET waktu_pengajuan = waktu_pengajuan - 25200 WHERE waktu_pengajuan < 1787593320;`);
  
  console.log("Fixed DB time properly!");
}

fixTime();

import { db } from "./src/db";
import { perizinanSantri } from "./src/db/schema";
import { sql } from "drizzle-orm";

async function checkDate() {
  const result = await db.select().from(perizinanSantri).limit(1);
  console.log(result[0].waktuPengajuan.toISOString());
}

checkDate();

import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function drop() {
  console.log("Dropping tables...");
  await db.run(sql`DROP TABLE IF EXISTS raport_capaian_surah;`);
  await db.run(sql`DROP TABLE IF EXISTS raport_santri;`);
  await db.run(sql`DROP TABLE IF EXISTS pengaturan_catatan_preset;`);
  await db.run(sql`DROP TABLE IF EXISTS pengaturan_predikat_raport;`);
  await db.run(sql`DROP TABLE IF EXISTS surah_master;`);
  await db.run(sql`DROP TABLE IF EXISTS pengaturan_semester;`);
  console.log("Tables dropped.");
}
drop().catch(console.error);

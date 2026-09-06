import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function run() {
  try {
    const tables = await db.all(sql.raw(`SELECT name FROM sqlite_master WHERE type='table';`));
    console.log("Tables in DB:", tables.map(t => (t as any).name).join(", "));
    
    // Check pengaturan_raport schema
    const schema = await db.all(sql.raw(`PRAGMA table_info(pengaturan_raport);`));
    console.log("Schema for pengaturan_raport:", schema);
  } catch (error) {
    console.error("DB Error:", error);
  }
}

run();

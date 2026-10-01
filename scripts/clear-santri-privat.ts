import { config } from "dotenv";
config({ path: ".env" });

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { santriPrivat, absensiPrivat, keuanganPrivat } from "./src/db/schema";

async function clearTursoData() {
  console.log("Menghubungkan ke Turso:", process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL || process.env.DATABASE_URL === "file:./sqlite.db") {
    console.error("URL Database tidak valid. Pastikan .env terbaca.");
    return;
  }

  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  const db = drizzle(client);

  try {
    console.log("Menghapus data absensi_privat...");
    await db.delete(absensiPrivat);
    
    console.log("Menghapus data keuangan_privat...");
    await db.delete(keuanganPrivat);
    
    console.log("Menghapus data santri_privat...");
    await db.delete(santriPrivat);
    
    console.log("Semua data dummy berhasil dihapus dari Turso!");
  } catch (error) {
    console.error("Error menghapus data:", error);
  }
}

clearTursoData();

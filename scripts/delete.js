const { config } = require("dotenv");
config({ path: ".env" });

const { createClient } = require("@libsql/client");

async function clearTursoData() {
  console.log("Menghubungkan ke Turso:", process.env.DATABASE_URL);
  
  if (!process.env.DATABASE_URL) {
    console.error("URL Database tidak valid. Pastikan .env terbaca.");
    return;
  }

  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  try {
    console.log("Menghapus data absensi_privat...");
    await client.execute("DELETE FROM absensi_privat");
    
    console.log("Menghapus data keuangan_privat...");
    await client.execute("DELETE FROM keuangan_privat");
    
    console.log("Menghapus data santri_privat...");
    await client.execute("DELETE FROM santri_privat");
    
    console.log("Semua data dummy berhasil dihapus dari Turso!");
  } catch (error) {
    console.error("Error menghapus data:", error);
  }
}

clearTursoData();

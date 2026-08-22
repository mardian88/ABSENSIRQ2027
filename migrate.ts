import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN!,
});

async function main() {
  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS program_donasi (
        id TEXT PRIMARY KEY,
        judul TEXT NOT NULL,
        deskripsi TEXT,
        target_nominal INTEGER NOT NULL DEFAULT 0,
        terkumpul INTEGER NOT NULL DEFAULT 0,
        url_gambar TEXT,
        is_aktif INTEGER NOT NULL DEFAULT 1,
        waktu_dibuat INTEGER NOT NULL
      )
    `);
    console.log("Created program_donasi table");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS transaksi_donasi (
        id TEXT PRIMARY KEY,
        id_program TEXT NOT NULL REFERENCES program_donasi(id),
        id_santri TEXT NOT NULL REFERENCES santri(id),
        nominal INTEGER NOT NULL,
        metode TEXT NOT NULL DEFAULT 'QRIS',
        status TEXT NOT NULL DEFAULT 'menunggu',
        is_anonim INTEGER NOT NULL DEFAULT 0,
        doa TEXT,
        waktu_dibuat INTEGER NOT NULL,
        waktu_verifikasi INTEGER
      )
    `);
    console.log("Created transaksi_donasi table");

  } catch (err) {
    console.error(err);
  }
}

main();

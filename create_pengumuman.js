require('dotenv').config();
const { createClient } = require('@libsql/client');

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN
  });

  try {
    await client.execute(`
      CREATE TABLE IF NOT EXISTS pengumuman_portal (
        id TEXT PRIMARY KEY,
        judul TEXT NOT NULL,
        isi TEXT NOT NULL,
        tanggal INTEGER NOT NULL,
        is_aktif INTEGER NOT NULL DEFAULT 1,
        id_admin TEXT REFERENCES user(id)
      );
    `);
    console.log("Table pengumuman_portal created successfully");
  } catch(e) {
    console.error("Error", e);
  }
}

main();

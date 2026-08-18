require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function run() {
  try {
    console.log('Connecting to Turso...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS notifikasi_portal (
        id TEXT PRIMARY KEY,
        id_santri TEXT NOT NULL REFERENCES santri(id),
        judul TEXT NOT NULL,
        isi TEXT NOT NULL,
        jenis TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        tanggal INTEGER NOT NULL
      )
    `);
    console.log('notifikasi_portal table created successfully in Turso!');
  } catch (error) {
    console.error('Error:', error);
  }
}

run();

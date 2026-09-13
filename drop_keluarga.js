require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function run() {
  try {
    console.log('Connecting to Turso...');
    await client.execute('DROP TABLE IF EXISTS keluarga');
    await client.execute(`
      CREATE TABLE keluarga (
        id TEXT PRIMARY KEY,
        nama_wali TEXT NOT NULL,
        nomor_whatsapp TEXT,
        alamat TEXT
      )
    `);
    console.log('Keluarga table created successfully in Turso!');
  } catch (error) {
    console.error('Error:', error);
  }
}

run();

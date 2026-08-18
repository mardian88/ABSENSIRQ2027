require('dotenv').config();
const { createClient } = require('@libsql/client');

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN
  });

  try {
    await client.execute("DROP TABLE keuangan_topup;");
    await client.execute(`
      CREATE TABLE keuangan_topup (
        id TEXT PRIMARY KEY,
        id_santri TEXT NOT NULL REFERENCES santri(id),
        nominal INTEGER NOT NULL,
        metode TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        bukti_url TEXT,
        tanggal_ajuan INTEGER NOT NULL,
        id_admin TEXT REFERENCES user(id)
      );
    `);
    console.log("Table keuangan_topup recreated successfully");
  } catch(e) {
    console.error("Error", e);
  }
}

main();

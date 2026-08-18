const { createClient } = require('@libsql/client');

async function main() {
  const client = createClient({
    url: 'file:sqlite.db',
  });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS keuangan_topup (
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

  console.log("Table keuangan_topup created successfully");
}

main().catch(console.error);

require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function run() {
  try {
    console.log('Connecting to Turso...');
    
    // 1. Add id_topup to keuangan_kas (ignore error if already exists)
    try {
      await client.execute(`ALTER TABLE keuangan_kas ADD COLUMN id_topup TEXT;`);
      console.log('Added id_topup to keuangan_kas');
    } catch (e) {
      console.log('id_topup might already exist in keuangan_kas or error:', e.message);
    }

    // 2. Add id_topup to keuangan_tabungan
    try {
      await client.execute(`ALTER TABLE keuangan_tabungan ADD COLUMN id_topup TEXT;`);
      console.log('Added id_topup to keuangan_tabungan');
    } catch (e) {
      console.log('id_topup might already exist in keuangan_tabungan or error:', e.message);
    }

    // 3. Create keuangan_infaq table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS keuangan_infaq (
        id TEXT PRIMARY KEY,
        id_santri TEXT NOT NULL REFERENCES santri(id),
        jenis TEXT NOT NULL DEFAULT 'infaq',
        bulan INTEGER NOT NULL,
        tahun INTEGER NOT NULL,
        nominal INTEGER NOT NULL,
        tanggal_bayar INTEGER,
        status TEXT NOT NULL DEFAULT 'belum_lunas',
        id_penerima TEXT REFERENCES user(id),
        id_tagihan TEXT REFERENCES pengaturan_keuangan(id),
        metode_bayar TEXT,
        id_topup TEXT
      );
    `);
    console.log('Created keuangan_infaq table');

    // 4. Move data from keuangan_kas to keuangan_infaq
    const result = await client.execute(`
      INSERT INTO keuangan_infaq (id, id_santri, jenis, bulan, tahun, nominal, tanggal_bayar, status, id_penerima, id_tagihan, metode_bayar, id_topup)
      SELECT id, id_santri, jenis, bulan, tahun, nominal, tanggal_bayar, status, id_penerima, id_tagihan, metode_bayar, id_topup 
      FROM keuangan_kas 
      WHERE jenis = 'infaq';
    `);
    console.log(`Moved ${result.rowsAffected} infaq rows to keuangan_infaq`);

    // 5. Delete infaq data from keuangan_kas
    const delResult = await client.execute(`
      DELETE FROM keuangan_kas WHERE jenis = 'infaq';
    `);
    console.log(`Deleted ${delResult.rowsAffected} infaq rows from keuangan_kas`);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Fatal Error:', error);
  }
}

run();

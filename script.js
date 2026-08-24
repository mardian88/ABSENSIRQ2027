const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function run() {
  const result = await client.execute("SELECT id, nama_lengkap, kontak_ortu FROM santri WHERE nomor_induk = '02661806'");
  console.log(result.rows);
}
run();

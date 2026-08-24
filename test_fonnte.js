const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function run() {
  try {
    console.log('Altering log_pesan_manual...');
    await client.execute(`ALTER TABLE log_pesan_manual ADD COLUMN jenis TEXT NOT NULL DEFAULT 'belum_hadir'`);
    console.log('Success altering log_pesan_manual!');
  } catch (e) {
    console.error('Error altering:', e);
  }
}
run();

import { createClient } from '@libsql/client';
import 'dotenv/config';

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function run() {
  try {
    await client.execute('ALTER TABLE keuangan_kas ADD COLUMN id_tagihan TEXT REFERENCES pengaturan_keuangan(id)');
    console.log('Added id_tagihan');
  } catch(e) {
    console.error(e);
  }
  
  try {
    await client.execute('ALTER TABLE keuangan_kas ADD COLUMN metode_bayar TEXT');
    console.log('Added metode_bayar');
  } catch(e) {
    console.error(e);
  }
  console.log('success');
}
run();

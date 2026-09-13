const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
  try {
    console.log('Testing insert notifikasi_guru...');
    await client.execute({
      sql: 'INSERT INTO notifikasi_guru (id, id_guru, judul, isi, jenis, is_read, tanggal) VALUES (?, ?, ?, ?, ?, ?, ?)',
      args: ['test_notif_1', 'random_guru_id_not_in_user', 'test', 'test', 'pengumuman', 0, Date.now()]
    });
    console.log('Success insert notifikasi_guru!');
  } catch (e) {
    console.error('Error insert notifikasi_guru:', e);
  }
}
run();

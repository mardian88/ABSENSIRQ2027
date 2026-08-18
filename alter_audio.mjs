import { createClient } from '@libsql/client';
import 'dotenv/config';

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function run() {
  const columns = [
    { name: 'url_audio_masuk', type: 'TEXT' },
    { name: 'is_audio_masuk_aktif', type: 'INTEGER DEFAULT 1' },
    { name: 'url_audio_pulang', type: 'TEXT' },
    { name: 'is_audio_pulang_aktif', type: 'INTEGER DEFAULT 1' },
    { name: 'url_audio_gagal', type: 'TEXT' },
    { name: 'is_audio_gagal_aktif', type: 'INTEGER DEFAULT 1' }
  ];

  for (const col of columns) {
    try {
      await client.execute(`ALTER TABLE pengaturan_absensi_global ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added ${col.name}`);
    } catch(e) {
      console.log(`Failed or already exists: ${col.name}`);
    }
  }
  console.log('Done altering table');
}

run();

import { db } from './src/db/index';

async function main() {
  await db.run(`CREATE TABLE IF NOT EXISTS pengaturan_hari_aktif (id TEXT PRIMARY KEY, hari TEXT NOT NULL, is_aktif INTEGER DEFAULT 1)`);
  await db.run(`CREATE TABLE IF NOT EXISTS hari_libur (id TEXT PRIMARY KEY, tanggal TEXT NOT NULL, keterangan TEXT NOT NULL, is_aktif INTEGER DEFAULT 1)`);
  await db.run(`CREATE TABLE IF NOT EXISTS pengaturan_absensi_global (id TEXT PRIMARY KEY, is_auto_alpa_aktif INTEGER DEFAULT 0)`);
  console.log('Tables created');
  process.exit(0);
}

main();

import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function migrate() {
  console.log("Creating tables...");

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS pengaturan_semester (
      id TEXT PRIMARY KEY,
      nama TEXT NOT NULL,
      tahun_ajaran TEXT NOT NULL,
      is_aktif INTEGER NOT NULL DEFAULT 0,
      waktu_dibuat INTEGER NOT NULL
    );
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS surah_master (
      id TEXT PRIMARY KEY,
      juz INTEGER NOT NULL,
      nomor_surah INTEGER NOT NULL,
      nama_surah TEXT NOT NULL,
      nama_arab TEXT NOT NULL,
      jumlah_ayat INTEGER NOT NULL,
      tipe TEXT NOT NULL,
      urutan_dalam_juz INTEGER NOT NULL
    );
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS pengaturan_predikat_raport (
      id TEXT PRIMARY KEY,
      jenis TEXT NOT NULL,
      rentang_min INTEGER NOT NULL,
      rentang_max INTEGER NOT NULL,
      predikat TEXT NOT NULL
    );
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS pengaturan_catatan_preset (
      id TEXT PRIMARY KEY,
      jenis TEXT NOT NULL,
      isi_catatan TEXT NOT NULL
    );
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS raport_santri (
      id TEXT PRIMARY KEY,
      id_santri TEXT NOT NULL REFERENCES santri(id),
      id_semester TEXT NOT NULL REFERENCES pengaturan_semester(id),
      id_halaqah TEXT REFERENCES halaqoh(id),
      catatan_wali_kelas TEXT,
      waktu_dibuat INTEGER NOT NULL,
      diperbarui_pada INTEGER NOT NULL
    );
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS raport_capaian_surah (
      id TEXT PRIMARY KEY,
      id_raport TEXT NOT NULL REFERENCES raport_santri(id),
      id_surah TEXT NOT NULL REFERENCES surah_master(id),
      status_setoran TEXT,
      nilai_kb INTEGER,
      predikat_kb TEXT,
      catatan_kb TEXT,
      nilai_kh INTEGER,
      predikat_kh TEXT,
      catatan_kh TEXT,
      tanggal_ujian TEXT,
      is_verifikasi INTEGER NOT NULL DEFAULT 0
    );
  `);

  console.log("Migration complete!");
}

migrate().catch(console.error);

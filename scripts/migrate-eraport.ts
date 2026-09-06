import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Migrating new e-raport tables...");

  const queries = [
    `CREATE TABLE IF NOT EXISTS tahun_ajaran (
      id TEXT PRIMARY KEY,
      nama TEXT NOT NULL,
      is_aktif INTEGER NOT NULL DEFAULT 0,
      waktu_dibuat INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS semester (
      id TEXT PRIMARY KEY,
      id_tahun_ajaran TEXT NOT NULL REFERENCES tahun_ajaran(id),
      nama TEXT NOT NULL,
      is_aktif INTEGER NOT NULL DEFAULT 0,
      jumlah_hari_efektif INTEGER NOT NULL DEFAULT 0,
      waktu_dibuat INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS surah_master (
      id TEXT PRIMARY KEY,
      juz INTEGER NOT NULL,
      nomor_surah INTEGER NOT NULL,
      nama_surah TEXT NOT NULL,
      nama_arab TEXT NOT NULL,
      jumlah_ayat INTEGER NOT NULL,
      tipe TEXT NOT NULL,
      urutan_dalam_juz INTEGER NOT NULL,
      is_aktif INTEGER NOT NULL DEFAULT 1
    );`,
    `CREATE TABLE IF NOT EXISTS tahsin_master (
      id TEXT PRIMARY KEY,
      nama_item TEXT NOT NULL,
      urutan INTEGER NOT NULL,
      id_halaqah TEXT REFERENCES halaqoh(id),
      is_aktif INTEGER NOT NULL DEFAULT 1
    );`,
    `CREATE TABLE IF NOT EXISTS penugasan_guru (
      id TEXT PRIMARY KEY,
      id_guru TEXT NOT NULL REFERENCES guru(id),
      id_halaqah TEXT NOT NULL REFERENCES halaqoh(id),
      subject TEXT NOT NULL,
      role TEXT NOT NULL,
      is_aktif INTEGER NOT NULL DEFAULT 1
    );`,
    `CREATE TABLE IF NOT EXISTS santri_surah (
      id TEXT PRIMARY KEY,
      id_santri TEXT NOT NULL REFERENCES santri(id),
      id_surah TEXT NOT NULL REFERENCES surah_master(id),
      is_aktif INTEGER NOT NULL DEFAULT 1
    );`,
    `CREATE TABLE IF NOT EXISTS pengaturan_raport (
      id TEXT PRIMARY KEY,
      nama_lembaga TEXT NOT NULL,
      alamat_lembaga TEXT NOT NULL,
      kontak_lembaga TEXT NOT NULL,
      nama_kepala TEXT NOT NULL,
      nip_kepala TEXT,
      logo_url TEXT,
      ttd_kepala_url TEXT,
      bobot_akhlak INTEGER NOT NULL DEFAULT 20,
      bobot_kedisiplinan INTEGER NOT NULL DEFAULT 20,
      bobot_kognitif INTEGER NOT NULL DEFAULT 60,
      skala_penilaian TEXT NOT NULL,
      show_uas_lisan INTEGER NOT NULL DEFAULT 1
    );`,
    `CREATE TABLE IF NOT EXISTS raport_santri (
      id TEXT PRIMARY KEY,
      id_santri TEXT NOT NULL REFERENCES santri(id),
      id_semester TEXT NOT NULL REFERENCES semester(id),
      id_halaqah TEXT REFERENCES halaqoh(id),
      akhlak TEXT,
      kedisiplinan TEXT,
      kognitif TEXT,
      sakit INTEGER NOT NULL DEFAULT 0,
      izin INTEGER NOT NULL DEFAULT 0,
      alpa INTEGER NOT NULL DEFAULT 0,
      jumlah_hari_efektif INTEGER NOT NULL DEFAULT 0,
      nilai_akhir_akhlak INTEGER,
      nilai_akhir_kedisiplinan INTEGER,
      nilai_akhir_kognitif INTEGER,
      nilai_akhir_total INTEGER,
      predikat_total TEXT,
      catatan_wali_kelas TEXT,
      waktu_dibuat INTEGER NOT NULL,
      diperbarui_pada INTEGER NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS raport_tahfidz_progress (
      id TEXT PRIMARY KEY,
      id_raport TEXT NOT NULL REFERENCES raport_santri(id),
      id_surah TEXT NOT NULL REFERENCES surah_master(id),
      status_setoran TEXT,
      nilai_kb INTEGER,
      predikat_kb TEXT,
      catatan_kb TEXT,
      nilai_kh INTEGER,
      predikat_kh TEXT,
      catatan_kh TEXT
    );`
  ];

  for (const q of queries) {
    await db.run(sql.raw(q));
  }
  console.log("Migration complete.");
}

run().catch(console.error);

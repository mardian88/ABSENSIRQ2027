const fs = require('fs');
let f = fs.readFileSync('src/db/schema.ts', 'utf8');
f = f.replace(`export const pengaturanAbsensiGlobal = sqliteTable('pengaturan_absensi_global', {
  id: text('id').primaryKey(),
  isAutoAlpaAktif: integer('is_auto_alpa_aktif', { mode: 'boolean' }).default(false)
});`, `export const pengaturanAbsensiGlobal = sqliteTable('pengaturan_absensi_global', {
  id: text('id').primaryKey(),
  isAutoAlpaAktif: integer('is_auto_alpa_aktif', { mode: 'boolean' }).default(false),
  urlAudioMasuk: text('url_audio_masuk'),
  isAudioMasukAktif: integer('is_audio_masuk_aktif', { mode: 'boolean' }).default(true),
  urlAudioPulang: text('url_audio_pulang'),
  isAudioPulangAktif: integer('is_audio_pulang_aktif', { mode: 'boolean' }).default(true),
  urlAudioGagal: text('url_audio_gagal'),
  isAudioGagalAktif: integer('is_audio_gagal_aktif', { mode: 'boolean' }).default(true)
});`);
fs.writeFileSync('src/db/schema.ts', f);

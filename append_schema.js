const fs = require('fs');

const data = `
// ==========================================
// MODUL KEUANGAN
// ==========================================

export const keluarga = sqliteTable('keluarga', {
  id: text('id').primaryKey(),
  namaWali: text('nama_wali').notNull(),
  nomorWhatsapp: text('nomor_whatsapp'),
  alamat: text('alamat')
});

export const pengaturanKeuangan = sqliteTable('pengaturan_keuangan', {
  id: text('id').primaryKey(),
  kode: text('kode').unique(), 
  namaPembayaran: text('nama_pembayaran').notNull(),
  nominalDefault: integer('nominal_default').notNull(),
  nominalSaudara: integer('nominal_saudara').notNull().default(0),
  diperbaruiPada: integer('diperbarui_pada', { mode: 'timestamp' }).notNull()
});

export const keuanganKas = sqliteTable('keuangan_kas', {
  id: text('id').primaryKey(),
  idSantri: text('id_santri').references(() => santri.id).notNull(),
  bulan: integer('bulan').notNull(), // 1-12
  tahun: integer('tahun').notNull(),
  nominal: integer('nominal').notNull(),
  tanggalBayar: integer('tanggal_bayar', { mode: 'timestamp' }),
  status: text('status').notNull().default('belum_lunas'), // belum_lunas, lunas
  idPenerima: text('id_penerima').references(() => user.id), // Admin yang menerima pembayaran
  idTagihan: text('id_tagihan').references(() => pengaturanKeuangan.id),
  metodeBayar: text('metode_bayar'), // tunai, potong_saldo, transfer, qris
});

export const keuanganTabungan = sqliteTable('keuangan_tabungan', {
  id: text('id').primaryKey(),
  idSantri: text('id_santri').references(() => santri.id).notNull(),
  jenis: text('jenis').notNull(), // setor, tarik, topup, belanja
  nominal: integer('nominal').notNull(),
  keterangan: text('keterangan').notNull(),
  tanggal: integer('tanggal', { mode: 'timestamp' }).notNull(),
  idAdmin: text('id_admin').references(() => user.id) // Null jika topup/belanja via portal
});

export const keuanganBukuKas = sqliteTable('keuangan_buku_kas', {
  id: text('id').primaryKey(),
  jenis: text('jenis').notNull(), // pemasukan, pengeluaran
  kategori: text('kategori').notNull(),
  nominal: integer('nominal').notNull(),
  keterangan: text('keterangan'),
  tanggal: integer('tanggal', { mode: 'timestamp' }).notNull(),
  idAdmin: text('id_admin').references(() => user.id)
});

export const keuanganTopup = sqliteTable('keuangan_topup', {
  id: text('id').primaryKey(),
  idSantri: text('id_santri').references(() => santri.id).notNull(),
  nominal: integer('nominal').notNull(),
  metode: text('metode').notNull(), // transfer, qris, tunai
  status: text('status').notNull().default('pending'), // pending, success, failed
  buktiUrl: text('bukti_url'),
  tanggalAjuan: integer('tanggal_ajuan', { mode: 'timestamp' }).notNull(),
  idAdmin: text('id_admin').references(() => user.id),
  jenisPembayaran: text('jenis_pembayaran'), // topup_tabungan, kas, infaq, kas_infaq
  bulanTarget: integer('bulan_target'),
  tahunTarget: integer('tahun_target'),
  angkaUnik: integer('angka_unik'),
  batasWaktu: integer('batas_waktu', { mode: 'timestamp' })
});

export const pengumumanPortal = sqliteTable('pengumuman_portal', {
  id: text('id').primaryKey(),
  judul: text('judul').notNull(),
  isi: text('isi').notNull(),
  status: text('status').notNull().default('aktif'), // aktif, tidak_aktif
  tanggal: integer('tanggal', { mode: 'timestamp' }).notNull(),
  idAdmin: text('id_admin').references(() => user.id)
});
`;

fs.appendFileSync('src/db/schema.ts', data);
console.log('Appended to schema.ts');

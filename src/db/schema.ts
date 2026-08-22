import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const pengurus = sqliteTable('pengurus', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull(),
  email: text('email').notNull().unique(),
  kataSandi: text('kata_sandi').notNull(),
  peran: text('peran').notNull()
});

export const pengaturanProfil = sqliteTable('pengaturan_profil', {
  id: text('id').primaryKey(),
  namaRumahQuran: text('nama_rumah_quran').notNull().default('Rumah Qur\'an'),
  urlLogo: text('url_logo'),
  warnaTema: text('warna_tema'),
  passwordAbsensi: text('password_absensi'),
  isPsbAktif: integer('is_psb_aktif', { mode: 'boolean' }).default(true),
  isCountdownAktif: integer('is_countdown_aktif', { mode: 'boolean' }).default(false),
  batasWaktuPsb: integer('batas_waktu_psb', { mode: 'timestamp' })
});

export const halaqoh = sqliteTable('halaqoh', {
  id: text('id').primaryKey(),
  namaHalaqoh: text('nama_halaqoh').notNull(),
  namaPengajar: text('nama_pengajar').notNull(),
  kontakPengajar: text('kontak_pengajar'), // Nomor WA Guru (legacy)
  idGuru: text('id_guru'), // Foreign key to guru.id (new, optional for backward compatibility)
  idSesiAbsensi: text('id_sesi_absensi').references(() => sesiAbsensi.id),
});

// ==========================================
// MODUL GURU & PENGURUS (HRIS)
// ==========================================

export const guru = sqliteTable('guru', {
  id: text('id').primaryKey(),
  nip: text('nip').notNull().unique(), // Nomor Induk Pengurus
  namaLengkap: text('nama_lengkap').notNull(),
  jenisKelamin: text('jenis_kelamin'),
  tempatLahir: text('tempat_lahir'),
  tanggalLahir: text('tanggal_lahir'),
  alamat: text('alamat'),
  kontakWa: text('kontak_wa').notNull(),
  urlFotoWajah: text('url_foto_wajah'),
  dataVektorWajah: text('data_vektor_wajah'),
  kodeQr: text('kode_qr').unique(),
  statusAktif: integer('status_aktif', { mode: 'boolean' }).default(true),
  tanggalMasuk: integer('tanggal_masuk', { mode: 'timestamp' }),
});

export const kontrakGuru = sqliteTable('kontrak_guru', {
  id: text('id').primaryKey(),
  idGuru: text('id_guru').references(() => guru.id).notNull(),
  jabatan: text('jabatan').notNull(),
  jenisKontrak: text('jenis_kontrak').notNull().default('temporer'), // permanen, temporer
  tanggalMulai: integer('tanggal_mulai', { mode: 'timestamp' }),
  tanggalSelesai: integer('tanggal_selesai', { mode: 'timestamp' }),
  satuanKafalah: real('satuan_kafalah').notNull().default(0), // Gaji/Fee per kehadiran
  statusKontrak: text('status_kontrak').notNull().default('menunggu_ttd'), // menunggu_ttd, aktif, selesai
  eSignUrl: text('e_sign_url'), // TTD Digital dari Cloudinary
  dokumenUrl: text('dokumen_url'), // PDF Kontrak
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const absensiGuru = sqliteTable('absensi_guru', {
  id: text('id').primaryKey(),
  idGuru: text('id_guru').references(() => guru.id).notNull(),
  waktuScan: integer('waktu_scan', { mode: 'timestamp' }).notNull(),
  metodeScan: text('metode_scan').notNull(), // wajah, qr, manual
  statusKehadiran: text('status_kehadiran').notNull(), // hadir, terlambat, dll
  jenisAbsen: text('jenis_absen').notNull(), // masuk / pulang
  isArchived: integer('is_archived').notNull().default(0),
});

export const kafalahBonus = sqliteTable('kafalah_bonus', {
  id: text('id').primaryKey(),
  idGuru: text('id_guru').references(() => guru.id).notNull(),
  jenis: text('jenis').notNull(), // bonus / potongan
  nominal: real('nominal').notNull(),
  keterangan: text('keterangan').notNull(),
  tanggalDiberikan: integer('tanggal_diberikan', { mode: 'timestamp' }).notNull()
});


export const sesiAbsensi = sqliteTable('sesi_absensi', {
  id: text('id').primaryKey(),
  namaSesi: text('nama_sesi').notNull(),
  waktuMulaiMasuk: text('waktu_mulai_masuk').notNull(), // Format HH:mm
  waktuBatasMasuk: text('waktu_batas_masuk').notNull(), // Lewat dari ini jadi Terlambat
  waktuMulaiPulang: text('waktu_mulai_pulang').notNull(),
  waktuNormalPulang: text('waktu_normal_pulang').notNull(), // Sebelum ini jadi Pulang Cepat
  waktuTutup: text('waktu_tutup').notNull() // Mesin absen tidak bisa digunakan setelah ini
});

export const santri = sqliteTable('santri', {
  id: text('id').primaryKey(),
  nomorInduk: text('nomor_induk').notNull().unique(),
  namaLengkap: text('nama_lengkap').notNull(),
  idHalaqoh: text('id_halaqoh').references(() => halaqoh.id),
  idSesiAbsensi: text('id_sesi_absensi').references(() => sesiAbsensi.id),
  kontakOrtu: text('kontak_ortu').notNull(),
  urlFotoWajah: text('url_foto_wajah'),
  dataVektorWajah: text('data_vektor_wajah'),
  kodeQr: text('kode_qr').unique(),
  statusSantri: text('status_santri').notNull().default('aktif'),
  idCabang: text('id_cabang'), // Fase 4: Referensi cabang

  
  // --- Extended fields from PSB ---
  tempatLahir: text('tempat_lahir'),
  tanggalLahir: text('tanggal_lahir'), // ISO Date String format YYYY-MM-DD
  jenisKelamin: text('jenis_kelamin'), // Laki-laki / Perempuan
  alamatLengkap: text('alamat_lengkap'),
  isAlamatDomisiliSama: integer('is_alamat_domisili_sama', { mode: 'boolean' }).default(true),
  alamatDomisili: text('alamat_domisili'),
  jenjangSekolah: text('jenjang_sekolah'),
  jenjangSekolahLainnya: text('jenjang_sekolah_lainnya'),
  namaSekolah: text('nama_sekolah'),
  kelasSekolah: text('kelas_sekolah'),
  ikutLes: integer('ikut_les', { mode: 'boolean' }).default(false),
  hariLes: text('hari_les'),
  jamLesMulai: text('jam_les_mulai'),
  jamLesSelesai: text('jam_les_selesai'),
  namaAyah: text('nama_ayah'),
  pekerjaanAyah: text('pekerjaan_ayah'),
  pekerjaanAyahLainnya: text('pekerjaan_ayah_lainnya'),
  instansiAyah: text('instansi_ayah'),
  namaIbu: text('nama_ibu'),
  pekerjaanIbu: text('pekerjaan_ibu'),
  pekerjaanIbuLainnya: text('pekerjaan_ibu_lainnya'),
  instansiIbu: text('instansi_ibu'),
  idKeluarga: text('id_keluarga').references(() => keluarga.id),
  adaSaudara: integer('ada_saudara', { mode: 'boolean' }).default(false),
  saldoTabungan: integer('saldo_tabungan').default(0),
});

export const fonnteTokens = sqliteTable('fonnte_tokens', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  token: text('token').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(false).notNull(),
  isExhausted: integer('is_exhausted', { mode: 'boolean' }).default(false).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
});

export const absensi = sqliteTable('absensi', {
  id: text('id').primaryKey(),
  idSantri: text('id_santri').references(() => santri.id).notNull(),
  waktuScan: integer('waktu_scan', { mode: 'timestamp' }).notNull(),
  metodeScan: text('metode_scan').notNull(),
  statusKehadiran: text('status_kehadiran').notNull(),
  jenisAbsen: text('jenis_absen').notNull(), // 'masuk' or 'pulang'
  isArchived: integer('is_archived').notNull().default(0), // 0: active, 1: archived (soft deleted)
});

export const poinSantri = sqliteTable('poin_santri', {
  id: text('id').primaryKey(),
  idSantri: text('id_santri').references(() => santri.id).notNull(),
  jenisCatatan: text('jenis_catatan').notNull(), // 'reward' or 'punishment'
  deskripsi: text('deskripsi').notNull(),
  poinDiberikan: integer('poin_diberikan').notNull(),
  tanggalKejadian: integer('tanggal_kejadian', { mode: 'timestamp' }).notNull()
});

export const pengaturanHumas = sqliteTable('pengaturan_humas', {
  id: text('id').primaryKey(),
  tokenFonnte: text('token_fonnte'),
  nomorAdmin: text('nomor_admin'), // WhatsApp Admin penerima notif
  isAktif: integer('is_aktif', { mode: 'boolean' }).default(false),
  nomorReminder: text('nomor_reminder'),
  isReminderAktif: integer('is_reminder_aktif', { mode: 'boolean' }).default(false)
});

export const logReminder = sqliteTable('log_reminder', {
  id: text('id').primaryKey(),
  idSantri: text('id_santri').references(() => santri.id).notNull(),
  tanggal: text('tanggal').notNull(), // Format YYYY-MM-DD
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const templatePesan = sqliteTable('template_pesan', {
  id: text('id').primaryKey(),
  jenisPesan: text('jenis_pesan').notNull(), // e.g. 'absen_masuk', 'absen_pulang'
  isiPesan: text('isi_pesan').notNull(),
  isAktif: integer('is_aktif', { mode: 'boolean' }).default(true)
});

export const pendaftar = sqliteTable('pendaftar', {
  id: text('id').primaryKey(),
  // A. Identitas Calon Santri
  namaLengkap: text('nama_lengkap').notNull(),
  tempatLahir: text('tempat_lahir').notNull().default('Garut'),
  tanggalLahir: text('tanggal_lahir').notNull(), // ISO Date String format YYYY-MM-DD
  jenisKelamin: text('jenis_kelamin').notNull(), // Laki-laki / Perempuan
  alamatLengkap: text('alamat_lengkap').notNull(),
  isAlamatDomisiliSama: integer('is_alamat_domisili_sama', { mode: 'boolean' }).default(true),
  alamatDomisili: text('alamat_domisili'),
  jenjangSekolah: text('jenjang_sekolah').notNull(), // TK, SD/MI, SMP/MTs, SMA/MA, Lainnya
  jenjangSekolahLainnya: text('jenjang_sekolah_lainnya'),
  namaSekolah: text('nama_sekolah'),
  kelasSekolah: text('kelas_sekolah'),
  ikutLes: integer('ikut_les', { mode: 'boolean' }).default(false),
  hariLes: text('hari_les'),
  jamLesMulai: text('jam_les_mulai'), // format HH:mm
  jamLesSelesai: text('jam_les_selesai'), // format HH:mm

  // B. Identitas Orang Tua/Wali
  namaAyah: text('nama_ayah').notNull(),
  pekerjaanAyah: text('pekerjaan_ayah').notNull(),
  pekerjaanAyahLainnya: text('pekerjaan_ayah_lainnya'),
  instansiAyah: text('instansi_ayah'),
  namaIbu: text('nama_ibu').notNull(),
  pekerjaanIbu: text('pekerjaan_ibu').notNull(),
  pekerjaanIbuLainnya: text('pekerjaan_ibu_lainnya'),
  instansiIbu: text('instansi_ibu'),
  kontakOrtu: text('kontak_ortu').notNull(),

  // C. Capaian Mengaji
  sudahMengaji: integer('sudah_mengaji', { mode: 'boolean' }).default(false),
  bukuMengaji: text('buku_mengaji'), // Iqro atau Qur'an
  capaianMengaji: text('capaian_mengaji'),

  // D. Capaian Hafalan
  sudahMenghafal: integer('sudah_menghafal', { mode: 'boolean' }).default(false),
  capaianHafalan: text('capaian_hafalan'),

  // E. Sumber Informasi
  sumberInfo: text('sumber_info'),

  // Status & Metadata
  status: text('status').notNull().default('menunggu'), // 'menunggu', 'diterima', 'ditolak'
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  tanggalDaftar: integer('tanggal_daftar', { mode: 'timestamp' }).notNull()
});

// Fase 4: Autentikasi (Better Auth)
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  role: text("role").default("admin_cabang"),
  idCabang: text("idCabang"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id)
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull()
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" })
});


// Fase 4: Manajemen Cabang
export const cabang = sqliteTable('cabang', {
  id: text('id').primaryKey(),
  namaCabang: text('nama_cabang').notNull(),
  alamat: text('alamat')
});

export const sesi = sqliteTable('sesi', {
  id: text('id').primaryKey(),
  namaSesi: text('nama_sesi').notNull(), // Siang, Sore
  jamMulai: text('jam_mulai'),
  jamSelesai: text('jam_selesai')
});

// Fase 2: Pengaturan Hari Aktif & Auto-Alpa
export const pengaturanHariAktif = sqliteTable('pengaturan_hari_aktif', {
  id: text('id').primaryKey(), // akan menggunakan id 'senin', 'selasa', dst
  hari: text('hari').notNull(), // Senin, Selasa, Rabu, Kamis, Jumat, Sabtu, Minggu
  isAktif: integer('is_aktif', { mode: 'boolean' }).default(true)
});

export const hariLibur = sqliteTable('hari_libur', {
  id: text('id').primaryKey(),
  tanggal: text('tanggal').notNull(), // Format YYYY-MM-DD
  keterangan: text('keterangan').notNull(),
  isAktif: integer('is_aktif', { mode: 'boolean' }).default(true)
});

export const pengaturanAbsensiGlobal = sqliteTable('pengaturan_absensi_global', {
  id: text('id').primaryKey(),
  isAutoAlpaAktif: integer('is_auto_alpa_aktif', { mode: 'boolean' }).default(false),
  urlAudioMasuk: text('url_audio_masuk'),
  isAudioMasukAktif: integer('is_audio_masuk_aktif', { mode: 'boolean' }).default(true),
  urlAudioPulang: text('url_audio_pulang'),
  isAudioPulangAktif: integer('is_audio_pulang_aktif', { mode: 'boolean' }).default(true),
  urlAudioGagal: text('url_audio_gagal'),
  isAudioGagalAktif: integer('is_audio_gagal_aktif', { mode: 'boolean' }).default(true)
});

// Fitur Izin/Sakit Orang Tua
export const perizinanSantri = sqliteTable('perizinan_santri', {
  id: text('id').primaryKey(),
  idSantri: text('id_santri').references(() => santri.id).notNull(),
  kategori: text('kategori').notNull(), // 'Sakit', 'Izin'
  tanggalMulai: integer('tanggal_mulai', { mode: 'timestamp' }).notNull(),
  tanggalSelesai: integer('tanggal_selesai', { mode: 'timestamp' }).notNull(),
  keterangan: text('keterangan').notNull(),
  buktiUrl: text('bukti_url'), // Opsional
  waktuPengajuan: integer('waktu_pengajuan', { mode: 'timestamp' }).notNull()
});

export const pengaturanHalamanSukses = sqliteTable('pengaturan_halaman_sukses', {
  id: text('id').primaryKey(),
  urlLogo: text('url_logo'),
  pesanHtml: text('pesan_html').notNull().default('<h2 style="text-align:center;">Terima Kasih!</h2><p style="text-align:center;">Pengajuan izin/sakit santri telah berhasil dikirimkan dan tercatat di sistem kami.</p>'),
  diperbaruiPada: integer('diperbarui_pada', { mode: 'timestamp' }).notNull()
});

// Fitur Poin Santri (Reward & Punishment)
export const kategoriPoin = sqliteTable('kategori_poin', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull(),
  jenis: text('jenis').notNull(), // 'reward' atau 'punishment'
  nilaiPoin: integer('nilai_poin').notNull(), // absolut positif
});

export const riwayatPoinSantri = sqliteTable('riwayat_poin_santri', {
  id: text('id').primaryKey(),
  idSantri: text('id_santri').references(() => santri.id).notNull(),
  idKategoriPoin: text('id_kategori_poin').references(() => kategoriPoin.id), // bisa null jika input kustom tanpa master
  jenis: text('jenis').notNull(), // 'reward' atau 'punishment'
  nilaiPoin: integer('nilai_poin').notNull(),
  keterangan: text('keterangan').notNull(),
  waktuDitambahkan: integer('waktu_ditambahkan', { mode: 'timestamp' }).notNull()
});

// ==========================================
// MODUL MUTABAAH (CAPAIAN MENGAJI & HAFALAN)
// ==========================================
export const mutabaahSetoran = sqliteTable('mutabaah_setoran', {
  id: text('id').primaryKey(),
  idSantri: text('id_santri').references(() => santri.id).notNull(),
  inputOleh: text('input_oleh').notNull().default('guru'), // 'guru' atau 'ortu'
  idGuru: text('id_guru').references(() => guru.id), // Opsional, hanya jika diinput guru
  jenis: text('jenis').notNull(), // 'mengaji' atau 'hafalan'
  capaian: text('capaian').notNull(), // Keterangan capaian, misal "Surah Al-Baqarah 1-5" atau "Iqro 3 Hal 14"
  tanggal: text('tanggal').notNull(), // Format YYYY-MM-DD
  isSeenByOrtu: integer('is_seen_by_ortu', { mode: 'boolean' }).default(false), // true jika ortu sudah mengecek
  catatanOrtu: text('catatan_ortu'), // Komentar dari orang tua saat mengecek
  catatanGuru: text('catatan_guru'), // Komentar/pesan dari guru
  waktuDibuat: integer('waktu_dibuat', { mode: 'timestamp' }).notNull()
});

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
  idSantri: text('id_santri').notNull().references(() => santri.id),
  jenis: text('jenis').notNull().default('kas'),
  bulan: integer('bulan').notNull(), // 1-12
  tahun: integer('tahun').notNull(),
  nominal: integer('nominal').notNull(),
  tanggalBayar: integer('tanggal_bayar', { mode: 'timestamp' }),
  status: text('status').notNull().default('belum_lunas'), // belum_lunas, lunas
  idPenerima: text('id_penerima').references(() => user.id), // Admin yang menerima pembayaran
  idTagihan: text('id_tagihan').references(() => pengaturanKeuangan.id),
  metodeBayar: text('metode_bayar'), // tunai, potong_saldo, transfer, qris
  idTopup: text('id_topup') // referensi history topup jika bayar via topup
});

export const keuanganInfaq = sqliteTable('keuangan_infaq', {
  id: text('id').primaryKey(),
  idSantri: text('id_santri').notNull().references(() => santri.id),
  jenis: text('jenis').notNull().default('infaq'),
  bulan: integer('bulan').notNull(), // 1-12
  tahun: integer('tahun').notNull(),
  nominal: integer('nominal').notNull(),
  tanggalBayar: integer('tanggal_bayar', { mode: 'timestamp' }),
  status: text('status').notNull().default('belum_lunas'),
  idPenerima: text('id_penerima').references(() => user.id),
  idTagihan: text('id_tagihan').references(() => pengaturanKeuangan.id),
  metodeBayar: text('metode_bayar'),
  idTopup: text('id_topup')
});

export const keuanganTabungan = sqliteTable('keuangan_tabungan', {
  id: text('id').primaryKey(),
  idSantri: text('id_santri').references(() => santri.id).notNull(),
  jenis: text('jenis').notNull(), // setor, tarik, topup, belanja
  nominal: integer('nominal').notNull(),
  keterangan: text('keterangan').notNull(),
  tanggal: integer('tanggal', { mode: 'timestamp' }).notNull(),
  idAdmin: text('id_admin').references(() => user.id), // Null jika topup/belanja via portal
  idTopup: text('id_topup') // referensi history topup jika bayar via topup
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
  isAktif: integer('is_aktif', { mode: 'boolean' }).notNull().default(true),
  tanggal: integer('tanggal', { mode: 'timestamp' }).notNull(),
  idAdmin: text('id_admin').references(() => user.id)
});

export const notifikasiPortal = sqliteTable('notifikasi_portal', {
  id: text('id').primaryKey(),
  idSantri: text('id_santri').references(() => santri.id).notNull(),
  judul: text('judul').notNull(),
  isi: text('isi').notNull(),
  jenis: text('jenis').notNull(), // 'pengumuman', 'pembayaran'
  isRead: integer('is_read', { mode: 'boolean' }).default(false),
  tanggal: integer('tanggal', { mode: 'timestamp' }).notNull()
});


// ==========================================
// MODUL KEBUTUHAN SANTRI
// ==========================================

export const katalogKebutuhan = sqliteTable('katalog_kebutuhan', {
  id: text('id').primaryKey(),
  nama: text('nama').notNull(),
  deskripsi: text('deskripsi').notNull().default(''),
  kategori: text('kategori').notNull(), // 'gratis', 'berbayar'
  harga: integer('harga').notNull().default(0),
  stok: integer('stok').notNull().default(0),
  urlGambar: text('url_gambar'),
  isAktif: integer('is_aktif', { mode: 'boolean' }).notNull().default(true),
  waktuDibuat: integer('waktu_dibuat', { mode: 'timestamp' }).notNull()
});

export const pesananKebutuhan = sqliteTable('pesanan_kebutuhan', {
  id: text('id').primaryKey(),
  idSantri: text('id_santri').references(() => santri.id).notNull(),
  idKatalog: text('id_katalog').references(() => katalogKebutuhan.id).notNull(),
  status: text('status').notNull().default('menunggu'), // 'menunggu', 'selesai', 'dibatalkan'
  hargaSaatPesan: integer('harga_saat_pesan').notNull().default(0),
  waktuPesan: integer('waktu_pesan', { mode: 'timestamp' }).notNull(),
  waktuSelesai: integer('waktu_selesai', { mode: 'timestamp' }),
  keterangan: text('keterangan'),
  idTransaksiTabungan: text('id_transaksi_tabungan') // untuk refund jika batal
});


CREATE TABLE `absensi` (
	`id` text PRIMARY KEY NOT NULL,
	`id_santri` text NOT NULL,
	`waktu_scan` integer NOT NULL,
	`metode_scan` text NOT NULL,
	`status_kehadiran` text NOT NULL,
	`jenis_absen` text NOT NULL,
	`is_archived` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`id_santri`) REFERENCES `santri`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cabang` (
	`id` text PRIMARY KEY NOT NULL,
	`nama_cabang` text NOT NULL,
	`alamat` text
);
--> statement-breakpoint
CREATE TABLE `halaqoh` (
	`id` text PRIMARY KEY NOT NULL,
	`nama_halaqoh` text NOT NULL,
	`nama_pengajar` text NOT NULL,
	`id_sesi_absensi` text,
	FOREIGN KEY (`id_sesi_absensi`) REFERENCES `sesi_absensi`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `hari_libur` (
	`id` text PRIMARY KEY NOT NULL,
	`tanggal` text NOT NULL,
	`keterangan` text NOT NULL,
	`is_aktif` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `kategori_poin` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`jenis` text NOT NULL,
	`nilai_poin` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `log_reminder` (
	`id` text PRIMARY KEY NOT NULL,
	`id_santri` text NOT NULL,
	`tanggal` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`id_santri`) REFERENCES `santri`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pendaftar` (
	`id` text PRIMARY KEY NOT NULL,
	`nama_lengkap` text NOT NULL,
	`tempat_lahir` text DEFAULT 'Garut' NOT NULL,
	`tanggal_lahir` text NOT NULL,
	`jenis_kelamin` text NOT NULL,
	`alamat_lengkap` text NOT NULL,
	`is_alamat_domisili_sama` integer DEFAULT true,
	`alamat_domisili` text,
	`jenjang_sekolah` text NOT NULL,
	`jenjang_sekolah_lainnya` text,
	`nama_sekolah` text,
	`kelas_sekolah` text,
	`ikut_les` integer DEFAULT false,
	`hari_les` text,
	`jam_les_mulai` text,
	`jam_les_selesai` text,
	`nama_ayah` text NOT NULL,
	`pekerjaan_ayah` text NOT NULL,
	`pekerjaan_ayah_lainnya` text,
	`instansi_ayah` text,
	`nama_ibu` text NOT NULL,
	`pekerjaan_ibu` text NOT NULL,
	`pekerjaan_ibu_lainnya` text,
	`instansi_ibu` text,
	`kontak_ortu` text NOT NULL,
	`sudah_mengaji` integer DEFAULT false,
	`buku_mengaji` text,
	`capaian_mengaji` text,
	`sudah_menghafal` integer DEFAULT false,
	`capaian_hafalan` text,
	`sumber_info` text,
	`status` text DEFAULT 'menunggu' NOT NULL,
	`is_read` integer DEFAULT false,
	`tanggal_daftar` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pengaturan_absensi_global` (
	`id` text PRIMARY KEY NOT NULL,
	`is_auto_alpa_aktif` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `pengaturan_halaman_sukses` (
	`id` text PRIMARY KEY NOT NULL,
	`url_logo` text,
	`pesan_html` text DEFAULT '<h2 style="text-align:center;">Terima Kasih!</h2><p style="text-align:center;">Pengajuan izin/sakit santri telah berhasil dikirimkan dan tercatat di sistem kami.</p>' NOT NULL,
	`diperbarui_pada` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pengaturan_hari_aktif` (
	`id` text PRIMARY KEY NOT NULL,
	`hari` text NOT NULL,
	`is_aktif` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `pengaturan_humas` (
	`id` text PRIMARY KEY NOT NULL,
	`token_fonnte` text,
	`nomor_admin` text,
	`is_aktif` integer DEFAULT false,
	`nomor_reminder` text,
	`is_reminder_aktif` integer DEFAULT false
);
--> statement-breakpoint
CREATE TABLE `pengaturan_profil` (
	`id` text PRIMARY KEY NOT NULL,
	`nama_rumah_quran` text DEFAULT 'Rumah Qur''an' NOT NULL,
	`url_logo` text,
	`warna_tema` text,
	`password_absensi` text,
	`is_psb_aktif` integer DEFAULT true,
	`is_countdown_aktif` integer DEFAULT false,
	`batas_waktu_psb` integer
);
--> statement-breakpoint
CREATE TABLE `pengurus` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`email` text NOT NULL,
	`kata_sandi` text NOT NULL,
	`peran` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pengurus_email_unique` ON `pengurus` (`email`);--> statement-breakpoint
CREATE TABLE `perizinan_santri` (
	`id` text PRIMARY KEY NOT NULL,
	`id_santri` text NOT NULL,
	`kategori` text NOT NULL,
	`tanggal_mulai` integer NOT NULL,
	`tanggal_selesai` integer NOT NULL,
	`keterangan` text NOT NULL,
	`bukti_url` text,
	`waktu_pengajuan` integer NOT NULL,
	FOREIGN KEY (`id_santri`) REFERENCES `santri`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `poin_santri` (
	`id` text PRIMARY KEY NOT NULL,
	`id_santri` text NOT NULL,
	`jenis_catatan` text NOT NULL,
	`deskripsi` text NOT NULL,
	`poin_diberikan` integer NOT NULL,
	`tanggal_kejadian` integer NOT NULL,
	FOREIGN KEY (`id_santri`) REFERENCES `santri`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `riwayat_poin_santri` (
	`id` text PRIMARY KEY NOT NULL,
	`id_santri` text NOT NULL,
	`id_kategori_poin` text,
	`jenis` text NOT NULL,
	`nilai_poin` integer NOT NULL,
	`keterangan` text NOT NULL,
	`waktu_ditambahkan` integer NOT NULL,
	FOREIGN KEY (`id_santri`) REFERENCES `santri`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_kategori_poin`) REFERENCES `kategori_poin`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `santri` (
	`id` text PRIMARY KEY NOT NULL,
	`nomor_induk` text NOT NULL,
	`nama_lengkap` text NOT NULL,
	`id_halaqoh` text,
	`id_sesi_absensi` text,
	`kontak_ortu` text NOT NULL,
	`url_foto_wajah` text,
	`data_vektor_wajah` text,
	`kode_qr` text,
	`status_santri` text DEFAULT 'aktif' NOT NULL,
	`id_cabang` text,
	`tempat_lahir` text,
	`tanggal_lahir` text,
	`jenis_kelamin` text,
	`alamat_lengkap` text,
	`is_alamat_domisili_sama` integer DEFAULT true,
	`alamat_domisili` text,
	`jenjang_sekolah` text,
	`jenjang_sekolah_lainnya` text,
	`nama_sekolah` text,
	`kelas_sekolah` text,
	`ikut_les` integer DEFAULT false,
	`hari_les` text,
	`jam_les_mulai` text,
	`jam_les_selesai` text,
	`nama_ayah` text,
	`pekerjaan_ayah` text,
	`pekerjaan_ayah_lainnya` text,
	`instansi_ayah` text,
	`nama_ibu` text,
	`pekerjaan_ibu` text,
	`pekerjaan_ibu_lainnya` text,
	`instansi_ibu` text,
	FOREIGN KEY (`id_halaqoh`) REFERENCES `halaqoh`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_sesi_absensi`) REFERENCES `sesi_absensi`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `santri_nomor_induk_unique` ON `santri` (`nomor_induk`);--> statement-breakpoint
CREATE UNIQUE INDEX `santri_kode_qr_unique` ON `santri` (`kode_qr`);--> statement-breakpoint
CREATE TABLE `sesi` (
	`id` text PRIMARY KEY NOT NULL,
	`nama_sesi` text NOT NULL,
	`jam_mulai` text,
	`jam_selesai` text
);
--> statement-breakpoint
CREATE TABLE `sesi_absensi` (
	`id` text PRIMARY KEY NOT NULL,
	`nama_sesi` text NOT NULL,
	`waktu_mulai_masuk` text NOT NULL,
	`waktu_batas_masuk` text NOT NULL,
	`waktu_mulai_pulang` text NOT NULL,
	`waktu_normal_pulang` text NOT NULL,
	`waktu_tutup` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `template_pesan` (
	`id` text PRIMARY KEY NOT NULL,
	`jenis_pesan` text NOT NULL,
	`isi_pesan` text NOT NULL,
	`is_aktif` integer DEFAULT true
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`role` text DEFAULT 'admin_cabang',
	`idCabang` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);

CREATE TABLE `absensi_guru` (
	`id` text PRIMARY KEY NOT NULL,
	`id_guru` text NOT NULL,
	`waktu_scan` integer NOT NULL,
	`metode_scan` text NOT NULL,
	`status_kehadiran` text NOT NULL,
	`jenis_absen` text NOT NULL,
	`is_archived` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`id_guru`) REFERENCES `guru`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `fonnte_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`token` text NOT NULL,
	`is_active` integer DEFAULT false NOT NULL,
	`is_exhausted` integer DEFAULT false NOT NULL,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `guru` (
	`id` text PRIMARY KEY NOT NULL,
	`nip` text NOT NULL,
	`nama_lengkap` text NOT NULL,
	`jenis_kelamin` text,
	`tempat_lahir` text,
	`tanggal_lahir` text,
	`alamat` text,
	`kontak_wa` text NOT NULL,
	`url_foto_wajah` text,
	`data_vektor_wajah` text,
	`kode_qr` text,
	`status_aktif` integer DEFAULT true,
	`tanggal_masuk` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guru_nip_unique` ON `guru` (`nip`);--> statement-breakpoint
CREATE UNIQUE INDEX `guru_kode_qr_unique` ON `guru` (`kode_qr`);--> statement-breakpoint
CREATE TABLE `infaq_records` (
	`id` text PRIMARY KEY NOT NULL,
	`santri_id` text NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`amount` integer NOT NULL,
	`method` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`santri_id`) REFERENCES `santri`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kafalah_bonus` (
	`id` text PRIMARY KEY NOT NULL,
	`id_guru` text NOT NULL,
	`jenis` text NOT NULL,
	`nominal` real NOT NULL,
	`keterangan` text NOT NULL,
	`tanggal_diberikan` integer NOT NULL,
	FOREIGN KEY (`id_guru`) REFERENCES `guru`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kas_records` (
	`id` text PRIMARY KEY NOT NULL,
	`santri_id` text NOT NULL,
	`month` integer NOT NULL,
	`year` integer NOT NULL,
	`amount` integer NOT NULL,
	`method` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`santri_id`) REFERENCES `santri`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `kontrak_guru` (
	`id` text PRIMARY KEY NOT NULL,
	`id_guru` text NOT NULL,
	`jabatan` text NOT NULL,
	`jenis_kontrak` text DEFAULT 'temporer' NOT NULL,
	`tanggal_mulai` integer,
	`tanggal_selesai` integer,
	`satuan_kafalah` real DEFAULT 0 NOT NULL,
	`status_kontrak` text DEFAULT 'menunggu_ttd' NOT NULL,
	`e_sign_url` text,
	`dokumen_url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`id_guru`) REFERENCES `guru`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `mutabaah_setoran` (
	`id` text PRIMARY KEY NOT NULL,
	`id_santri` text NOT NULL,
	`input_oleh` text DEFAULT 'guru' NOT NULL,
	`id_guru` text,
	`jenis` text NOT NULL,
	`capaian` text NOT NULL,
	`tanggal` text NOT NULL,
	`is_seen_by_ortu` integer DEFAULT false,
	`catatan_ortu` text,
	`catatan_guru` text,
	`waktu_dibuat` integer NOT NULL,
	FOREIGN KEY (`id_santri`) REFERENCES `santri`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`id_guru`) REFERENCES `guru`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `topup_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`santri_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text DEFAULT 'tabungan' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`santri_id`) REFERENCES `santri`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`santri_id` text NOT NULL,
	`type` text NOT NULL,
	`amount` integer NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`santri_id`) REFERENCES `santri`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `halaqoh` ADD `kontak_pengajar` text;--> statement-breakpoint
ALTER TABLE `halaqoh` ADD `id_guru` text;--> statement-breakpoint
ALTER TABLE `santri` ADD `card_code` text;--> statement-breakpoint
ALTER TABLE `santri` ADD `wallet_balance` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `santri` ADD `savings_balance` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `santri_card_code_unique` ON `santri` (`card_code`);
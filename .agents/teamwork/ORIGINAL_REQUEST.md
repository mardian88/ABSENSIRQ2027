# Original User Request

## Initial Request — 2026-09-30T09:19:21Z

Sistem manajemen santri privat untuk mengaji dan hafalan. Fitur ini mengakomodir pencatatan absensi, tagihan, dan laporan perkembangan (baik untuk santri aktif yang mengambil kelas privat tambahan, maupun santri eksternal yang hanya mengambil kelas privat).

Integrity mode: development

## Requirements

### R1. Manajemen Data Santri Privat
Tabel `santri_privat` sudah dibuat. Buat antarmuka CRUD (Create, Read, Update, Delete) di Portal Admin untuk mengelola data santri privat ini. Halaman di `src/app/admin/santri-privat/page.tsx` dan lain-lain. Desain UI harus profesional dan mengikuti panduan ui-ux-pro-max (konsisten dengan tema tabel Shadcn/Tailwind yang ada, gunakan Tablecn).

### R2. Tagihan Bulanan Tetap (Flat-rate)
Terapkan sistem tagihan bulanan untuk santri privat. Nominal tagihan bersifat tetap (flat-rate) per bulan berdasarkan `nominalTagihanBulanan`. Sistem harus bisa menghasilkan tagihan bulanan (generate via server action) dan mencatat riwayat pembayarannya. Tempatkan di `src/app/admin/keuangan/privat/page.tsx`.

### R3. Pencatatan Absensi & Capaian (Portal Guru)
Buat halaman khusus di Portal Guru / Admin di mana guru pembimbing dapat melakukan absensi manual untuk sesi privat setelah sesi selesai. Form absensi ini wajib memiliki input tambahan untuk mencatat perkembangan "capaian hafalan" atau "bacaan jilid" santri pada pertemuan tersebut. Simpan ke tabel `absensi_privat`.

## Acceptance Criteria

### Verifikasi Backend
- [ ] Endpoint backend untuk CRUD santri privat mengembalikan status 200 OK tanpa error.

### Verifikasi UI/UX (Kualitas Pro-Max & Antislop)
- [ ] Halaman manajemen santri privat menggunakan desain tabel yang rapi (seperti komponen Tablecn).
- [ ] Halaman absensi privat di Portal Guru dapat menyimpan status kehadiran dan teks capaian hafalan ke database.
- [ ] Tampilan responsif dan bebas dari elemen UI/UX standar AI ("slop").

# Integrasi Portal Keuangan Santri (Saku Santri) ke Sistem Absensi

Berdasarkan analisis saya terhadap repositori `Muamal-muharrik-maal` (Saku Santri) dan perbandingannya dengan `sistem-absensi`, kedua aplikasi ini memang memiliki arsitektur yang sangat identik:
- Menggunakan **Next.js App Router**
- Menggunakan **Tailwind CSS & shadcn/ui**
- Menggunakan **Drizzle ORM & SQLite (Turso/LibSQL)**
- Memiliki alur autentikasi orang tua yang serupa berbasis NIK/NIS.

Karena Anda menyebutkan bahwa **"databasenya pun sama"**, ini adalah kabar yang sangat luar biasa! Artinya, kita bisa melakukan **Integrasi Native (Metode 2)** tanpa perlu repot sinkronisasi data antar server. Aplikasi absensi ini hanya perlu "diajarkan" cara membaca tabel-tabel keuangan yang sudah ada di database tersebut.

## User Review Required

> [!IMPORTANT]
> Mohon konfirmasi apakah kita akan mengimpor **seluruh antarmuka portal orang tua** dari sistem keuangan tersebut (Ringkasan Saldo, Riwayat Transaksi, Infaq, Uang Kas) ke dalam aplikasi Absensi ini, atau hanya halaman-halaman tertentu saja?

## Proposed Changes

Berikut adalah rencana langkah demi langkah untuk menyatukan fitur keuangan tersebut ke dalam Portal Orang Tua di aplikasi ini:

### 1. Database Schema Merging
Menambahkan skema Drizzle dari `Muamal-muharrik-maal` ke dalam `schema.ts` di aplikasi absensi agar sistem ini mengenali tabel-tabel keuangan.
#### [MODIFY] [`src/db/schema.ts`](file:///d:/ABSENSIRQ2027/sistem-absensi/src/db/schema.ts)
- Menambahkan skema tabel `transactions`
- Menambahkan skema tabel `infaq_records` dan `kas_records`
- Menambahkan skema tabel `topup_requests`

### 2. Integrasi UI Portal Orang Tua
Membuat menu baru di Portal Orang Tua dan memindahkan antarmuka riwayat keuangan.
#### [NEW] [`src/app/portal-ortu/keuangan/page.tsx`](file:///d:/ABSENSIRQ2027/sistem-absensi/src/app/portal-ortu/keuangan/page.tsx)
- Menampilkan Saldo Utama dan Saldo Tabungan santri.
- Menampilkan Riwayat Transaksi (Topup, Jajan, dll).
- Menampilkan Riwayat Pembayaran Infaq dan Kas.
#### [MODIFY] Sidebar Portal Ortu
- Menambahkan tombol menu navigasi **"Keuangan"** berikon dompet/koin di panel samping portal orang tua agar mudah diakses.

## Verification Plan

### Manual Verification
1. Setelah kode digabungkan, pengguna (Orang Tua) melakukan *login* ke Portal Ortu.
2. Orang Tua mengeklik menu "Keuangan".
3. Tampilan harus sukses menarik dan menampilkan sisa saldo beserta riwayat Infaq dan tabungan santri secara akurat dari *database* yang sama.

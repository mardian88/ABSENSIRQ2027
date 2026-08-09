# Aturan Khusus Pengembangan Sistem Absensi Rumah Qur'an

## Format Waktu dan Tanggal (SANGAT PENTING)
Seluruh fitur yang menggunakan atau membutuhkan input/output tanggal dan waktu wajib mengikuti aturan baku berikut:

1. **Format Zona Waktu:**
   - Wajib menggunakan Waktu Indonesia Barat / WIB (GMT+7).
   - Pastikan menggunakan zona waktu `Asia/Jakarta` pada fungsi Javascript (contoh: `toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })`).
   - Jangan gunakan waktu default server.

2. **Format Penulisan Tanggal:**
   - Wajib menggunakan pemisah **titik dua (:)**. Jangan menggunakan garis miring (/) atau setrip (-).
   - Format: `DD:MM:YYYY` atau `Hari:Bulan:Tahun` (contoh: `28:03:2026`).

3. **Format Penulisan Jam:**
   - Wajib menggunakan format 24 Jam.
   - Format: `HH:mm` (contoh: `14:30`).

## Format Penulisan Nominal Uang / Mata Uang
1. **Format Tampilan:**
   - Wajib menggunakan tanda titik (.) sebagai pemisah ribuan (contoh: `1.000`).
   - Gunakan format mata uang Rupiah Indonesia (IDR) standar, misal menggunakan `Intl.NumberFormat('id-ID')`.
2. **Format Input (Form):**
   - Saat pengguna mengetik nominal di form, angka harus otomatis diformat dengan tanda titik ribuan (auto-formatting) agar mencegah salah ketik.
   - Nilai asli yang dikirim ke database tetap wajib berupa angka murni (integer/number) tanpa tanda baca.

## Autentikasi & Redirect (Pencegahan Infinite Loop)
Saat menambahkan atau memodifikasi fitur di portal mana pun (khususnya Portal Orang Tua / Dashboard Ortu):
1. **Validasi Sesi Penuh**: Jangan hanya mengecek keberadaan string *cookie* untuk menentukan status login. Selalu validasi isi cookie tersebut ke *database* (misalnya menggunakan fungsi `getOrtuSession()`). 
2. **Halaman Login**: Halaman `/login` (seperti `/portal-ortu/login`) wajib memvalidasi sesi ke dalam database *sebelum* me-redirect *user* ke dashboard. Jika hanya mengecek `c.get("session")`, hal tersebut dapat memicu **Infinite Redirect Loop** (307 Temporary Redirect) antara halaman `/login` dan `/dashboard` jika *cookie* ada namun data *user* di database sudah terhapus/tidak valid.

### Standarisasi UI Tabel (Tablecn)
- **WAJIB**: Semua tampilan tabel data di dalam aplikasi (khususnya portal admin) harus menggunakan komponen referensi dari 	ablecn karya sadmann7 (menggunakan @tanstack/react-table).
- Margin, padding, dan struktur wrapper harus konsisten sesuai standar 	ablecn untuk menjaga keseragaman di seluruh sistem.

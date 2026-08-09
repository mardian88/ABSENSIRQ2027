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

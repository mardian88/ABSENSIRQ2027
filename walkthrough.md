# Integrasi Portal Keuangan Saku Santri

Alhamdulillah, integrasi fitur dompet/keuangan (Saku Santri) ke dalam portal orang tua di sistem absensi telah berhasil diselesaikan.

## Apa yang telah dilakukan:
1. **Integrasi Skema Database**: Menambahkan tabel-tabel keuangan (`transactions`, `infaq_records`, `kas_records`, `topup_requests`) ke dalam `src/db/schema.ts` di sistem absensi agar sistem bisa langsung membaca data mutasi dan saldo santri dari database yang sama.
2. **Modifikasi Tabel Santri**: Menambahkan kolom `walletBalance`, `savingsBalance`, dan `cardCode` ke dalam tabel `santri` di sistem absensi agar sinkron dengan sistem keuangan.
3. **Menu Keuangan Baru**: Menambahkan navigasi "Keuangan" di Sidebar Portal Orang Tua (`SidebarOrtu.tsx`).
4. **Halaman Dashboard Keuangan**: Membuat halaman `/portal-ortu/keuangan/page.tsx` yang secara otomatis menampilkan:
   - Saldo Utama & Saldo Tabungan.
   - Status Pembayaran Infaq dan Kas terakhir.
   - Mutasi transaksi (riwayat pemasukan & pengeluaran).
   - Riwayat pengajuan isi saldo (Top Up).
   - Fitur ajuan pengisian saldo (Top Up Form).

## Verifikasi
- TypeScript berhasil di-compile tanpa adanya error/peringatan baru.
- Halaman telah berhasil disalin dan disesuaikan dari repositori Saku Santri.

## Langkah Selanjutnya
Jika ada penyesuaian khusus atau Anda ingin menguji coba fitur tersebut, Anda bisa login sebagai wali santri dan mengakses menu **Keuangan**.

# Vercel & Cron Rules (ABSENSIRQ2027)

## 1. Vercel Hobby Limits
- **Maksimal Durasi Eksekusi**: Jangan pernah membuat loop berat tanpa membatasi API route. Selalu gunakan `export const maxDuration = 60;` pada App Router untuk endpoint berat.
- **Batasan Cron**: Vercel Hobby hanya mengizinkan maksimal 2 cron. Selalu arahkan eksekusi cron ke external service seperti `cron-job.org` dan hapus dari `vercel.json` jika lebih dari 2.

## 2. Timezone Handling (WIB - Asia/Jakarta)
- Jangan gunakan `setHours()` atau `setMinutes()` murni tanpa memastikan base timezone-nya.
- Untuk komparasi waktu lokal WIB di server yang menggunakan UTC, selalu gunakan format string eksplisit:
  `new Date(wibDateString + "T00:00:00.000+07:00")`

## 3. Database Optimization (Turso / SQLite)
- **N+1 Query Problem**: Jangan pernah melakukan query di dalam loop (`for ... of`) yang berpotensi melampaui puluhan iterasi.
- Selalu gunakan strategi **Bulk Query** (Tarik semua data yang dibutuhkan hari ini, simpan di `Set` atau `Map`, lalu filter di memori).
- Gunakan **Chunking** dengan `Promise.all` (maks 5 concurrent) saat memanggil API eksternal (seperti Fonnte) untuk mencegah timeout.

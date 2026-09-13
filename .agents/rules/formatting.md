---
description: Pedoman format tanggal, waktu, dan nominal uang untuk sistem ini.
---

# Aturan Format (Tanggal, Waktu, Nominal Uang)

Setiap kali Anda membuat fitur baru atau memodifikasi kode yang berhubungan dengan tanggal, waktu, atau nominal uang, **WAJIB** mematuhi format berikut yang telah ditetapkan oleh pengguna:

1. **Format Tanggal (Date)**:
   - Harus menggunakan format **Indonesia (DD/MM/YYYY)**.
   - Contoh: `28/03/1988`.
   - Hindari format luar (MM/DD/YYYY atau YYYY-MM-DD) dalam tampilan UI (kecuali jika API mensyaratkan format tertentu, tapi UI harus tetap DD/MM/YYYY).
   - Jangan gunakan `<input type="date">` secara langsung jika browser memaksakan format US (mm/dd/yyyy). Gunakan custom date picker dari Shadcn atau library lain yang bisa disesuaikan ke format DD/MM/YYYY, atau buat input text dengan mask.

2. **Format Waktu (Time)**:
   - Harus menggunakan format **JJ:MM WIB** (GMT+7).
   - Contoh: `14:30 WIB`.

3. **Format Nominal Uang (Currency)**:
   - Pemisah ribuan menggunakan titik (`.`).
   - Contoh: `1.000` atau `50.000`.
   - Gunakan fungsi helper `formatNominal` atau `Intl.NumberFormat('id-ID')` agar konsisten.

### Fungsi Helper
Fungsi helper berikut harus digunakan (tersedia di `src/lib/utils.ts`):
- `formatTanggal(date)` -> Menghasilkan `DD/MM/YYYY`
- `formatWaktu(date)` -> Menghasilkan `JJ:MM WIB`
- `formatNominal(amount)` -> Menghasilkan format ribuan dengan titik.

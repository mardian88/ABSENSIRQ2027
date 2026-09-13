# Sistem Absensi - Agent Rules

## Strict TypeScript & Vercel Deployment Validation
Sistem ini di-deploy ke **Vercel**, yang memiliki _build engine_ yang sangat ketat terhadap _TypeScript errors_ (seperti `implicit any`, variabel yang tidak digunakan, dll).

Oleh karena itu, Anda **DIWAJIBKAN** untuk mematuhi aturan berikut setiap kali menulis atau mengubah kode:
1. **Jangan biarkan tipe `any` implisit**. Selalu definisikan tipe yang jelas atau setidaknya gunakan `any` secara eksplisit jika terpaksa.
2. **Hapus kode mati (dead code)**. Jangan tinggalkan variabel yang tidak dipakai atau `return` ganda yang tidak bisa dicapai.
3. **Selalu jalankan Type Check sebelum Commit/Push**. Anda wajib menjalankan `npx tsc --noEmit` (atau `cmd.exe /c "npx tsc --noEmit"`) dan memastikannya lolos tanpa _error_ sebelum menyatakan pekerjaan selesai atau sebelum melakukan `git push`. Jika ada _error_, perbaiki terlebih dahulu.
4. Jangan membuat asumsi bahwa kode JavaScript yang berjalan di tahap _dev_ akan lolos di tahap _build_ Vercel. Selalu perlakukan TypeScript dengan disiplin tinggi.

const fs = require('fs');
const files = [
  { path: 'src/app/admin-guru/AdminGuruClient.tsx', old: '<DataTable sortColumn=nip', repl: '<DataTable sortColumn="nip"' },
  { path: 'src/app/admin-psb/PsbAdminClient.tsx', old: '<DataTable sortColumn=tanggalDaftar', repl: '<DataTable sortColumn="tanggalDaftar"' },
  { path: 'src/app/alumni/AlumniClient.tsx', old: '<DataTable sortColumn=nomorInduk', repl: '<DataTable sortColumn="nomorInduk"' },
  { path: 'src/app/laporan-absensi/LaporanClient.tsx', old: '<DataTable sortColumn=waktuMasuk', repl: '<DataTable sortColumn="waktuMasuk"' },
  { path: 'src/app/laporan-absensi/LaporanClient.tsx', old: '<DataTable sortColumn=waktuScan', repl: '<DataTable sortColumn="waktuMasuk"' },
  { path: 'src/app/laporan-absensi/perizinan/LaporanPerizinanClient.tsx', old: '<DataTable sortColumn=waktuPengajuan', repl: '<DataTable sortColumn="waktuPengajuan"' },
  { path: 'src/app/santri/SantriClient.tsx', old: '<DataTable sortColumn=nomorInduk', repl: '<DataTable sortColumn="nomorInduk"' }
];

for (const { path, old, repl } of files) {
  try {
    let content = fs.readFileSync(path, 'utf8');
    if (content.includes(old)) {
      content = content.replace(old, repl);
      fs.writeFileSync(path, content);
      console.log('Fixed', path);
    }
  } catch (e) {
    console.error('Failed', path, e.message);
  }
}

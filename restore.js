const { createClient } = require('@libsql/client');
require('dotenv').config();

const santriData = [
  {
    id: '958d5114-6a5c-49d7-ae36-d05a71f109d8',
    nomor_induk: '0268767',
    nama_lengkap: 'Ahmad',
    id_halaqoh: '396ce85f-6bff-44e2-9c4d-8ea7ad9c07c8',
    id_sesi_absensi: '2db6c9cc-ec52-43a5-bb5a-39515207aa47',
    kontak_ortu: '081211771174',
    url_foto_wajah: null,
    data_vektor_wajah: null,
    kode_qr: 'RQ-3543535F',
    status_santri: 'aktif',
    id_cabang: null,
    tempat_lahir: null,
    tanggal_lahir: null,
    jenis_kelamin: null,
    alamat_lengkap: null,
    is_alamat_domisili_sama: 1,
    alamat_domisili: null,
    jenjang_sekolah: null,
    jenjang_sekolah_lainnya: null,
    nama_sekolah: null,
    kelas_sekolah: null,
    ikut_les: 0,
    hari_les: null,
    jam_les_mulai: null,
    jam_les_selesai: null,
    nama_ayah: null,
    pekerjaan_ayah: null,
    pekerjaan_ayah_lainnya: null,
    instansi_ayah: null,
    nama_ibu: null,
    pekerjaan_ibu: null,
    pekerjaan_ibu_lainnya: null,
    instansi_ibu: null,
    ada_saudara: 0,
    saldo_tabungan: 0
  },
  {
    id: 'ebb8a56b-1e0e-44af-aaa5-44517e71a5db',
    nomor_induk: '02690701',
    nama_lengkap: 'Nama',
    id_halaqoh: '396ce85f-6bff-44e2-9c4d-8ea7ad9c07c8',
    id_sesi_absensi: '2db6c9cc-ec52-43a5-bb5a-39515207aa47',
    kontak_ortu: '081212123232',
    url_foto_wajah: null,
    data_vektor_wajah: null,
    kode_qr: null,
    status_santri: 'aktif',
    id_cabang: null,
    tempat_lahir: null,
    tanggal_lahir: null,
    jenis_kelamin: null,
    alamat_lengkap: null,
    is_alamat_domisili_sama: 1,
    alamat_domisili: null,
    jenjang_sekolah: null,
    jenjang_sekolah_lainnya: null,
    nama_sekolah: null,
    kelas_sekolah: null,
    ikut_les: 0,
    hari_les: null,
    jam_les_mulai: null,
    jam_les_selesai: null,
    nama_ayah: null,
    pekerjaan_ayah: null,
    pekerjaan_ayah_lainnya: null,
    instansi_ayah: null,
    nama_ibu: null,
    pekerjaan_ibu: null,
    pekerjaan_ibu_lainnya: null,
    instansi_ibu: null,
    ada_saudara: 0,
    saldo_tabungan: 0
  },
  {
    id: 'a5a766d0-74dd-4a5f-b69c-db3ec00e25ff',
    nomor_induk: '02661180',
    nama_lengkap: 'absaaa',
    id_halaqoh: '46693ef1-46dc-4d50-b93e-0a553ae7204f',
    id_sesi_absensi: '31c67a24-1e2b-40ac-84e4-6c3f5ce0596b',
    kontak_ortu: '081212123232',
    url_foto_wajah: null,
    data_vektor_wajah: null,
    kode_qr: '02661180',
    status_santri: 'aktif',
    id_cabang: null,
    tempat_lahir: null,
    tanggal_lahir: null,
    jenis_kelamin: null,
    alamat_lengkap: null,
    is_alamat_domisili_sama: 1,
    alamat_domisili: null,
    jenjang_sekolah: null,
    jenjang_sekolah_lainnya: null,
    nama_sekolah: null,
    kelas_sekolah: null,
    ikut_les: 0,
    hari_les: null,
    jam_les_mulai: null,
    jam_les_selesai: null,
    nama_ayah: null,
    pekerjaan_ayah: null,
    pekerjaan_ayah_lainnya: null,
    instansi_ayah: null,
    nama_ibu: null,
    pekerjaan_ibu: null,
    pekerjaan_ibu_lainnya: null,
    instansi_ibu: null,
    ada_saudara: 0,
    saldo_tabungan: 0
  },
  {
    id: 'ae76a12b-480c-4b91-8c83-b4487d3b379c',
    nomor_induk: '02685843',
    nama_lengkap: 'Ummi',
    id_halaqoh: null,
    id_sesi_absensi: null,
    kontak_ortu: '081212123232',
    url_foto_wajah: null,
    data_vektor_wajah: null,
    kode_qr: '02685843',
    status_santri: 'aktif',
    id_cabang: null,
    tempat_lahir: 'Garut',
    tanggal_lahir: '2026-04-07',
    jenis_kelamin: 'Perempuan',
    alamat_lengkap: '',
    is_alamat_domisili_sama: 0,
    alamat_domisili: '',
    jenjang_sekolah: '',
    jenjang_sekolah_lainnya: null,
    nama_sekolah: '',
    kelas_sekolah: '',
    ikut_les: 0,
    hari_les: null,
    jam_les_mulai: null,
    jam_les_selesai: null,
    nama_ayah: '',
    pekerjaan_ayah: '',
    pekerjaan_ayah_lainnya: null,
    instansi_ayah: '',
    nama_ibu: '',
    pekerjaan_ibu: '',
    pekerjaan_ibu_lainnya: null,
    instansi_ibu: '',
    ada_saudara: 0,
    saldo_tabungan: 0
  }
];

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function restore() {
  for (const s of santriData) {
    const keys = Object.keys(s);
    const placeholders = keys.map(() => '?').join(', ');
    const values = keys.map(k => s[k]);
    try {
      await client.execute({
        sql: 'INSERT INTO santri (' + keys.join(', ') + ') VALUES (' + placeholders + ')',
        args: values
      });
      console.log('Restored', s.nama_lengkap);
    } catch (e) {
      console.log('Failed for', s.nama_lengkap, e.message);
    }
  }
}
restore();

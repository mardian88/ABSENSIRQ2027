export const dynamic = "force-dynamic";
import { db } from "@/db";
import { pendaftar } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatDateID } from "@/lib/date";
import { PrintButton } from "@/components/PrintButton";

export default async function CetakFormulirPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [data] = await db.select().from(pendaftar).where(eq(pendaftar.id, resolvedParams.id));
  
  if (!data) return notFound();

  return (
    <div className="bg-white text-black max-w-4xl mx-auto p-8 text-sm print:p-0 print:w-full">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-bold">Preview Formulir</h1>
        <PrintButton className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500">
          Print Formulir
        </PrintButton>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4 portrait; margin: 20mm; }
        }
        .formulir-table {
          width: 100%;
          border-collapse: collapse;
          font-family: Arial, sans-serif;
          font-size: 13px;
        }
        .formulir-table th, .formulir-table td {
          border: 1px solid #000;
          padding: 6px 8px;
          text-align: left;
          vertical-align: middle;
        }
        .formulir-table th {
          width: 35%;
          font-weight: bold;
        }
      `}} />

      <table className="formulir-table">
        <tbody>
          <tr>
            <th>No. Tanggapan</th>
            <td>{data.id.split('-')[0].toUpperCase()}</td>
          </tr>
          <tr>
            <th>Nama Lengkap</th>
            <td>{data.namaLengkap}</td>
          </tr>
          <tr>
            <th>Tempat Lahir</th>
            <td>{data.tempatLahir}</td>
          </tr>
          <tr>
            <th>Tanggal Lahir</th>
            <td>{formatDateID(data.tanggalLahir)}</td>
          </tr>
          <tr>
            <th>Usia</th>
            <td>{new Date().getFullYear() - new Date(data.tanggalLahir).getFullYear()}</td>
          </tr>
          <tr>
            <th>Kelas</th>
            <td>{data.kelasSekolah || '-'}</td>
          </tr>
          <tr>
            <th>Jenis Kelamin</th>
            <td>{data.jenisKelamin}</td>
          </tr>
          <tr>
            <th>Alamat Lengkap</th>
            <td>{data.alamatLengkap}</td>
          </tr>
          <tr>
            <th>Alamat Domisili</th>
            <td>{data.isAlamatDomisiliSama ? '-' : data.alamatDomisili}</td>
          </tr>
          <tr>
            <th>Jenjang</th>
            <td>{data.jenjangSekolah === 'Lainnya' ? data.jenjangSekolahLainnya : data.jenjangSekolah}</td>
          </tr>
          <tr>
            <th>Nama Sekolah</th>
            <td>{data.namaSekolah || '-'}</td>
          </tr>
          <tr>
            <th>Kegiatan Lain</th>
            <td>{data.ikutLes ? 'Sedang Ikut Bimbel/Les' : '-'}</td>
          </tr>
          <tr>
            <th>Hari Bimbel</th>
            <td>{data.ikutLes ? data.hariLes : '-'}</td>
          </tr>
          <tr>
            <th>No. WhatsApp</th>
            <td>{data.kontakOrtu}</td>
          </tr>
          <tr>
            <th>Nama Ibu</th>
            <td>{data.namaIbu}</td>
          </tr>
          <tr>
            <th>Pekerjaan Ibu</th>
            <td>{data.pekerjaanIbu === 'Lainnya' ? data.pekerjaanIbuLainnya : data.pekerjaanIbu}</td>
          </tr>
          <tr>
            <th>Instansi Ibu</th>
            <td>{data.instansiIbu || '-'}</td>
          </tr>
          <tr>
            <th>Nama Ayah</th>
            <td>{data.namaAyah}</td>
          </tr>
          <tr>
            <th>Pekerjaan Ayah</th>
            <td>{data.pekerjaanAyah === 'Lainnya' ? data.pekerjaanAyahLainnya : data.pekerjaanAyah}</td>
          </tr>
          <tr>
            <th>Instansi Ayah</th>
            <td>{data.instansiAyah || '-'}</td>
          </tr>
          <tr>
            <th>Nama Wali</th>
            <td>-</td>
          </tr>
          <tr>
            <th>Sudah Mengaji</th>
            <td>{data.sudahMengaji ? 'Sudah' : 'Belum'}</td>
          </tr>
          <tr>
            <th>Metode Mengaji</th>
            <td>{data.sudahMengaji ? data.bukuMengaji : '-'}</td>
          </tr>
          <tr>
            <th>Capaian Mengaji</th>
            <td>{data.sudahMengaji ? data.capaianMengaji : '-'}</td>
          </tr>
          <tr>
            <th>Sudah Menghafal</th>
            <td>{data.sudahMenghafal ? 'Sudah' : 'Belum'}</td>
          </tr>
          <tr>
            <th>Capaian Hafalan</th>
            <td>{data.sudahMenghafal ? data.capaianHafalan : '-'}</td>
          </tr>
          <tr>
            <th>Sumber Informasi</th>
            <td>{data.sumberInfo}</td>
          </tr>
          <tr>
            <th>Nilai Form</th>
            <td>-</td>
          </tr>
          <tr>
            <th style={{ verticalAlign: 'top', height: '80px' }}>CATATAN</th>
            <td></td>
          </tr>
        </tbody>
      </table>
      
      <script dangerouslySetInnerHTML={{__html: `window.onload = function() { window.print(); }`}} />
    </div>
  );
}

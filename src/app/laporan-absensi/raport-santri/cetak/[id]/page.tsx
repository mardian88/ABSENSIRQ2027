import { db } from "@/db"
import { 
  santri, absensi, riwayatPoinSantri, halaqoh,
  raportSantri, raportCapaianSurah, surahMaster, pengaturanSemester,
  user
} from "@/db/schema"
import { eq, and, desc, asc } from "drizzle-orm"

export default async function CetakRaportPage({ params, searchParams }: { params: { id: string }, searchParams: { semester: string } }) {
  const idSantri = params.id
  const idSemester = searchParams.semester

  if (!idSantri || !idSemester) {
    return <div className="p-10">Data tidak lengkap. ID Santri dan Semester harus ada.</div>
  }

  // 1. Santri Data
  const studentData = await db.select({
    id: santri.id,
    namaLengkap: santri.namaLengkap,
    nis: santri.nomorInduk,
    idHalaqoh: santri.idHalaqoh
  }).from(santri).where(eq(santri.id, idSantri)).limit(1)
  const student = studentData[0]
  if (!student) return <div className="p-10">Santri tidak ditemukan</div>

  // 2. Halaqah & Musyrif
  let halaqahName = "-"
  let musyrifName = "-"
  if (student.idHalaqoh) {
    const hData = await db.select({
      nama: halaqoh.namaHalaqoh,
      musyrif: halaqoh.namaPengajar
    }).from(halaqoh).where(eq(halaqoh.id, student.idHalaqoh)).limit(1)
    if (hData[0]) {
      halaqahName = hData[0].nama
      musyrifName = hData[0].musyrif || "-"
    }
  }

  // 3. Semester
  const semesterData = await db.select().from(pengaturanSemester).where(eq(pengaturanSemester.id, idSemester)).limit(1)
  const semester = semesterData[0]
  
  // 4. Absensi Aggregate
  const kehadiranRecords = await db.select().from(absensi).where(eq(absensi.idSantri, idSantri))
  const kehadiran = { H: 0, I: 0, S: 0, A: 0 }
  kehadiranRecords.forEach(r => {
    if (r.statusKehadiran === 'hadir') kehadiran.H++
    else if (r.statusKehadiran === 'izin') kehadiran.I++
    else if (r.statusKehadiran === 'sakit') kehadiran.S++
    else if (r.statusKehadiran === 'alpa') kehadiran.A++
  })

  // 5. Poin Disiplin
  const poinRecords = await db.select().from(riwayatPoinSantri).where(eq(riwayatPoinSantri.idSantri, idSantri))
  let poinKedisiplinan = 100 // Base score 100
  poinRecords.forEach(r => {
    if (r.jenis === 'reward') poinKedisiplinan += r.nilaiPoin
    if (r.jenis === 'punishment') poinKedisiplinan -= r.nilaiPoin
  })

  // 6. Hafalan Data
  let capaian: any[] = []
  const raportHeader = await db.select().from(raportSantri)
    .where(and(eq(raportSantri.idSantri, idSantri), eq(raportSantri.idSemester, idSemester))).limit(1)
  
  if (raportHeader[0]) {
    capaian = await db.select({
      surah: surahMaster,
      detail: raportCapaianSurah
    })
    .from(raportCapaianSurah)
    .innerJoin(surahMaster, eq(raportCapaianSurah.idSurah, surahMaster.id))
    .where(eq(raportCapaianSurah.idRaport, raportHeader[0].id))
    .orderBy(desc(surahMaster.juz), asc(surahMaster.urutanDalamJuz))
  }

  return (
    <div className="bg-slate-200 min-h-screen py-8 print:py-0 print:bg-white flex justify-center">
      <div className="bg-white shadow-xl w-[210mm] min-h-[297mm] p-10 print:shadow-none print:p-0">
        
        {/* KOP Surat / Header */}
        <div className="border-b-4 border-emerald-800 pb-4 mb-6 flex items-center justify-between">
          <div className="w-20 h-20 bg-emerald-900 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            RQM
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-black text-emerald-900 uppercase">Rumah Qur'an Muharrik</h1>
            <p className="text-sm font-semibold text-slate-600">Laporan Hasil Belajar (Raport) Santri</p>
            <p className="text-xs text-slate-500 mt-1">Sistem Penilaian Kemampuan Bacaan & Hafalan</p>
          </div>
        </div>

        {/* Data Diri Santri */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm font-semibold text-slate-800 mb-8 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
          <div className="flex justify-between">
            <span className="text-emerald-700">Nama Santri</span>
            <span>: {student.namaLengkap}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-700">Semester</span>
            <span>: {semester?.nama || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-700">NIS</span>
            <span>: {student.nis}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-700">Tahun Ajaran</span>
            <span>: {semester?.tahunAjaran || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-700">Halaqah</span>
            <span>: {halaqahName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-emerald-700">Musyrif</span>
            <span>: {musyrifName}</span>
          </div>
        </div>

        {/* Section 1: Akademik / Hafalan */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-emerald-900 border-b-2 border-emerald-100 pb-1 mb-3">A. Capaian Hafalan Al-Qur'an</h2>
          {capaian.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-4 border border-dashed rounded">Belum ada data hafalan di semester ini.</p>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-emerald-800 text-white font-bold">
                  <th className="py-2 px-3 border border-emerald-900 w-8 text-center">No</th>
                  <th className="py-2 px-3 border border-emerald-900 w-32">Nama Surah</th>
                  <th className="py-2 px-3 border border-emerald-900 w-16 text-center">Juz</th>
                  <th className="py-2 px-3 border border-emerald-900 text-center">Nilai KB</th>
                  <th className="py-2 px-3 border border-emerald-900">Catatan KB</th>
                  <th className="py-2 px-3 border border-emerald-900 text-center">Nilai KH</th>
                  <th className="py-2 px-3 border border-emerald-900">Catatan KH</th>
                </tr>
              </thead>
              <tbody>
                {capaian.map((item, idx) => (
                  <tr key={idx} className="even:bg-emerald-50/50">
                    <td className="py-1.5 px-3 border border-emerald-200 text-center">{idx + 1}</td>
                    <td className="py-1.5 px-3 border border-emerald-200 font-bold flex justify-between">
                      <span>{item.surah.namaSurah}</span>
                      <span className="font-arabic">{item.surah.namaArab}</span>
                    </td>
                    <td className="py-1.5 px-3 border border-emerald-200 text-center">{item.surah.juz}</td>
                    <td className="py-1.5 px-3 border border-emerald-200 text-center font-bold">
                      {item.detail.nilaiKb ?? '-'} <span className="text-[10px] block font-normal">{item.detail.predikatKb}</span>
                    </td>
                    <td className="py-1.5 px-3 border border-emerald-200 italic">{item.detail.catatanKb || '-'}</td>
                    <td className="py-1.5 px-3 border border-emerald-200 text-center font-bold">
                      {item.detail.nilaiKh ?? '-'} <span className="text-[10px] block font-normal">{item.detail.predikatKh}</span>
                    </td>
                    <td className="py-1.5 px-3 border border-emerald-200 italic">{item.detail.catatanKh || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Section 2: Kehadiran & Kedisiplinan */}
        <div className="grid grid-cols-2 gap-8 mb-10">
          <div>
            <h2 className="text-lg font-bold text-emerald-900 border-b-2 border-emerald-100 pb-1 mb-3">B. Data Kehadiran</h2>
            <table className="w-full text-sm border-collapse">
              <tbody>
                <tr>
                  <td className="py-2 px-3 border border-slate-300 font-semibold w-32">Hadir (H)</td>
                  <td className="py-2 px-3 border border-slate-300 text-center font-bold">{kehadiran.H} Hari</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-slate-300 font-semibold">Izin (I)</td>
                  <td className="py-2 px-3 border border-slate-300 text-center font-bold">{kehadiran.I} Hari</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-slate-300 font-semibold">Sakit (S)</td>
                  <td className="py-2 px-3 border border-slate-300 text-center font-bold">{kehadiran.S} Hari</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 border border-slate-300 font-semibold">Alpa (A)</td>
                  <td className="py-2 px-3 border border-slate-300 text-center font-bold text-rose-600">{kehadiran.A} Hari</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="text-lg font-bold text-emerald-900 border-b-2 border-emerald-100 pb-1 mb-3">C. Kedisiplinan Akhlak</h2>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-center h-full flex flex-col justify-center">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Skor Poin Kedisiplinan</span>
              <div className="text-5xl font-black text-emerald-700 my-2">{poinKedisiplinan}</div>
              <span className="text-xs text-slate-500">Nilai Awal: 100</span>
            </div>
          </div>
        </div>

        {/* Tanda Tangan */}
        <div className="mt-16 flex justify-between text-sm">
          <div className="text-center">
            <p className="mb-16">Mengetahui,<br/>Orang Tua / Wali Santri</p>
            <p className="font-bold underline">_________________________</p>
          </div>
          <div className="text-center">
            <p className="mb-16">Garut, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}<br/>Musyrif Halaqah</p>
            <p className="font-bold underline">{musyrifName}</p>
          </div>
        </div>

        <div className="mt-10 pt-4 border-t border-slate-200 text-center text-xs text-slate-400 print:hidden">
          <button onClick={() => {}} className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow" 
                  onClickCapture={(e) => {
                    // @ts-ignore
                    if (typeof window !== 'undefined') window.print()
                  }}>
            Cetak Raport
          </button>
        </div>

      </div>
    </div>
  )
}

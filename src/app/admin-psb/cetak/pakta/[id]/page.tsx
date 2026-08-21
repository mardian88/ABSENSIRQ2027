import { db } from "@/db";
import { pendaftar, pengaturanProfil } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";

export default async function CetakPaktaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [data] = await db.select().from(pendaftar).where(eq(pendaftar.id, resolvedParams.id));
  const [profil] = await db.select().from(pengaturanProfil).limit(1);
  
  if (!data) return notFound();

  const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="bg-white text-black min-h-screen flex flex-col items-center p-8 print:p-0">
      <div className="flex justify-between items-center mb-6 print:hidden w-full max-w-4xl">
        <h1 className="text-xl font-bold">Preview Pakta Integritas</h1>
        <PrintButton className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-500 shadow-md">
          Print Pakta
        </PrintButton>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A4 portrait; margin: 20mm; }
        }
      `}} />

      {/* Pakta Container */}
      <div className="w-full max-w-4xl bg-white font-serif text-justify leading-relaxed print:w-full print:max-w-none text-[15px]">
        
        {/* Header / Kop Surat */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-24 h-24 flex items-center justify-center shrink-0">
            {profil?.urlLogo ? (
              <img src={profil.urlLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full rounded-full border-2 border-emerald-600 flex items-center justify-center overflow-hidden">
                <div className="text-xs font-bold text-emerald-600 text-center leading-tight">
                   RUMAH QUR'AN<br/>MUHARRIK
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold text-emerald-600 mb-1">RUMAH QUR'AN MUHARRIK</h1>
            <p className="italic text-sm leading-tight">
              Jln. Pembangunan Kp. Karang Mulya RT 03/01 Ds. Sukajaya<br/>
              Kec. Tarogong Kidul Kab. Garut 44151<br/>
            </p>
            <p className="text-sm text-emerald-600 mt-1">
              Whatsapp: 0813-9494-0401 | Instagram: @rumahquranmuharrik
            </p>
          </div>
        </div>
        
        {/* Double Line Border */}
        <div className="border-b-4 border-double border-black mb-8 w-full"></div>

        {/* Title */}
        <div className="text-center font-bold mb-8">
          <h2 className="text-lg">PAKTA INTEGRITAS DAN TATA TERTIB SANTRI</h2>
          <h2 className="text-lg">RUMAH QUR'AN MUHARRIK</h2>
        </div>

        {/* Content */}
        <p className="mb-4">
          Yang bertanda tangan di bawah ini, saya selaku orang tua/wali dari:
        </p>
        
        <div className="flex items-end mb-6">
          <span className="mr-4">Nama Santri:</span>
          <div className="flex-1 border-b border-dotted border-black border-2 h-6 px-2 font-bold uppercase">{data.namaLengkap}</div>
        </div>

        <p className="mb-4">
          Dengan ini menyatakan berkomitmen penuh untuk mendukung program pendidikan di <strong>Rumah Qur'an Muharrik</strong> dan bersedia mematuhi ketentuan sebagai berikut:
        </p>

        <ol className="list-decimal pl-6 space-y-3 mb-6">
          <li>Mendukung penuh kedisiplinan santri dalam kehadiran, kebersihan, dan kesiapan mengikuti kegiatan pembelajaran di area masjid yang ditentukan.</li>
          <li>Memastikan santri menjaga adab, kesopanan, dan kehormatan masjid sebagai tempat ibadah selama beraktivitas di lingkungan Rumah Qur'an Muharrik.</li>
          <li>Mengikuti aturan operasional, jadwal, dan keputusan manajemen Rumah Qur'an Muharrik yang berlaku demi kelancaran proses belajar-mengajar.</li>
          <li>Berpartisipasi aktif dalam komunikasi perkembangan belajar santri dengan pengajar/pengurus Rumah Qur'an Muharrik.</li>
          <li>Bertanggung jawab secara moral dan mendukung terciptanya lingkungan belajar yang kondusif, bersih, dan harmonis bagi seluruh santri dan warga sekitar.</li>
        </ol>

        <p className="mb-12">
          Demikian pakta integritas ini saya buat dengan sadar, tanpa paksaan, dan penuh tanggung jawab.
        </p>

        {/* Signatures */}
        <div className="flex justify-between items-end mb-16">
          <div className="text-center">
            <p className="mb-16 font-bold">Pengurus Rumah Qur'an Muharrik</p>
            <p className="font-bold underline">(Ayi Mardiansyah)</p>
          </div>
          <div className="text-center">
            <p className="mb-2">Garut, {formattedDate}</p>
            <p className="mb-12 font-bold">Orang Tua/Wali Santri</p>
            <div className="flex justify-center items-center mb-2">
               <div className="border border-black w-16 h-20 text-[10px] text-slate-400 flex items-center justify-center">Materai<br/>10.000</div>
            </div>
            <p className="font-bold">( {data.namaIbu || '...........................................'} )</p>
          </div>
        </div>

      </div>
      
      <script dangerouslySetInnerHTML={{__html: `window.onload = function() { window.print(); }`}} />
    </div>
  );
}

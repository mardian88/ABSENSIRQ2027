import { db } from "@/db";
import { pendaftar, pengaturanProfil } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/PrintButton";

export default async function CetakKwitansiPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const [data] = await db.select().from(pendaftar).where(eq(pendaftar.id, resolvedParams.id));
  const [profil] = await db.select().from(pengaturanProfil).limit(1);
  
  if (!data) return notFound();

  return (
    <div className="bg-white text-black min-h-screen flex justify-center p-8 print:p-0">
      <div className="flex justify-between items-center mb-6 print:hidden absolute top-4 left-4 right-4">
        <h1 className="text-xl font-bold">Preview Kwitansi</h1>
        <PrintButton className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-500 shadow-md">
          Print Kwitansi
        </PrintButton>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { size: A5 landscape; margin: 10mm; }
          input, textarea { border: none !important; box-shadow: none !important; resize: none; background: transparent !important; }
        }
      `}} />

      {/* Kwitansi Container */}
      <div className="w-[800px] h-[380px] bg-[#f2faef] relative border border-emerald-100 shadow-xl overflow-hidden print:shadow-none print:border-none mt-16 print:mt-0">
        
        {/* Top Left Text */}
        <div className="absolute top-8 left-8">
          <h1 className="text-3xl font-black text-emerald-500 leading-tight tracking-tight uppercase">
            TANDA TERIMA<br/>PEMBAYARAN
          </h1>
          <div className="mt-4" style={{ fontFamily: "'Dancing Script', cursive" }}>
            <p className="text-xl italic text-slate-800">{profil?.namaRumahQuran || "Rumah Qur'an"}</p>
          </div>
        </div>

        {/* Bottom Left Logo & Address */}
        <div className="absolute bottom-6 left-8 flex items-center gap-3">
          <div className="w-16 h-16 flex items-center justify-center">
            {profil?.urlLogo ? (
              <img src={profil.urlLogo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full rounded-full border-2 border-emerald-500 flex items-center justify-center bg-white overflow-hidden">
                <div className="text-[10px] font-bold text-emerald-600 text-center leading-tight">
                  RUMAH QUR'AN<br/>MUHARRIK
                </div>
              </div>
            )}
          </div>
          <div className="text-xs text-emerald-900 leading-tight">
            Jl. Pembangunan No.10<br/>
            Sukajaya-Tarogong Kidul 44151<br/>
            0813-9494-0401
          </div>
        </div>

        {/* No. Invoice */}
        <div className="absolute top-8 left-[350px] flex items-center font-bold text-sm">
          <span>No.</span>
          <input type="text" defaultValue={data.id.split('-')[0].toUpperCase()} className="ml-2 border-b-2 border-dotted border-emerald-800 bg-transparent w-40 focus:outline-none focus:border-emerald-500 font-bold px-1" />
        </div>

        {/* Form Container (Right Side) */}
        <div className="absolute top-16 right-8 left-[350px] space-y-3">
          
          <div className="flex items-center">
            <span className="w-36 text-sm font-medium text-emerald-900">Telah diterima dari:</span>
            <input type="text" defaultValue={data.namaLengkap} className="flex-1 border-b border-dotted border-emerald-800 bg-transparent focus:outline-none focus:border-emerald-500 px-1 text-sm font-semibold" />
          </div>

          <div className="flex items-center">
            <span className="w-36 text-sm font-medium text-emerald-900">Sejumlah</span>
            <input type="text" placeholder="Tiga ratus ribu rupiah" className="flex-1 border-b border-dotted border-emerald-800 bg-transparent focus:outline-none focus:border-emerald-500 px-1 text-sm font-semibold italic" />
          </div>

          <div className="flex items-center">
            <span className="w-36 text-sm font-medium text-emerald-900">Untuk Keperluan</span>
            <input type="text" defaultValue="Pendaftaran Santri Baru 2026-2027" className="flex-1 border-b border-dotted border-emerald-800 bg-transparent focus:outline-none focus:border-emerald-500 px-1 text-sm" />
          </div>

          <div className="flex items-start">
            <span className="w-36 text-sm font-medium text-emerald-900 mt-1">Catatan Tambahan</span>
            <textarea rows={2} className="flex-1 border border-emerald-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-emerald-500 p-2 text-sm" placeholder="Opsional..."></textarea>
          </div>

        </div>

        {/* Total & Signature */}
        <div className="absolute bottom-6 left-[350px] right-8">
          <div className="border-t-2 border-emerald-900 mb-4"></div>
          <div className="flex justify-between items-end">
            <div className="font-bold text-lg text-emerald-900 flex items-center gap-2">
              <span>TOTAL</span>
              <span className="ml-8">Rp.</span>
              <input type="text" placeholder="300.000" className="border-b border-emerald-900 bg-transparent focus:outline-none font-bold text-lg w-32 px-1" />
            </div>
            
            <div className="text-right flex flex-col items-end">
              <div className="flex items-center text-sm mb-12">
                <span>Garut,</span>
                <input type="text" defaultValue={new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())} className="border-b border-dotted border-emerald-900 bg-transparent focus:outline-none text-sm w-36 px-1 ml-2 text-center" />
              </div>
              <div className="text-sm flex flex-col items-center">
                <input type="text" placeholder="Nama Petugas" className="border-b border-dotted border-emerald-900 bg-transparent focus:outline-none text-sm w-48 px-1 text-center font-semibold" />
                <div className="text-xs text-emerald-800 mt-1">Petugas Penerima</div>
              </div>
            </div>
          </div>
        </div>

      </div>
      
      <script dangerouslySetInnerHTML={{__html: `
        // The button handles printing, but we can also auto-trigger it if needed.
        // window.onload = function() { window.print(); }
      `}} />
    </div>
  );
}

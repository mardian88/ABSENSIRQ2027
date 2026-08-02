import { getOrtuSession } from "../actions";
import { redirect } from "next/navigation";
import { FileText, PlusCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function OrtuDashboardPage() {
  const santri = await getOrtuSession();
  
  if (!santri) {
    redirect("/izin");
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header Profile */}
      <div className="bg-emerald-600 text-white p-6 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-xl font-bold">Perizinan</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center overflow-hidden border-2 border-white">
            {santri.urlFotoWajah ? (
              <Image src={santri.urlFotoWajah} alt={santri.namaLengkap} width={64} height={64} className="object-cover w-full h-full" />
            ) : (
              <span className="text-emerald-600 font-bold text-2xl">{santri.namaLengkap.charAt(0)}</span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold">{santri.namaLengkap}</h2>
            <p className="text-emerald-100 text-sm opacity-90">NIS: {santri.nomorInduk}</p>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="flex-1 p-6 flex flex-col gap-4 mt-4">
        
        <Link href="/izin/form" className="group relative bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center text-center gap-3 hover:shadow-md hover:border-emerald-300 transition-all active:scale-[0.98]">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-50 group-hover:bg-emerald-100 transition-colors"></div>
          <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center z-10 shadow-inner">
            <PlusCircle className="w-8 h-8" />
          </div>
          <div className="z-10">
            <h3 className="font-bold text-lg text-slate-800">Ajukan Izin / Sakit</h3>
            <p className="text-sm text-slate-500 mt-1">Isi formulir pengajuan ketidakhadiran santri</p>
          </div>
        </Link>

        <Link href="/izin/riwayat" className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center gap-3 hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.98]">
          <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center z-10">
            <FileText className="w-6 h-6" />
          </div>
          <div className="z-10">
            <h3 className="font-bold text-slate-800">Riwayat Pengajuan</h3>
            <p className="text-sm text-slate-500 mt-1">Lihat status perizinan yang pernah diajukan</p>
          </div>
        </Link>

      </div>
    </div>
  );
}

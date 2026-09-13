export const dynamic = "force-dynamic";
import { getOrtuSession } from "../../actions";
import { redirect } from "next/navigation";
import { FileText, PlusCircle } from "lucide-react";
import Link from "next/link";

export default async function IzinDashboardPage() {
  const santri = await getOrtuSession();
  
  if (!santri) {
    redirect("/portal-ortu/login");
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 md:p-10 max-w-5xl mx-auto w-full">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Layanan Perizinan</h1>

      <div className="flex-1 flex flex-col gap-6">
        
        <Link href="/portal-ortu/izin/form" className="group relative bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 flex flex-col md:flex-row items-center text-center md:text-left gap-6 hover:shadow-md hover:border-emerald-300 transition-all active:scale-[0.98]">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center z-10 shrink-0">
            <PlusCircle className="w-8 h-8" />
          </div>
          <div className="z-10 flex-1">
            <h3 className="font-bold text-lg text-slate-800">Ajukan Izin / Sakit</h3>
            <p className="text-sm text-slate-500 mt-1">Isi formulir pengajuan ketidakhadiran santri dengan cepat dan mudah.</p>
          </div>
        </Link>

        <Link href="/portal-ortu/izin/riwayat" className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center text-center md:text-left gap-6 hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.98]">
          <div className="w-16 h-16 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center z-10 shrink-0">
            <FileText className="w-8 h-8" />
          </div>
          <div className="z-10 flex-1">
            <h3 className="font-bold text-lg text-slate-800">Riwayat Pengajuan</h3>
            <p className="text-sm text-slate-500 mt-1">Lihat status perizinan yang pernah diajukan sebelumnya.</p>
          </div>
        </Link>

      </div>
    </div>
  );
}


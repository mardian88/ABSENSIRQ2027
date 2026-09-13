export const dynamic = "force-dynamic";
import { FormIzinClient } from "./FormIzinClient";
import { cekStatusLiburIzin } from "../../../actions";
import { Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function FormIzinPage() {
  const statusLibur = await cekStatusLiburIzin();

  if (statusLibur.isLibur) {
    return (
      <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
        <div className="bg-white p-4 flex items-center border-b border-slate-200 sticky top-0 z-10">
          <Link href="/portal-ortu/izin/dashboard" className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold text-slate-800 ml-2">Formulir Pengajuan</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-6 shadow-sm border-4 border-white">
            <Lock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Formulir Terkunci</h2>
          <p className="text-slate-600 text-lg leading-relaxed max-w-sm">
            {statusLibur.message}
          </p>
          <Link href="/portal-ortu/izin" className="mt-8 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  return <FormIzinClient />;
}


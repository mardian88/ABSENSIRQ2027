import { getOrtuSession, getRiwayatIzin } from "../actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, FileText, CheckCircle2 } from "lucide-react";
import { formatDateID } from "@/lib/date";

import { RiwayatAccordion } from "./RiwayatAccordion";

export default async function RiwayatIzinPage() {
  const session = await getOrtuSession();
  if (!session) {
    redirect("/izin");
  }

  const riwayat = await getRiwayatIzin(session.id);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-white p-4 flex items-center border-b border-slate-200 sticky top-0 z-10">
        <Link href="/izin/dashboard" className="p-2 -ml-2 text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold text-slate-800 ml-2">Riwayat Pengajuan</h1>
      </div>

      <div className="p-4 overflow-y-auto">
        {riwayat.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Belum ada riwayat pengajuan izin/sakit.</p>
          </div>
        ) : (
          <RiwayatAccordion data={riwayat} />
        )}
      </div>
    </div>
  );
}

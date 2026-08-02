import { getOrtuSession, getRiwayatIzin } from "../actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, FileText, CheckCircle2 } from "lucide-react";
import { formatDateID } from "@/lib/date";

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

      <div className="p-4 space-y-4 overflow-y-auto">
        {riwayat.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>Belum ada riwayat pengajuan izin/sakit.</p>
          </div>
        ) : (
          riwayat.map((item) => (
            <div key={item.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1.5 h-full ${item.kategori === 'Sakit' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
              
              <div className="flex justify-between items-start mb-3 pl-2">
                <div>
                  <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${item.kategori === 'Sakit' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.kategori}
                  </span>
                </div>
                <div className="flex items-center text-xs text-slate-500">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDateID(item.waktuPengajuan)}
                </div>
              </div>

              <div className="pl-2 space-y-2">
                <div>
                  <p className="text-xs text-slate-500">Tanggal Pengajuan:</p>
                  <p className="font-medium text-sm text-slate-800">
                    {formatDateID(item.tanggalMulai)} - {formatDateID(item.tanggalSelesai)}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-slate-500">Keterangan:</p>
                  <p className="text-sm text-slate-700 italic">"{item.keterangan}"</p>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-100 flex items-center text-emerald-600 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Terkirim ke Sistem Kehadiran
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

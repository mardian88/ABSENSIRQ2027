import Link from "next/link";
import { MessageSquare, Users, Settings } from "lucide-react";

export default function HumasLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Pengaturan Pesan</h1>
        <p className="text-slate-500 mt-1">Manajemen notifikasi WhatsApp dan pengumuman.</p>
      </div>

      <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl w-full md:w-fit overflow-x-auto">
        <Link href="/pengaturan-pesan" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white hover:text-slate-800 text-slate-500 transition-colors">
          <MessageSquare className="w-4 h-4" /> Pengumuman (Broadcast)
        </Link>
        <Link href="/pengaturan-pesan/pengaturan" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white hover:text-slate-800 text-slate-500 transition-colors">
          <Settings className="w-4 h-4" /> Pengaturan WA (Fonnte)
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        {children}
      </div>
    </div>
  );
}

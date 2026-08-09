"use client";

import { User, BookOpen, FileText } from "lucide-react";
import Link from "next/link";

export function DashboardOrtuClient({ profil, izinData, mutabaahData }: any) {
  const totalIzin = izinData?.length || 0;
  const setoranMutabaah = mutabaahData?.riwayat?.length || 0;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard Profil Santri</h1>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border-4 border-white shadow-md">
          {profil.urlFotoWajah ? (
            <img src={profil.urlFotoWajah} alt="Profil" className="w-full h-full object-cover" />
          ) : (
            <User className="w-12 h-12 text-slate-400" />
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold text-slate-800">{profil.namaLengkap}</h2>
          <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold">
              NIS: {profil.nomorInduk}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-emerald-600">
            <div className="p-3 bg-emerald-50 rounded-xl">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Capaian Mutabaah</h3>
          </div>
          <p className="text-slate-600 mb-6 flex-1">
            Anak Anda telah menyetorkan <span className="font-bold text-slate-800">{setoranMutabaah} capaian</span> (mengaji/hafalan).
          </p>
          <Link href="/portal-ortu/mutabaah" className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-center font-semibold transition-colors">
            Lihat Detail Mutabaah
          </Link>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-orange-600">
            <div className="p-3 bg-orange-50 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold">Riwayat Perizinan</h3>
          </div>
          <p className="text-slate-600 mb-6 flex-1">
            Total <span className="font-bold text-slate-800">{totalIzin} pengajuan izin</span> telah tercatat di sistem.
          </p>
          <Link href="/portal-ortu/izin" className="w-full py-2.5 px-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-center font-semibold transition-colors">
            Kelola Perizinan
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Heart, ChevronRight, Archive, CheckCircle } from "lucide-react";
import { formatRp } from "@/lib/utils";
import Link from "next/link";

export default function DonasiOrtuClient({ initialPrograms }: { initialPrograms: any[] }) {
  return (
    <div className="pb-24">
      {/* Header */}
      <div className="bg-emerald-600 px-6 pt-12 pb-6 text-white rounded-b-3xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-500 rounded-full opacity-50 blur-2xl"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-1">Wakaf Santri</h1>
          <p className="text-emerald-100 text-sm">Salurkan kebaikan, bangun masa depan bersama.</p>
        </div>
      </div>

      <div className="px-4 mt-6">
        <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> Program Kebaikan
        </h2>

        {initialPrograms.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm">
            <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Belum ada program Wakaf yang aktif saat ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {initialPrograms.map(p => {
              const progress = p.targetNominal > 0 ? Math.min(100, (p.terkumpul / p.targetNominal) * 100) : 0;
              
              return (
                <Link href={`/portal-ortu/donasi/${p.id}`} key={p.id} className="block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                  <div className="h-40 w-full bg-slate-100 relative">
                    {p.urlGambar ? (
                      <img src={p.urlGambar} alt={p.judul} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Archive className="w-10 h-10 text-slate-300" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                      <CheckCircle className="w-3 h-3" /> Terverifikasi
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-bold text-slate-800 leading-tight mb-2 line-clamp-2">{p.judul}</h3>
                    
                    <div className="mt-4">
                      <div className="flex justify-between text-xs mb-1.5">
                        <span className="text-slate-500">Terkumpul</span>
                        <span className="font-bold text-emerald-600">{formatRp(p.terkumpul)}</span>
                      </div>
                      
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                      </div>
                      
                      {p.targetNominal > 0 && (
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium">
                          <span>0%</span>
                          <span>Target {formatRp(p.targetNominal)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  );
}


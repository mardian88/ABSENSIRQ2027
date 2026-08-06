"use client";

import { useState } from "react";
import { Clock, CheckCircle2, ChevronDown } from "lucide-react";
import { formatDateID } from "@/lib/date";

export function RiwayatAccordion({ data }: { data: any[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggleOpen = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="space-y-3">
      {data.map((item) => {
        const isSakit = item.kategori?.toLowerCase() === "sakit";
        const isOpen = openId === item.id;
        
        // Warna bar: Sakit = Merah, Izin = Orange
        const bgColor = isSakit ? "bg-rose-50" : "bg-orange-50";
        const borderColor = isSakit ? "border-rose-200" : "border-orange-200";
        const accentColor = isSakit ? "bg-rose-500" : "bg-orange-500";
        const textColor = isSakit ? "text-rose-700" : "text-orange-700";

        return (
          <div 
            key={item.id} 
            className={`border ${borderColor} rounded-xl overflow-hidden shadow-sm transition-all duration-300 bg-white`}
          >
            {/* Header / Bar */}
            <button 
              onClick={() => toggleOpen(item.id)}
              className={`w-full flex items-center justify-between p-3 text-left focus:outline-none hover:${bgColor} transition-colors ${isOpen ? bgColor : "bg-white"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-10 rounded-full ${accentColor}`}></div>
                <div>
                  <div className={`text-sm font-bold uppercase tracking-wider ${textColor}`}>
                    {item.kategori}
                  </div>
                  <div className="flex items-center text-[11px] text-slate-500 mt-0.5">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDateID(item.waktuPengajuan)}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
              </div>
            </button>

            {/* Content / Detail */}
            <div 
              className={`transition-all duration-300 ease-in-out ${isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
            >
              <div className="p-4 pt-2 border-t border-slate-100 space-y-3 bg-white">
                <div>
                  <p className="text-[11px] text-slate-500">Tanggal Izin/Sakit:</p>
                  <p className="font-medium text-sm text-slate-800">
                    {formatDateID(item.tanggalMulai)} - {formatDateID(item.tanggalSelesai)}
                  </p>
                </div>
                
                <div>
                  <p className="text-[11px] text-slate-500">Keterangan Tambahan:</p>
                  <p className="text-sm text-slate-700 italic bg-slate-50 p-2 rounded-lg border border-slate-100">"{item.keterangan}"</p>
                </div>

                <div className="pt-2 mt-2 border-t border-slate-50 flex items-center text-emerald-600 text-xs font-medium">
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Laporan terkirim ke admin
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

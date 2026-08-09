"use client";

import { useState } from "react";
import { Search, BookOpen, Clock, CheckCircle2 } from "lucide-react";

export function MutabaahAdminClient({ data }: { data: any[] }) {
  const [search, setSearch] = useState("");

  const filtered = data.filter(d => 
    d.namaSantri.toLowerCase().includes(search.toLowerCase()) || 
    (d.namaHalaqoh && d.namaHalaqoh.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Mutabaah</h1>
          <p className="text-slate-500">Pantau rekapitulasi capaian hafalan dan mengaji seluruh santri.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama santri atau halaqah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">TANGGAL</th>
                <th className="px-6 py-4">SANTRI & HALAQAH</th>
                <th className="px-6 py-4">KATEGORI</th>
                <th className="px-6 py-4">CAPAIAN</th>
                <th className="px-6 py-4">INPUT OLEH</th>
                <th className="px-6 py-4 text-center">STATUS ORTU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-600">
                      {new Date(item.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{item.namaSantri}</p>
                      <p className="text-xs text-slate-500">{item.namaHalaqoh || 'Belum ada halaqah'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold capitalize ${item.jenis === 'mengaji' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                        {item.jenis}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-[250px] truncate" title={item.capaian}>
                      <span className="text-slate-700 font-medium">{item.capaian}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item.inputOleh === 'ortu' ? (
                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md">Wali Santri</span>
                      ) : (
                        <div>
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-md">Guru</span>
                          <p className="text-[10px] text-slate-500 mt-1">{item.namaGuru}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.isSeenByOrtu ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="inline-flex items-center justify-center bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full text-[10px] font-bold border border-emerald-100">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Dilihat
                          </div>
                          {item.catatanOrtu && (
                            <p className="text-[10px] text-slate-500 italic max-w-[150px] truncate" title={item.catatanOrtu}>
                              "{item.catatanOrtu}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center bg-slate-50 text-slate-400 px-2 py-1 rounded-full text-[10px] font-medium border border-slate-200">
                          <Clock className="w-3 h-3 mr-1" /> Belum
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
                      <p>Tidak ada data mutabaah yang ditemukan.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

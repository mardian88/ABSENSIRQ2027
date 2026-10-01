import { getSantriPrivatSession } from "@/lib/session-privat";
import { db } from "@/db";
import { absensiPrivat, keuanganPrivat, jadwalPrivat, guru } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { formatDateID, formatTimeID } from "@/lib/date";
import { formatRp } from "@/lib/utils";
import { Calendar, CheckCircle2, Clock, MapPin, Receipt, History } from "lucide-react";

export default async function DashboardPrivatPage() {
  const user = await getSantriPrivatSession();
  if (!user) return null; // handled by layout

  // 1. Fetch Absensi (Last 10)
  const absensiList = await db
    .select({
      waktuSesi: absensiPrivat.waktuSesi,
      statusKehadiran: absensiPrivat.statusKehadiran,
      capaianHafalan: absensiPrivat.capaianHafalan,
      namaGuru: guru.namaLengkap,
    })
    .from(absensiPrivat)
    .leftJoin(guru, eq(absensiPrivat.idGuru, guru.id))
    .where(eq(absensiPrivat.idSantriPrivat, user.id))
    .orderBy(desc(absensiPrivat.waktuSesi))
    .limit(10);

  // 2. Fetch Keuangan
  const tagihanList = await db
    .select()
    .from(keuanganPrivat)
    .where(eq(keuanganPrivat.idSantriPrivat, user.id))
    .orderBy(desc(keuanganPrivat.tahun), desc(keuanganPrivat.bulan));

  // 3. Fetch Jadwal
  const jadwalList = await db
    .select({
      hari: jadwalPrivat.hari,
      jamMulai: jadwalPrivat.jamMulai,
      jamSelesai: jadwalPrivat.jamSelesai,
      namaGuru: guru.namaLengkap,
    })
    .from(jadwalPrivat)
    .leftJoin(guru, eq(jadwalPrivat.idGuru, guru.id))
    .where(eq(jadwalPrivat.idSantriPrivat, user.id));

  const bulanString = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="bg-emerald-600 rounded-3xl p-8 text-white shadow-xl bg-gradient-to-br from-emerald-600 to-emerald-800">
        <h1 className="text-3xl font-bold mb-2">Ahlan wa Sahlan, {user.namaLengkap}</h1>
        <p className="text-emerald-50">Semoga selalu dimudahkan dalam menuntut ilmu dan menghafal Al-Qur'an.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Jadwal & Tagihan) */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Jadwal Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="font-bold text-slate-800">Jadwal Mengaji</h2>
            </div>
            <div className="p-5 space-y-4">
              {jadwalList.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Belum ada jadwal yang diset.</p>
              ) : (
                jadwalList.map((j, i) => (
                  <div key={i} className="flex flex-col p-3 rounded-xl bg-slate-50 border border-slate-100 gap-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-emerald-700">{j.hari}</span>
                      <span className="text-xs font-semibold text-slate-600 bg-slate-200/50 px-2 py-1 rounded-md">
                        {j.jamMulai} - {j.jamSelesai}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <UserIcon className="w-3.5 h-3.5" />
                      Pengajar: {j.namaGuru || "Belum ditentukan"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tagihan Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 bg-rose-100 rounded-lg">
                <Receipt className="w-5 h-5 text-rose-600" />
              </div>
              <h2 className="font-bold text-slate-800">Informasi Tagihan</h2>
            </div>
            <div className="p-5 space-y-3">
              {tagihanList.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">Belum ada tagihan.</p>
              ) : (
                tagihanList.map((t) => (
                  <div key={t.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div>
                      <p className="font-semibold text-sm text-slate-800">
                        {bulanString[t.bulan - 1]} {t.tahun}
                      </p>
                      <p className="text-xs font-bold mt-1 text-slate-700">
                        {formatRp(t.nominalTagihan)}
                      </p>
                    </div>
                    <div>
                      {t.status === 'lunas' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          LUNAS
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700">
                          BELUM LUNAS
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Riwayat Kehadiran) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="font-bold text-slate-800">Riwayat Kehadiran & Capaian (10 Terakhir)</h2>
            </div>
            
            <div className="p-0">
              {absensiList.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <p>Belum ada riwayat kehadiran.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {absensiList.map((a, i) => (
                    <div key={i} className="p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-slate-50/50 transition-colors">
                      
                      <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-slate-100 text-slate-600">
                        <span className="text-xs font-bold">{formatDateID(a.waktuSesi).split(' ')[0]}</span>
                        <span className="text-xs">{formatDateID(a.waktuSesi).split(' ')[1].substring(0,3)}</span>
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {a.statusKehadiran === 'hadir' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                              Hadir
                            </span>
                          ) : a.statusKehadiran === 'izin' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">
                              Izin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase">
                              Alpa
                            </span>
                          )}
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeID(a.waktuSesi)}
                          </span>
                        </div>
                        
                        {a.capaianHafalan ? (
                          <p className="text-sm text-slate-700 font-medium truncate">
                            📖 {a.capaianHafalan}
                          </p>
                        ) : (
                          <p className="text-sm text-slate-400 italic">
                            Tidak ada catatan capaian
                          </p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          Guru: {a.namaGuru || "-"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function UserIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

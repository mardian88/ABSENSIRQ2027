"use client";

import { useState, useEffect } from "react";
import { Users, UserCheck, AlertCircle, RefreshCw, Clock } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from "recharts";
import { getDashboardStats, getWeeklyTrend, getMethodDistribution, getRecentScans } from "./actions";
import { getDashboardPoin } from "./poin-actions";
import { formatTimeID } from "@/lib/date";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getLiveFeedColumns } from "./columns";

export function DashboardClient({ 
  initialStats, 
  initialTrend, 
  initialDistribution, 
  initialRecentScans,
  initialPoinStats 
}: {
  initialStats: any;
  initialTrend: any;
  initialDistribution: any;
  initialRecentScans: any;
  initialPoinStats: any;
}) {
  const [stats, setStats] = useState(initialStats);
  const [trend, setTrend] = useState(initialTrend);
  const [distribution, setDistribution] = useState(initialDistribution);
  const [recentScans, setRecentScans] = useState(initialRecentScans);
  const [poinStats, setPoinStats] = useState(initialPoinStats);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [newStats, newTrend, newDist, newRecent, newPoin] = await Promise.all([
        getDashboardStats(),
        getWeeklyTrend(),
        getMethodDistribution(),
        getRecentScans(),
        getDashboardPoin()
      ]);
      setStats(newStats);
      setTrend(newTrend);
      setDistribution(newDist);
      setRecentScans(newRecent);
      setPoinStats(newPoin);
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Gagal menyegarkan data dasbor", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Polling tiap 30 detik
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md py-4 -mt-4 border-b border-slate-200/50 mb-6 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3">
            <Link href="/pindai-wajah" className="flex justify-center items-center px-4 py-3 sm:py-2 bg-slate-900 text-white rounded-xl sm:rounded-lg hover:bg-slate-800 font-semibold shadow-sm transition-colors text-sm sm:text-base">
              Mulai Pindai Wajah
            </Link>
            <Link href="/pindai-qr" className="flex justify-center items-center px-4 py-3 sm:py-2 bg-white text-slate-900 border border-slate-200 rounded-xl sm:rounded-lg hover:bg-slate-50 font-semibold shadow-sm transition-colors text-sm sm:text-base">
              Mulai Pindai QR
            </Link>
          </div>
        </div>

        {/* Header Info */}
        <div className="flex items-center justify-end text-sm text-slate-500 gap-2">
          <Clock className="w-4 h-4" />
          <span>Pembaruan terakhir: {formatTimeID(lastUpdate)}</span>
          <button 
            onClick={fetchData} 
            disabled={isRefreshing}
            className={`p-1.5 rounded-md hover:bg-slate-200 transition-colors ${isRefreshing ? 'animate-spin opacity-50' : ''}`}
            title="Segarkan Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tingkat Kehadiran</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-4 h-4" /></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black text-slate-800">{stats.persentaseHadir}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${stats.persentaseHadir}%` }}></div>
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Hadir</span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><UserCheck className="w-4 h-4" /></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black text-emerald-700">{stats.totalHadir}</span>
            <span className="text-sm text-emerald-600 font-medium">Santri</span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-100 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Izin / Sakit</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black text-amber-700">{stats.totalIzinSakit}</span>
            <span className="text-sm text-amber-600 font-medium">Santri</span>
          </div>
        </div>

        <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">Belum Hadir / Alpa</span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-lg"><AlertCircle className="w-4 h-4" /></div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-black text-rose-700">{stats.totalAlpa}</span>
            <span className="text-sm text-rose-600 font-medium">Santri</span>
          </div>
        </div>
      </div>

      {/* Charts & Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Kehadiran */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Tren Kehadiran (7 Hari)</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f1f5f9'}} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="hadir" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribusi Metode */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Metode Absen Hari Ini</h2>
          {distribution.length > 0 ? (
            <div className="h-[200px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {distribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm italic">
              Belum ada data absen
            </div>
          )}
          
          <div className="flex flex-col gap-2 mt-2">
            {distribution.map((d: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }}></div>
                  <span className="text-slate-600 font-medium">{d.name}</span>
                </div>
                <span className="font-bold text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live Feed Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">History Absensi Santri Hari Ini</h2>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">Live</span>
          </div>
        </div>
        <DataTable
          columns={getLiveFeedColumns()}
          data={recentScans}
          searchKey="namaSantri"
        />
      </div>

      {/* Widget Poin Santri */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 Santri Teladan */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center">
              <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mr-3">
                🏆
              </span>
              Top 3 Santri Teladan
            </h3>
            <Link href="/poin" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">Lihat Semua</Link>
          </div>
          
          <div className="space-y-4">
            {poinStats?.top3?.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Belum ada data poin.</p>
            ) : (
              poinStats?.top3?.map((item: any, idx: number) => (
                <Link href={`/poin/${item.santri.id}`} key={item.santri.id} className="flex items-center justify-between p-3 rounded-xl border border-emerald-50 bg-emerald-50/30 hover:bg-emerald-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{item.santri.namaLengkap}</p>
                      <p className="text-xs text-slate-500">NIS: {item.santri.nomorInduk}</p>
                    </div>
                  </div>
                  <div className="font-black text-lg text-emerald-600">{item.totalPoin} <span className="text-xs font-normal text-slate-500">pt</span></div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top 3 Santri Bermasalah */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800 text-lg flex items-center">
              <span className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center mr-3">
                ⚠️
              </span>
              Perlu Perhatian (Poin Terendah)
            </h3>
            <Link href="/poin" className="text-sm text-rose-600 hover:text-rose-700 font-medium">Lihat Semua</Link>
          </div>
          
          <div className="space-y-4">
            {poinStats?.bottom3?.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Belum ada data poin.</p>
            ) : (
              poinStats?.bottom3?.map((item: any, idx: number) => (
                <Link href={`/poin/${item.santri.id}`} key={item.santri.id} className="flex items-center justify-between p-3 rounded-xl border border-rose-50 bg-rose-50/30 hover:bg-rose-50/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{item.santri.namaLengkap}</p>
                      <p className="text-xs text-slate-500">NIS: {item.santri.nomorInduk}</p>
                    </div>
                  </div>
                  <div className="font-black text-lg text-rose-600">{item.totalPoin} <span className="text-xs font-normal text-slate-500">pt</span></div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

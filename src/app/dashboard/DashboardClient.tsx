"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, UserCheck, AlertCircle, RefreshCw, Clock, Calendar as CalendarIcon, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Download } from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from "recharts";
import { getDashboardStats, getWeeklyTrend, getMethodDistribution, getRecentScans } from "./actions";
import { getDashboardPoin } from "./poin-actions";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getLiveFeedColumns } from "./columns";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DashboardClient({ 
  initialStats, 
  initialTrend, 
  initialDistribution, 
  initialRecentScans,
  initialPoinStats,
  initialStart,
  initialEnd
}: {
  initialStats: any;
  initialTrend: any;
  initialDistribution: any;
  initialRecentScans: any;
  initialPoinStats: any;
  initialStart?: string | null;
  initialEnd?: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [stats, setStats] = useState(initialStats);
  const [trend, setTrend] = useState(initialTrend);
  const [distribution, setDistribution] = useState(initialDistribution);
  const [recentScans, setRecentScans] = useState(initialRecentScans);
  const [poinStats, setPoinStats] = useState(initialPoinStats);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const [startDate, setStartDate] = useState(initialStart || "");
  const [endDate, setEndDate] = useState(initialEnd || "");

  useEffect(() => {
    setStats(initialStats);
    setTrend(initialTrend);
    setDistribution(initialDistribution);
    setRecentScans(initialRecentScans);
    setPoinStats(initialPoinStats);
  }, [initialStats, initialTrend, initialDistribution, initialRecentScans, initialPoinStats]);

  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const currentStart = searchParams.get('start');
      const currentEnd = searchParams.get('end');
      const filterParams = { start: currentStart || null, end: currentEnd || null };

      const [newStats, newTrend, newDist, newRecent, newPoin] = await Promise.all([
        getDashboardStats(filterParams),
        getWeeklyTrend(filterParams),
        getMethodDistribution(filterParams),
        getRecentScans(filterParams),
        getDashboardPoin()
      ]);
      setStats(newStats);
      setTrend(newTrend);
      setDistribution(newDist);
      setRecentScans(newRecent);
      setPoinStats(newPoin);
      setLastUpdate(new Date());
    } catch (e) {
      console.error("Gagal menyegarkan data", e);
    } finally {
      setIsRefreshing(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const applyFilter = (type: string) => {
    const params = new URLSearchParams(searchParams);
    const now = new Date();
    const wibDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const yyyy = wibDate.getFullYear();
    const mm = String(wibDate.getMonth() + 1).padStart(2, '0');
    const dd = String(wibDate.getDate()).padStart(2, '0');
    const today = `${yyyy}-${mm}-${dd}`;

    if (type === 'hari_ini') {
      params.set('start', today);
      params.set('end', today);
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'semua') {
      params.set('start', 'all');
      params.set('end', 'all');
      setStartDate('');
      setEndDate('');
    } else if (type === 'kustom') {
      if (startDate) params.set('start', startDate);
      else params.delete('start');
      if (endDate) params.set('end', endDate);
      else params.delete('end');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const isAllTime = searchParams.get('start') === 'all';
  const displayRange = isAllTime ? "Semua Waktu" : 
    (searchParams.get('start') && searchParams.get('end') 
      ? `${searchParams.get('start')} - ${searchParams.get('end')}` 
      : "Hari Ini");

  // Format data for modern charts
  const totalDist = distribution.reduce((sum: number, item: any) => sum + item.value, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 font-sans">
      
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
            Updated {lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 bg-white border border-slate-200/60 rounded-lg p-1 shadow-sm">
            <Button 
              variant={(!searchParams.get('start') || searchParams.get('start') === new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })).toISOString().split('T')[0]) ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => applyFilter('hari_ini')}
              className="text-xs h-8 px-3 rounded-md"
            >
              Today
            </Button>
            <Button 
              variant={isAllTime ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => applyFilter('semua')}
              className="text-xs h-8 px-3 rounded-md"
            >
              All Time
            </Button>
          </div>
          
          <div className="flex items-center space-x-2 bg-white border border-slate-200/60 rounded-lg p-1 shadow-sm">
            <input 
              type="date" 
              className="text-xs border-none bg-transparent focus:ring-0 cursor-pointer px-2 w-28 text-slate-600" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span className="text-xs text-slate-300">-</span>
            <input 
              type="date" 
              className="text-xs border-none bg-transparent focus:ring-0 cursor-pointer px-2 w-28 text-slate-600" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button size="sm" variant="default" className="h-7 text-xs px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white" onClick={() => applyFilter('kustom')}>
              Apply
            </Button>
          </div>
        </div>
      </div>

      {/* METRIC CARDS (Top Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1 */}
        <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 text-sm font-medium tracking-wide">Tingkat Kehadiran</h3>
            <span className="text-emerald-600 text-xs font-semibold bg-emerald-50 px-2 py-1 rounded-md flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" /> +High
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-4">{stats.persentaseHadir}%</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-700 flex items-center">
              Performa absensi <ArrowUpRight className="w-3 h-3 ml-1 text-slate-400" />
            </p>
            <p className="text-xs text-slate-500">Dari total {stats.totalSantri} Santri terdaftar</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 text-sm font-medium tracking-wide">Total Hadir</h3>
            <span className="text-blue-600 text-xs font-semibold bg-blue-50 px-2 py-1 rounded-md flex items-center">
              <Users className="w-3 h-3 mr-1" /> Active
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-4">{stats.totalHadir}</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-700 flex items-center">
              Santri aktif di periode ini <ArrowUpRight className="w-3 h-3 ml-1 text-slate-400" />
            </p>
            <p className="text-xs text-slate-500">Memenuhi target kehadiran</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 text-sm font-medium tracking-wide">Izin / Sakit</h3>
            <span className="text-amber-600 text-xs font-semibold bg-amber-50 px-2 py-1 rounded-md flex items-center">
              <TrendingDown className="w-3 h-3 mr-1" /> Stable
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-4">{stats.totalIzinSakit}</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-700 flex items-center">
              Pengajuan izin resmi <ArrowDownRight className="w-3 h-3 ml-1 text-slate-400" />
            </p>
            <p className="text-xs text-slate-500">Data rekapitulasi perizinan</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200/70 rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] transition-all hover:shadow-[0_8px_20px_-6px_rgba(0,0,0,0.08)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-slate-500 text-sm font-medium tracking-wide">Belum Hadir / Alpa</h3>
            <span className="text-rose-600 text-xs font-semibold bg-rose-50 px-2 py-1 rounded-md flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" /> Alert
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900 mb-4">{stats.totalAlpa}</p>
          <div className="space-y-1">
            <p className="text-sm text-slate-700 flex items-center">
              Perlu tindak lanjut segera <ArrowUpRight className="w-3 h-3 ml-1 text-slate-400" />
            </p>
            <p className="text-xs text-slate-500">Santri tanpa keterangan absen</p>
          </div>
        </div>
      </div>

      {/* MIDDLE ROW (Charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Area Chart: Tren Kehadiran */}
        <div className="lg:col-span-3 bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Performa Kehadiran</h2>
              <p className="text-sm text-slate-500">Tren absensi 7 hari terakhir</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs px-3 rounded-lg border-slate-200">
              <Download className="w-3 h-3 mr-2" />
              Export
            </Button>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHadir" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12}} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="hadir" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorHadir)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doughnut Chart: Metode Scan */}
        <div className="lg:col-span-2 bg-white border border-slate-200/70 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Distribusi Metode</h2>
              <p className="text-sm text-slate-500">Rincian penggunaan metode absen</p>
            </div>
            <Button variant="outline" size="sm" className="h-8 text-xs px-3 rounded-lg border-slate-200">
              <Download className="w-3 h-3 mr-2" />
              Export
            </Button>
          </div>

          {distribution.length > 0 ? (
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="h-[200px] w-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={6}
                    >
                      {distribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px -2px rgb(0 0 0 / 0.1)' }} 
                      itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center text for Donut */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-slate-800">{totalDist}</span>
                  <span className="text-xs text-slate-500">Total Scan</span>
                </div>
              </div>

              {/* Custom Legend like the screenshot */}
              <div className="flex flex-col gap-3 flex-1 w-full max-w-[200px]">
                {distribution.map((d: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }}></div>
                      <span className="text-slate-700 font-medium text-sm">{d.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">{d.value}</span>
                      <span className="text-[10px] text-slate-500">{Math.round((d.value/totalDist)*100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic">
              Belum ada data absen di periode ini
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW (Live Feed & Top Poin) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Live Feed Table */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">History Absensi</h2>
              <p className="text-sm text-slate-500">10 transaksi terakhir</p>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase">Live Feed</span>
            </div>
          </div>
          <div className="p-0 [&_.border]:border-0 [&_th]:bg-slate-50/80 [&_th]:text-slate-500 [&_th]:font-medium [&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wider">
            <DataTable
              columns={getLiveFeedColumns()}
              data={recentScans}
              searchKey="namaSantri"
            />
          </div>
        </div>

        {/* Top 3 Santri Teladan */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden relative">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
          
          <div className="p-6 h-full flex flex-col relative z-10">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="font-semibold text-white text-lg flex items-center">
                  Santri Teladan
                </h3>
                <p className="text-sm text-slate-400 mt-1">Peringkat poin tertinggi (All Time)</p>
              </div>
              <Link href="/poin" className="text-sm bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2 rounded-lg transition-colors backdrop-blur-sm">
                Lihat Semua
              </Link>
            </div>
            
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {poinStats?.top3?.length === 0 ? (
                <p className="text-sm text-slate-400 italic text-center">Belum ada data poin.</p>
              ) : (
                poinStats?.top3?.map((item: any, idx: number) => (
                  <Link href={`/poin/${item.santri.id}`} key={item.santri.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-sm group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${idx === 0 ? 'bg-amber-400 text-amber-900' : idx === 1 ? 'bg-slate-300 text-slate-800' : 'bg-amber-700/80 text-amber-100'}`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-white group-hover:text-emerald-400 transition-colors">{item.santri.namaLengkap}</p>
                        <p className="text-xs text-slate-400 mt-0.5">NIS: {item.santri.nomorInduk}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-xl text-emerald-400">{item.totalPoin}</div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">Poin</div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

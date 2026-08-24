"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, UserCheck, AlertCircle, RefreshCw, Clock, Filter, Calendar as CalendarIcon } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
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

  // Update state when props change
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
      
      const filterParams = { 
        start: currentStart || null, 
        end: currentEnd || null 
      };

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
      console.error("Gagal menyegarkan data dasbor", e);
    } finally {
      setIsRefreshing(false);
    }
  }, [searchParams]);

  useEffect(() => {
    // Polling tiap 30 detik
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const applyFilter = (type: string) => {
    const params = new URLSearchParams(searchParams);
    
    // WIB Now
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
      ? `${searchParams.get('start')} s/d ${searchParams.get('end')}` 
      : "Hari Ini");

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      
      {/* Sticky Header & Filter */}
      <div className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur-md py-4 -mt-4 border-b border-slate-200/50 mb-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
              Dashboard Utama
            </h1>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Update terakhir: {lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
              <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full text-xs font-semibold ml-2">
                {displayRange}
              </span>
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <Button 
                variant={(!searchParams.get('start') || searchParams.get('start') === new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })).toISOString().split('T')[0]) ? "default" : "ghost"} 
                size="sm" 
                onClick={() => applyFilter('hari_ini')}
                className="text-xs"
              >
                Hari Ini
              </Button>
              <Button 
                variant={isAllTime ? "default" : "ghost"} 
                size="sm" 
                onClick={() => applyFilter('semua')}
                className="text-xs"
              >
                Semua Waktu
              </Button>
            </div>
            
            <div className="flex items-center space-x-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
              <input 
                type="date" 
                className="text-xs border-none bg-transparent focus:ring-0 cursor-pointer" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <span className="text-xs text-slate-400">s/d</span>
              <input 
                type="date" 
                className="text-xs border-none bg-transparent focus:ring-0 cursor-pointer" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              <Button size="sm" variant="secondary" className="h-7 text-xs ml-1 px-2" onClick={() => applyFilter('kustom')}>
                Terapkan
              </Button>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              onClick={fetchData} 
              disabled={isRefreshing}
              className="bg-white"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
          </div>
        </div>
      </div>

      {/* Grid Statistik Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Tingkat Kehadiran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-blue-600" />
          </div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tingkat Kehadiran</p>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-3xl font-black text-slate-800">{stats.persentaseHadir}%</h3>
          <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${stats.persentaseHadir}%` }}></div>
          </div>
        </div>

        {/* Card 2: Total Hadir */}
        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <UserCheck className="w-16 h-16 text-emerald-600" />
          </div>
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Total Hadir</p>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-emerald-700">{stats.totalHadir}</h3>
            <span className="text-sm font-medium text-emerald-600">Santri</span>
          </div>
        </div>

        {/* Card 3: Izin / Sakit */}
        <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">Izin / Sakit</p>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-amber-700">{stats.totalIzinSakit}</h3>
            <span className="text-sm font-medium text-amber-600">Santri</span>
          </div>
        </div>

        {/* Card 4: Alpa */}
        <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">Belum Hadir / Alpa</p>
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-rose-700">{stats.totalAlpa}</h3>
            <span className="text-sm font-medium text-rose-600">Santri</span>
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
          <h2 className="text-lg font-bold text-slate-800 mb-4">Metode Absen ({displayRange})</h2>
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
          <h2 className="text-lg font-bold text-slate-800">History Absensi ({displayRange})</h2>
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
                ?
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
                ??
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

"use server";

import { db } from "@/db";
import { absensi, santri } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getLaporanAbsensi } from "../laporan-absensi/actions";

// Fungsi pembantu untuk mendapatkan rentang waktu WIB
function getDateBounds(startStr?: string | null, endStr?: string | null) {
  const now = new Date();
  const wibDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const yyyy = wibDate.getFullYear();
  const mm = String(wibDate.getMonth() + 1).padStart(2, '0');
  const dd = String(wibDate.getDate()).padStart(2, '0');
  const todayWIBString = `${yyyy}-${mm}-${dd}`;

  if (startStr === 'all' || endStr === 'all') {
    return {
      start: new Date("2000-01-01T00:00:00.000+07:00"),
      end: new Date("2100-01-01T23:59:59.999+07:00"),
      isAllTime: true,
      endDateStr: todayWIBString
    };
  }

  const startDateStr = startStr || todayWIBString;
  const endDateStr = endStr || todayWIBString;

  const start = new Date(`${startDateStr}T00:00:00.000+07:00`);
  const end = new Date(`${endDateStr}T23:59:59.999+07:00`);

  return { start, end, isAllTime: false, endDateStr };
}

export async function getDashboardStats(params?: { start?: string | null, end?: string | null }) {
  const { start, end, isAllTime } = getDateBounds(params?.start, params?.end);

  // 1. Get Total Santri Aktif
  const allSantri = await db.select({ id: santri.id }).from(santri).where(eq(santri.statusSantri, 'aktif'));
  const totalSantri = allSantri.length;

  // 2. Get Absensi dalam rentang
  const absensiRecords = await db.select().from(absensi)
    .where(and(
      gte(absensi.waktuScan, start),
      lte(absensi.waktuScan, end)
    ));

  const hadirSet = new Set<string>();
  const izinSakitSet = new Set<string>();

  absensiRecords.forEach(record => {
    if (record.statusKehadiran === 'hadir') {
      hadirSet.add(record.idSantri);
    } else if (record.statusKehadiran === 'izin' || record.statusKehadiran === 'sakit') {
      izinSakitSet.add(record.idSantri);
    }
  });

  const totalHadir = hadirSet.size;
  const totalIzinSakit = izinSakitSet.size;
  const totalAlpa = Math.max(0, totalSantri - totalHadir - totalIzinSakit);
  const persentaseHadir = totalSantri > 0 ? Math.round((totalHadir / totalSantri) * 100) : 0;

  // 3. Get Previous Period for Trend (Only if not all-time)
  let trendData = {
    hadirDiff: 0,
    izinDiff: 0,
    alpaDiff: 0,
    persenDiff: 0,
    label: "vs sebelumnya"
  };

  if (!isAllTime) {
    const durationMs = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - durationMs - 1);
    const prevEnd = new Date(start.getTime() - 1);

    const prevRecords = await db.select().from(absensi)
      .where(and(
        gte(absensi.waktuScan, prevStart),
        lte(absensi.waktuScan, prevEnd)
      ));

    const prevHadirSet = new Set<string>();
    const prevIzinSakitSet = new Set<string>();

    prevRecords.forEach(record => {
      if (record.statusKehadiran === 'hadir') prevHadirSet.add(record.idSantri);
      else if (record.statusKehadiran === 'izin' || record.statusKehadiran === 'sakit') prevIzinSakitSet.add(record.idSantri);
    });

    const prevHadir = prevHadirSet.size;
    const prevIzinSakit = prevIzinSakitSet.size;
    const prevAlpa = Math.max(0, totalSantri - prevHadir - prevIzinSakit);
    const prevPersen = totalSantri > 0 ? Math.round((prevHadir / totalSantri) * 100) : 0;

    trendData = {
      hadirDiff: totalHadir - prevHadir,
      izinDiff: totalIzinSakit - prevIzinSakit,
      alpaDiff: totalAlpa - prevAlpa,
      persenDiff: persentaseHadir - prevPersen,
      label: durationMs <= 24 * 60 * 60 * 1000 ? "vs kemarin" : "vs periode lalu"
    };
  }

  return {
    totalSantri,
    totalHadir,
    totalIzinSakit,
    totalAlpa,
    persentaseHadir,
    trendData
  };
}

export async function getWeeklyTrend(params?: { start?: string | null, end?: string | null }) {
  const { endDateStr } = getDateBounds(params?.start, params?.end);
  const result = [];
  
  // Base date is endDate (in WIB)
  const baseDate = new Date(`${endDateStr}T12:00:00.000+07:00`);
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(baseDate.getTime());
    d.setDate(d.getDate() - i);
    
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dStr = `${yyyy}-${mm}-${dd}`;
    
    const start = new Date(`${dStr}T00:00:00.000+07:00`);
    const end = new Date(`${dStr}T23:59:59.999+07:00`);
    
    const records = await db.select({ idSantri: absensi.idSantri }).from(absensi)
      .where(and(
        gte(absensi.waktuScan, start),
        lte(absensi.waktuScan, end),
        eq(absensi.statusKehadiran, 'hadir')
      ));
    
    const uniquePresent = new Set(records.map(r => r.idSantri)).size;
    
    const hariIndo = new Intl.DateTimeFormat('id-ID', { weekday: 'short', timeZone: 'Asia/Jakarta' }).format(start);
    
    result.push({
      name: hariIndo,
      hadir: uniquePresent
    });
  }
  
  return result;
}

export async function getMethodDistribution(params?: { start?: string | null, end?: string | null }) {
  const { start, end } = getDateBounds(params?.start, params?.end);

  const records = await db.select({ metode: absensi.metodeScan }).from(absensi)
    .where(and(
      gte(absensi.waktuScan, start),
      lte(absensi.waktuScan, end),
      eq(absensi.statusKehadiran, 'hadir')
    ));

  let qrCount = 0;
  let faceCount = 0;
  let manualCount = 0;

  records.forEach(r => {
    if (r.metode.toLowerCase().includes('qr')) qrCount++;
    else if (r.metode.toLowerCase().includes('wajah') || r.metode.toLowerCase().includes('face')) faceCount++;
    else manualCount++;
  });

  return [
    { name: 'QR Code', value: qrCount, fill: '#3b82f6' },
    { name: 'Pindai Wajah', value: faceCount, fill: '#10b981' },
    { name: 'Manual', value: manualCount, fill: '#f59e0b' }
  ].filter(item => item.value > 0);
}

export async function getRecentScans(params?: { start?: string | null, end?: string | null }) {
  const isAllTime = params?.start === 'all';
  const hasRange = !!params?.start && !isAllTime;
  
  const type = isAllTime ? 'semua' : (hasRange ? 'kustom' : 'hari_ini');
  
  const laporan = await getLaporanAbsensi(type, params?.start || undefined, params?.end || undefined);
  
  const sorted = laporan.sort((a: any, b: any) => {
    const timeA = Math.max(
      a.waktuMasuk ? new Date(a.waktuMasuk).getTime() : 0, 
      a.waktuPulang ? new Date(a.waktuPulang).getTime() : 0
    );
    const timeB = Math.max(
      b.waktuMasuk ? new Date(b.waktuMasuk).getTime() : 0, 
      b.waktuPulang ? new Date(b.waktuPulang).getTime() : 0
    );
    
    if (timeA === 0 && timeB === 0) return a.person.namaLengkap.localeCompare(b.person.namaLengkap);
    return timeB - timeA;
  });

  return sorted.slice(0, 10).map((item: any) => ({
    id: item.person.id + item.statusKehadiran,
    waktuScan: item.waktuPulang || item.waktuMasuk || new Date().getTime(),
    metodeScan: item.metodePulang || item.metodeMasuk || '-',
    jenisAbsen: item.waktuPulang ? 'pulang' : 'masuk',
    statusKehadiran: item.statusKehadiran,
    namaSantri: item.person.namaLengkap,
    kategori: item.kategori 
  }));
}


import { fonnteTokens } from '@/db/schema';
import { checkFonnteQuota } from '@/app/pengaturan/actions';

export async function getActiveFonnteQuotaDashboard() {
  try {
    const activeToken = await db.query.fonnteTokens.findFirst({
      where: eq(fonnteTokens.isActive, true)
    });
    if (!activeToken) return null;
    
    const quotaRes = await checkFonnteQuota(activeToken.token);
    if (quotaRes.status && quotaRes.quota !== undefined) {
      return quotaRes.quota;
    }
    return null;
  } catch (e) {
    return null;
  }
}

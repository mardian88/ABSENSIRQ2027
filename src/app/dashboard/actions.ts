"use server";

import { db } from "@/db";
import { absensi, santri } from "@/db/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { startOfDay, endOfDay, subDays, format } from "date-fns";

export async function getDashboardStats() {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

  // 1. Get Total Santri Aktif
  const allSantri = await db.select({ id: santri.id }).from(santri).where(eq(santri.statusSantri, 'aktif'));
  const totalSantri = allSantri.length;

  // 2. Get Absensi Hari Ini
  const absensiToday = await db.select().from(absensi)
    .where(and(
      gte(absensi.waktuScan, start),
      lte(absensi.waktuScan, end)
    ));

  // Unique santri who scanned today
  const hadirSet = new Set<string>();
  const izinSakitSet = new Set<string>();

  absensiToday.forEach(record => {
    if (record.statusKehadiran === 'hadir') {
      hadirSet.add(record.idSantri);
    } else if (record.statusKehadiran === 'izin' || record.statusKehadiran === 'sakit') {
      izinSakitSet.add(record.idSantri);
    }
  });

  const totalHadir = hadirSet.size;
  const totalIzinSakit = izinSakitSet.size;
  const totalAlpa = Math.max(0, totalSantri - totalHadir - totalIzinSakit);

  return {
    totalSantri,
    totalHadir,
    totalIzinSakit,
    totalAlpa,
    persentaseHadir: totalSantri > 0 ? Math.round((totalHadir / totalSantri) * 100) : 0
  };
}

export async function getWeeklyTrend() {
  const result = [];
  const today = new Date();
  
  // Loop 7 hari ke belakang (index 6 to 0)
  for (let i = 6; i >= 0; i--) {
    const d = subDays(today, i);
    const start = startOfDay(d);
    const end = endOfDay(d);
    
    // Count unique santri present on that day
    const records = await db.select({ idSantri: absensi.idSantri }).from(absensi)
      .where(and(
        gte(absensi.waktuScan, start),
        lte(absensi.waktuScan, end),
        eq(absensi.statusKehadiran, 'hadir')
      ));
    
    const uniquePresent = new Set(records.map(r => r.idSantri)).size;
    
    const hariIndo = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(d);
    
    result.push({
      name: hariIndo,
      hadir: uniquePresent
    });
  }
  
  return result;
}

export async function getMethodDistribution() {
  const today = new Date();
  const start = startOfDay(today);
  const end = endOfDay(today);

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
    { name: 'QR Code', value: qrCount, fill: '#3b82f6' }, // blue
    { name: 'Pindai Wajah', value: faceCount, fill: '#10b981' }, // emerald
    { name: 'Manual', value: manualCount, fill: '#f59e0b' } // amber
  ].filter(item => item.value > 0);
}

import { getLaporanAbsensi } from "../laporan-absensi/actions";

export async function getRecentScans() {
  const laporan = await getLaporanAbsensi('hari_ini');
  
  // Urutkan berdasarkan waktu (Masuk/Pulang) terbaru. Untuk izin/alpa, taruh di bawah atau urut abjad
  const sorted = laporan.sort((a, b) => {
    // If it's already a number, use it directly. Otherwise try to convert from string/Date.
    const timeA = Math.max(
      a.waktuMasuk ? new Date(a.waktuMasuk).getTime() : 0, 
      a.waktuPulang ? new Date(a.waktuPulang).getTime() : 0
    );
    const timeB = Math.max(
      b.waktuMasuk ? new Date(b.waktuMasuk).getTime() : 0, 
      b.waktuPulang ? new Date(b.waktuPulang).getTime() : 0
    );
    
    if (timeA === 0 && timeB === 0) return a.santri.namaLengkap.localeCompare(b.santri.namaLengkap);
    return timeB - timeA;
  });

  // Ambil 10 teratas dan sesuaikan field-nya agar mirip dengan format sebelumnya
  return sorted.slice(0, 10).map(item => ({
    id: item.idSantri + item.statusKehadiran,
    waktuScan: item.waktuPulang || item.waktuMasuk || new Date().getTime(), // fallback ke date sekarang untuk izin/alpa jika tidak ada jam
    metodeScan: item.metodePulang || item.metodeMasuk || '-',
    jenisAbsen: item.waktuPulang ? 'pulang' : 'masuk',
    statusKehadiran: item.statusKehadiran,
    namaSantri: item.santri.namaLengkap
  }));
}

"use server";

import { db } from "@/db";
import { halaqoh, santri, absensi } from "@/db/schema";
import { and, eq, gte, lte, asc, desc } from "drizzle-orm";

export async function getHalaqohOptions() {
  try {
    const data = await db.select({
      id: halaqoh.id,
      namaHalaqoh: halaqoh.namaHalaqoh
    }).from(halaqoh).orderBy(asc(halaqoh.namaHalaqoh));
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
}

export type RekapSantriRow = {
  id: string;
  nomorInduk: string;
  namaLengkap: string;
  jenisKelamin: string;
  kehadiran: Record<number, string>; // day -> status ('hadir', 'izin', 'sakit', 'alpa')
  total: { hadir: number; izin: number; sakit: number; alpa: number };
};

export async function getRekapBulananData(bulan: number, tahun: number, idHalaqoh: string) {
  try {
    // 1. Dapatkan daftar santri aktif di halaqah tersebut
    const daftarSantri = await db.select({
      id: santri.id,
      nomorInduk: santri.nomorInduk,
      namaLengkap: santri.namaLengkap,
      jenisKelamin: santri.jenisKelamin,
    }).from(santri)
      .where(and(eq(santri.idHalaqoh, idHalaqoh), eq(santri.statusSantri, 'aktif')))
      .orderBy(asc(santri.namaLengkap));

    if (daftarSantri.length === 0) {
      return { success: true, data: [] };
    }

    const startOfMonth = new Date(tahun, bulan - 1, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(tahun, bulan, 0, 23, 59, 59, 999);

    const absensiRecords = await db.select({
      idSantri: absensi.idSantri,
      waktuScan: absensi.waktuScan,
      statusKehadiran: absensi.statusKehadiran,
      jenisAbsen: absensi.jenisAbsen,
    }).from(absensi)
      .where(and(
        gte(absensi.waktuScan, startOfMonth),
        lte(absensi.waktuScan, endOfMonth),
        eq(absensi.jenisAbsen, 'masuk')
      ));

    // 3. Susun data rekap per santri
    const santriMap = new Map<string, RekapSantriRow>();
    
    for (const s of daftarSantri) {
      santriMap.set(s.id, {
        id: s.id,
        nomorInduk: s.nomorInduk,
        namaLengkap: s.namaLengkap,
        jenisKelamin: s.jenisKelamin || 'L',
        kehadiran: {},
        total: { hadir: 0, izin: 0, sakit: 0, alpa: 0 }
      });
    }

    const daysInMonth = new Date(tahun, bulan, 0).getDate();

    for (const r of absensiRecords) {
      if (!santriMap.has(r.idSantri)) continue;
      const row = santriMap.get(r.idSantri)!;
      
      const day = r.waktuScan.getDate();
      const status = r.statusKehadiran.toLowerCase();
      
      row.kehadiran[day] = status;
    }

    // 4. Hitung Total (hanya yang eksplisit tercatat)
    const finalData = Array.from(santriMap.values()).map(row => {
      let h = 0, i = 0, s = 0, a = 0;
      
      for (let day = 1; day <= daysInMonth; day++) {
        const stat = row.kehadiran[day];
        if (stat === 'hadir' || stat === 'terlambat') h++;
        else if (stat === 'izin') i++;
        else if (stat === 'sakit') s++;
        else if (stat === 'alpa') a++;
      }
      
      row.total = { hadir: h, izin: i, sakit: s, alpa: a };
      return row;
    });

    return { success: true, data: finalData };
  } catch (error) {
    console.error(error);
    return { success: false, data: [], message: "Gagal memuat rekap bulanan" };
  }
}

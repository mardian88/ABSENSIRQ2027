"use server";

import { db } from "@/db";
import { absensi, santri, halaqoh } from "@/db/schema";
import { eq, desc, and, gte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type LaporanData = {
  id: string; // santriId_tanggal
  tanggalWIB: string; // YYYY-MM-DD
  waktuMasuk: number | null; // timestamp ms
  waktuPulang: number | null; // timestamp ms
  metodeMasuk: string | null;
  metodePulang: string | null;
  statusKehadiran: string; // status masuk (atau pulang jika masuk tidak ada/tergantung)
  santri: {
    id: string;
    namaLengkap: string;
    nomorInduk: string;
    halaqoh: string | null;
  }
};

export async function getLaporanAbsensi(filterPeriod: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role || "admin_cabang";
  const userCabang = session?.user?.idCabang;

  const now = new Date();
  
  // Format WIB
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
  const wibDateString = dateFormatter.format(now);
  const startOfTodayWIB = new Date(`${wibDateString}T00:00:00.000+07:00`);
  
  let startWaktu: Date | null = null;
  
  if (filterPeriod === "hari_ini") {
    startWaktu = startOfTodayWIB;
  } else if (filterPeriod === "minggu_ini") {
    // 7 days ago
    startWaktu = new Date(startOfTodayWIB.getTime() - 6 * 24 * 60 * 60 * 1000);
  } else if (filterPeriod === "bulan_ini") {
    startWaktu = new Date(startOfTodayWIB.getFullYear(), startOfTodayWIB.getMonth(), 1);
  } else if (filterPeriod === "triwulan") {
    startWaktu = new Date(startOfTodayWIB.getFullYear(), startOfTodayWIB.getMonth() - 3, 1);
  } else if (filterPeriod === "semester") {
    startWaktu = new Date(startOfTodayWIB.getFullYear(), startOfTodayWIB.getMonth() - 6, 1);
  } else if (filterPeriod === "tahun_ini") {
    startWaktu = new Date(startOfTodayWIB.getFullYear(), 0, 1);
  }

  let query = db
    .select({
      id: absensi.id,
      waktuScan: absensi.waktuScan,
      jenisAbsen: absensi.jenisAbsen,
      metodeScan: absensi.metodeScan,
      statusKehadiran: absensi.statusKehadiran,
      santri: {
        namaLengkap: santri.namaLengkap,
        nomorInduk: santri.nomorInduk,
        idCabang: santri.idCabang,
      },
      halaqoh: halaqoh.namaHalaqoh
    })
    .from(absensi)
    .innerJoin(santri, eq(absensi.idSantri, santri.id))
    .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id));

  // Time filtering & Role filtering combined
  if (startWaktu) {
    if (role !== "superadmin" && userCabang) {
       query = db
        .select({
          id: absensi.id,
          waktuScan: absensi.waktuScan,
          jenisAbsen: absensi.jenisAbsen,
          metodeScan: absensi.metodeScan,
          statusKehadiran: absensi.statusKehadiran,
          santri: {
            namaLengkap: santri.namaLengkap,
            nomorInduk: santri.nomorInduk,
            idCabang: santri.idCabang,
          },
          halaqoh: halaqoh.namaHalaqoh
        })
        .from(absensi)
        .innerJoin(santri, eq(absensi.idSantri, santri.id))
        .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id))
        .where(and(eq(santri.idCabang, userCabang), gte(absensi.waktuScan, startWaktu), eq(absensi.isArchived, 0))) as any;
    } else {
       query = query.where(and(gte(absensi.waktuScan, startWaktu), eq(absensi.isArchived, 0))) as any;
    }
  } else {
    if (role !== "superadmin" && userCabang) {
      query = query.where(and(eq(santri.idCabang, userCabang), eq(absensi.isArchived, 0))) as any;
    } else {
      query = query.where(eq(absensi.isArchived, 0)) as any;
    }
  }

  const results = await query.orderBy(desc(absensi.waktuScan));
  
  // Group by santri.id + date(waktuScan)
  const grouped = new Map<string, LaporanData>();

  const dateFormatterGroup = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });

  for (const r of results) {
    const d = r.waktuScan as Date;
    const dateWIB = dateFormatterGroup.format(d);
    const key = `${r.santri.nomorInduk}_${dateWIB}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        tanggalWIB: dateWIB,
        waktuMasuk: null,
        waktuPulang: null,
        metodeMasuk: null,
        metodePulang: null,
        statusKehadiran: r.statusKehadiran, // default status
        santri: {
          id: r.santri.nomorInduk, // uniquely identify
          namaLengkap: r.santri.namaLengkap,
          nomorInduk: r.santri.nomorInduk,
          halaqoh: r.halaqoh
        }
      });
    }

    const group = grouped.get(key)!;
    if (r.jenisAbsen === 'masuk') {
      group.waktuMasuk = d.getTime();
      group.metodeMasuk = r.metodeScan;
      // Gunakan status kehadiran masuk sebagai status utama karena itu yang terpenting (telat/hadir)
      group.statusKehadiran = r.statusKehadiran; 
    } else if (r.jenisAbsen === 'pulang') {
      group.waktuPulang = d.getTime();
      group.metodePulang = r.metodeScan;
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    // sort desc by tanggalWIB then waktuMasuk
    if (a.tanggalWIB !== b.tanggalWIB) {
      return b.tanggalWIB.localeCompare(a.tanggalWIB);
    }
    const aTime = Math.max(a.waktuMasuk || 0, a.waktuPulang || 0);
    const bTime = Math.max(b.waktuMasuk || 0, b.waktuPulang || 0);
    return bTime - aTime;
  });
}
export async function archiveSemuaAbsensi() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "superadmin") {
    return { success: false, message: "Hanya Superadmin yang dapat melakukan arsip data." };
  }

  try {
    await db.update(absensi).set({ isArchived: 1 });
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function deleteSemuaAbsensi(password: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "superadmin") {
    return { success: false, message: "Hanya Superadmin yang dapat menghapus data permanen." };
  }

  if (password !== "rqm2828") {
    return { success: false, message: "Password salah." };
  }

  try {
    await db.delete(absensi);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

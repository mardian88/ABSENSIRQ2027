"use server";

import { db } from "@/db";
import { absensi, santri } from "@/db/schema";
import { desc, eq, gte, and, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export type AlpaData = {
  id: string;
  waktuScan: Date;
  statusKehadiran: string;
  santri: {
    id: string;
    namaLengkap: string;
    nomorInduk: string;
  };
};

export async function getLaporanAlpa(period: string = "semua"): Promise<AlpaData[]> {
  const now = new Date();
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  // Helper: buat Date WIB dari string YYYY-MM-DD
  const wibStart = (dateStr: string) => new Date(`${dateStr}T00:00:00.000+07:00`);
  const wibEnd = (dateStr: string) => new Date(`${dateStr}T23:59:59.999+07:00`);

  // Dapatkan tanggal hari ini di WIB
  const wibDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const pad = (n: number) => String(n).padStart(2, '0');
  const todayStr = `${wibDate.getFullYear()}-${pad(wibDate.getMonth() + 1)}-${pad(wibDate.getDate())}`;

  switch (period) {
    case 'hari_ini': {
      startDate = wibStart(todayStr);
      endDate = wibEnd(todayStr);
      break;
    }
    case 'kemarin': {
      const y = new Date(wibDate);
      y.setDate(y.getDate() - 1);
      const yStr = `${y.getFullYear()}-${pad(y.getMonth() + 1)}-${pad(y.getDate())}`;
      startDate = wibStart(yStr);
      endDate = wibEnd(yStr);
      break;
    }
    case 'minggu_ini': {
      const day = wibDate.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const monday = new Date(wibDate);
      monday.setDate(wibDate.getDate() + mondayOffset);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const monStr = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
      const sunStr = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;
      startDate = wibStart(monStr);
      endDate = wibEnd(sunStr);
      break;
    }
    case 'bulan_ini': {
      const firstDay = `${wibDate.getFullYear()}-${pad(wibDate.getMonth() + 1)}-01`;
      const lastDayDate = new Date(wibDate.getFullYear(), wibDate.getMonth() + 1, 0);
      const lastDay = `${lastDayDate.getFullYear()}-${pad(lastDayDate.getMonth() + 1)}-${pad(lastDayDate.getDate())}`;
      startDate = wibStart(firstDay);
      endDate = wibEnd(lastDay);
      break;
    }
    case 'triwulan': {
      const q = Math.floor(wibDate.getMonth() / 3);
      const qStart = new Date(wibDate.getFullYear(), q * 3, 1);
      const qEnd = new Date(wibDate.getFullYear(), q * 3 + 3, 0);
      const qStartStr = `${qStart.getFullYear()}-${pad(qStart.getMonth() + 1)}-${pad(qStart.getDate())}`;
      const qEndStr = `${qEnd.getFullYear()}-${pad(qEnd.getMonth() + 1)}-${pad(qEnd.getDate())}`;
      startDate = wibStart(qStartStr);
      endDate = wibEnd(qEndStr);
      break;
    }
    case 'semester': {
      const s = Math.floor(wibDate.getMonth() / 6);
      const sStart = new Date(wibDate.getFullYear(), s * 6, 1);
      const sEnd = new Date(wibDate.getFullYear(), s * 6 + 6, 0);
      const sStartStr = `${sStart.getFullYear()}-${pad(sStart.getMonth() + 1)}-${pad(sStart.getDate())}`;
      const sEndStr = `${sEnd.getFullYear()}-${pad(sEnd.getMonth() + 1)}-${pad(sEnd.getDate())}`;
      startDate = wibStart(sStartStr);
      endDate = wibEnd(sEndStr);
      break;
    }
    case 'tahun_ini': {
      startDate = wibStart(`${wibDate.getFullYear()}-01-01`);
      endDate = wibEnd(`${wibDate.getFullYear()}-12-31`);
      break;
    }
    default:
      break;
  }

  const conditions = [eq(absensi.statusKehadiran, 'alpa')];
  
  if (startDate && endDate) {
    conditions.push(gte(absensi.waktuScan, startDate));
    conditions.push(lte(absensi.waktuScan, endDate));
  }

  const query = db
    .select({
      id: absensi.id,
      waktuScan: absensi.waktuScan,
      statusKehadiran: absensi.statusKehadiran,
      santri: {
        id: santri.id,
        namaLengkap: santri.namaLengkap,
        nomorInduk: santri.nomorInduk,
      }
    })
    .from(absensi)
    .innerJoin(santri, eq(absensi.idSantri, santri.id))
    .where(and(...conditions));

  const data = await query.orderBy(desc(absensi.waktuScan));
  return data;
}

export async function resetLaporanAlpa(password: string): Promise<{success: boolean, message: string}> {
  if (password !== 'HapusAlpaMuharrik2027!') return { success: false, message: 'Password salah!' };
  try {
    await db.delete(absensi).where(eq(absensi.statusKehadiran, 'alpa'));
    revalidatePath('/laporan-absensi/alpa');
    return { success: true, message: 'Berhasil mereset laporan alpa' };
  } catch (error) {
    return { success: false, message: 'Terjadi kesalahan sistem' };
  }
}

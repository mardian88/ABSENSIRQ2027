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

  switch (period) {
    case 'hari_ini':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'kemarin':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate.getTime());
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'minggu_ini':
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'bulan_ini':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'triwulan':
      const quarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      endDate = new Date(now.getFullYear(), startDate.getMonth() + 3, 0, 23, 59, 59, 999);
      break;
    case 'semester':
      const semester = Math.floor(now.getMonth() / 6);
      startDate = new Date(now.getFullYear(), semester * 6, 1);
      endDate = new Date(now.getFullYear(), startDate.getMonth() + 6, 0, 23, 59, 59, 999);
      break;
    case 'tahun_ini':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
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
  if (password !== 'rqm2828') return { success: false, message: 'Password salah!' };
  try {
    await db.delete(absensi).where(eq(absensi.statusKehadiran, 'alpa'));
    revalidatePath('/laporan-absensi/alpa');
    return { success: true, message: 'Berhasil mereset laporan alpa' };
  } catch (error) {
    return { success: false, message: 'Terjadi kesalahan sistem' };
  }
}

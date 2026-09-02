"use server";

import { db } from "@/db";
import { perizinanSantri, santri, absensi } from "@/db/schema";
import { desc, eq, gte, and, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export type PerizinanData = {
  id: string;
  kategori: string;
  keterangan: string;
  tanggalMulai: Date;
  tanggalSelesai: Date;
  buktiUrl: string | null;
  waktuPengajuan: Date;
  santri: {
    id: string;
    namaLengkap: string;
    nomorInduk: string;
  };
};

export async function getDaftarPerizinan(period: string = "semua"): Promise<PerizinanData[]> {
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

  let query = db
    .select({
      id: perizinanSantri.id,
      kategori: perizinanSantri.kategori,
      keterangan: perizinanSantri.keterangan,
      tanggalMulai: perizinanSantri.tanggalMulai,
      tanggalSelesai: perizinanSantri.tanggalSelesai,
      buktiUrl: perizinanSantri.buktiUrl,
      waktuPengajuan: perizinanSantri.waktuPengajuan,
      santri: {
        id: santri.id,
        namaLengkap: santri.namaLengkap,
        nomorInduk: santri.nomorInduk,
      }
    })
    .from(perizinanSantri)
    .innerJoin(santri, eq(perizinanSantri.idSantri, santri.id));

  if (startDate && endDate) {
    query = query.where(
      and(
        gte(perizinanSantri.waktuPengajuan, startDate),
        lte(perizinanSantri.waktuPengajuan, endDate)
      )
    ) as any;
  }

  const data = await query.orderBy(desc(perizinanSantri.waktuPengajuan));
  return data;
}

export async function resetLaporanIzin(password: string): Promise<{success: boolean, message: string}> {
  if (password !== 'rqm2828') return { success: false, message: 'Password salah!' };
  try {
    try {
      await cloudinary.api.delete_resources_by_prefix("izin_santri/");
    } catch (cErr) {
      console.error("Gagal menghapus gambar di Cloudinary:", cErr);
    }

    await db.delete(perizinanSantri);
    revalidatePath('/laporan-absensi/perizinan');
    return { success: true, message: 'Berhasil mereset laporan izin beserta gambarnya' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Terjadi kesalahan sistem' };
  }
}

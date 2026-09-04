"use server";

import { db } from "@/db";
import { perizinanSantri, santri, absensi } from "@/db/schema";
import { desc, eq, gte, and, lte, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";

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

export async function hapusPerizinanBanyak(ids: string[]): Promise<{success: boolean, message: string}> {
  try {
    if (!ids || ids.length === 0) {
      return { success: false, message: "Tidak ada data yang dipilih" };
    }
    
    // Ambil data sebelum dihapus untuk referensi Cloudinary & Absensi
    const dataToDelete = await db.select().from(perizinanSantri).where(inArray(perizinanSantri.id, ids));
    
    for (const d of dataToDelete) {
      // 1. Hapus gambar dari Cloudinary
      if (d.buktiUrl && d.buktiUrl.includes("cloudinary.com")) {
        const match = d.buktiUrl.match(/izin_santri\/[^.]+/);
        if (match) {
          try {
            await cloudinary.uploader.destroy(match[0]);
          } catch (err) {
            console.error("Gagal menghapus gambar izin dari cloudinary", err);
          }
        }
      }
      
      // 2. Hapus catatan absensi (Izin/Sakit) pada rentang tanggal tersebut
      // Kita set end date ke ujung hari agar semua absensi di hari terakhir ikut terhapus
      const endDate = new Date(d.tanggalSelesai);
      endDate.setHours(23, 59, 59, 999);
      
      await db.delete(absensi).where(
        and(
          eq(absensi.idSantri, d.idSantri),
          gte(absensi.waktuScan, d.tanggalMulai),
          lte(absensi.waktuScan, endDate),
          inArray(absensi.statusKehadiran, ['izin', 'sakit'])
        )
      );
    }

    // 3. Hapus rekam perizinan
    await db.delete(perizinanSantri).where(inArray(perizinanSantri.id, ids));
    revalidatePath('/laporan-absensi/perizinan');
    return { success: true, message: `Berhasil menghapus ${ids.length} laporan perizinan beserta catatan absensinya` };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Terjadi kesalahan sistem saat menghapus perizinan" };
  }
}

export async function updateDurasiPerizinan(id: string, tanggalMulaiStr: string, tanggalSelesaiStr: string): Promise<{success: boolean, message: string}> {
  try {
    const tanggalMulai = new Date(tanggalMulaiStr);
    const tanggalSelesai = new Date(tanggalSelesaiStr);
    
    tanggalMulai.setHours(0, 0, 0, 0);
    tanggalSelesai.setHours(23, 59, 59, 999);

    if (tanggalMulai > tanggalSelesai) {
      return { success: false, message: "Tanggal mulai tidak boleh lebih dari tanggal selesai" };
    }

    const [existing] = await db.select().from(perizinanSantri).where(eq(perizinanSantri.id, id));
    if (!existing) {
      return { success: false, message: "Data perizinan tidak ditemukan" };
    }

    // 1. Hapus catatan absensi lama
    const oldEndDate = new Date(existing.tanggalSelesai);
    oldEndDate.setHours(23, 59, 59, 999);
    await db.delete(absensi).where(
      and(
        eq(absensi.idSantri, existing.idSantri),
        gte(absensi.waktuScan, existing.tanggalMulai),
        lte(absensi.waktuScan, oldEndDate),
        inArray(absensi.statusKehadiran, ['izin', 'sakit'])
      )
    );

    // 2. Insert catatan absensi baru
    let current = new Date(tanggalMulai);
    while (current <= tanggalSelesai) {
      await db.insert(absensi).values({
        id: uuidv4(),
        idSantri: existing.idSantri,
        waktuScan: new Date(current),
        metodeScan: 'Portal Ortu', // pertahankan metode
        jenisAbsen: 'masuk',
        statusKehadiran: existing.kategori.toLowerCase()
      });
      current.setDate(current.getDate() + 1);
    }

    // 3. Update data perizinan
    await db.update(perizinanSantri)
      .set({ 
        tanggalMulai: tanggalMulai,
        tanggalSelesai: tanggalSelesai
      })
      .where(eq(perizinanSantri.id, id));

    revalidatePath('/laporan-absensi/perizinan');
    return { success: true, message: "Berhasil mengubah durasi perizinan dan memperbarui catatan absensi" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Gagal mengubah durasi perizinan" };
  }
}

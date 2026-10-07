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
  
  // Helper to get YYYY-MM-DD in WIB
  const getWibStr = (d: Date) => {
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
    return formatter.format(d);
  };

  let startDate: Date | undefined;
  let endDate: Date | undefined;

  switch (period) {
    case 'hari_ini': {
      const str = getWibStr(now);
      startDate = new Date(`${str}T00:00:00+07:00`);
      endDate = new Date(`${str}T23:59:59.999+07:00`);
      break;
    }
    case 'kemarin': {
      const kemarinDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const str = getWibStr(kemarinDate);
      startDate = new Date(`${str}T00:00:00+07:00`);
      endDate = new Date(`${str}T23:59:59.999+07:00`);
      break;
    }
    case 'minggu_ini': {
      const strToday = getWibStr(now);
      const todayLocal = new Date(`${strToday}T00:00:00+07:00`);
      const day = todayLocal.getDay();
      const diffToMonday = todayLocal.getDate() - day + (day === 0 ? -6 : 1);
      const mondayLocal = new Date(todayLocal);
      mondayLocal.setDate(diffToMonday);
      
      const strMonday = getWibStr(mondayLocal);
      startDate = new Date(`${strMonday}T00:00:00+07:00`);
      
      const sundayLocal = new Date(mondayLocal);
      sundayLocal.setDate(mondayLocal.getDate() + 6);
      const strSunday = getWibStr(sundayLocal);
      endDate = new Date(`${strSunday}T23:59:59.999+07:00`);
      break;
    }
    case 'bulan_ini': {
      const strToday = getWibStr(now);
      const y = parseInt(strToday.substring(0, 4));
      const m = parseInt(strToday.substring(5, 7));
      const firstDay = new Date(`${y}-${String(m).padStart(2, '0')}-01T00:00:00+07:00`);
      const nextMonth = m === 12 ? 1 : m + 1;
      const nextYear = m === 12 ? y + 1 : y;
      const firstDayNextMonth = new Date(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01T00:00:00+07:00`);
      const lastDay = new Date(firstDayNextMonth.getTime() - 1);
      startDate = firstDay;
      endDate = lastDay;
      break;
    }
    case 'triwulan': {
      const strToday = getWibStr(now);
      const y = parseInt(strToday.substring(0, 4));
      const m = parseInt(strToday.substring(5, 7));
      const quarter = Math.floor((m - 1) / 3);
      const startMonth = quarter * 3 + 1;
      const firstDay = new Date(`${y}-${String(startMonth).padStart(2, '0')}-01T00:00:00+07:00`);
      const nextStartMonth = startMonth + 3;
      const nextYear = nextStartMonth > 12 ? y + 1 : y;
      const nm = nextStartMonth > 12 ? 1 : nextStartMonth;
      const firstDayNextQ = new Date(`${nextYear}-${String(nm).padStart(2, '0')}-01T00:00:00+07:00`);
      const lastDay = new Date(firstDayNextQ.getTime() - 1);
      startDate = firstDay;
      endDate = lastDay;
      break;
    }
    case 'semester': {
      const strToday = getWibStr(now);
      const y = parseInt(strToday.substring(0, 4));
      const m = parseInt(strToday.substring(5, 7));
      const semester = Math.floor((m - 1) / 6);
      const startMonth = semester * 6 + 1;
      const firstDay = new Date(`${y}-${String(startMonth).padStart(2, '0')}-01T00:00:00+07:00`);
      const nextStartMonth = startMonth + 6;
      const nextYear = nextStartMonth > 12 ? y + 1 : y;
      const nm = nextStartMonth > 12 ? 1 : nextStartMonth;
      const firstDayNextS = new Date(`${nextYear}-${String(nm).padStart(2, '0')}-01T00:00:00+07:00`);
      const lastDay = new Date(firstDayNextS.getTime() - 1);
      startDate = firstDay;
      endDate = lastDay;
      break;
    }
    case 'tahun_ini': {
      const strToday = getWibStr(now);
      const y = parseInt(strToday.substring(0, 4));
      startDate = new Date(`${y}-01-01T00:00:00+07:00`);
      endDate = new Date(`${y}-12-31T23:59:59.999+07:00`);
      break;
    }
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
    const startStr = tanggalMulaiStr.substring(0, 10);
    const endStr = tanggalSelesaiStr.substring(0, 10);
    
    const tanggalMulai = new Date(startStr + "T00:00:00+07:00");
    const tanggalSelesai = new Date(endStr + "T23:59:59+07:00");

    if (tanggalMulai > tanggalSelesai) {
      return { success: false, message: "Tanggal mulai tidak boleh lebih dari tanggal selesai" };
    }

    const [existing] = await db.select().from(perizinanSantri).where(eq(perizinanSantri.id, id));
    if (!existing) {
      return { success: false, message: "Data perizinan tidak ditemukan" };
    }

    // 1. Hapus catatan absensi lama
    const oldEndDate = new Date(existing.tanggalSelesai);
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
      current.setUTCDate(current.getUTCDate() + 1);
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

export async function getActiveSantriOptions() {
  try {
    const data = await db.select({
      id: santri.id,
      namaLengkap: santri.namaLengkap,
      nomorInduk: santri.nomorInduk,
    }).from(santri).where(eq(santri.statusSantri, 'aktif')).orderBy(santri.namaLengkap);
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
}

export async function createPerizinanManual(idSantri: string, kategori: string, tanggalMulaiStr: string, tanggalSelesaiStr: string, keterangan: string) {
  try {
    if (!idSantri || !kategori || !tanggalMulaiStr || !tanggalSelesaiStr || !keterangan) {
      return { success: false, message: "Semua form wajib diisi" };
    }

    const startStr = tanggalMulaiStr.substring(0, 10);
    const endStr = tanggalSelesaiStr.substring(0, 10);
    
    const tanggalMulai = new Date(startStr + "T00:00:00+07:00");
    const tanggalSelesai = new Date(endStr + "T23:59:59+07:00");

    if (tanggalMulai > tanggalSelesai) {
      return { success: false, message: "Tanggal mulai tidak boleh lebih dari tanggal selesai" };
    }

    // Insert ke perizinan_santri
    await db.insert(perizinanSantri).values({
      id: uuidv4(),
      idSantri,
      kategori,
      tanggalMulai,
      tanggalSelesai,
      keterangan,
      buktiUrl: null, // Tanpa bukti
      waktuPengajuan: new Date()
    });

    // Loop insert ke absensi
    let current = new Date(tanggalMulai);
    while (current <= tanggalSelesai) {
      await db.insert(absensi).values({
        id: uuidv4(),
        idSantri,
        waktuScan: new Date(current),
        metodeScan: 'Manual Admin',
        jenisAbsen: 'masuk',
        statusKehadiran: kategori.toLowerCase()
      });
      current.setUTCDate(current.getUTCDate() + 1);
    }

    revalidatePath('/laporan-absensi/perizinan');
    return { success: true, message: "Berhasil menambahkan laporan perizinan manual" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Terjadi kesalahan sistem saat menyimpan data" };
  }
}

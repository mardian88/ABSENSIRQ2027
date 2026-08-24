import { db } from "@/db";
import { perizinanSantri, hariLibur, pengaturanHariAktif, absensi, santri } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { and, eq, lte, gte } from "drizzle-orm";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function cekStatusLiburIzin() {
  const options = { timeZone: "Asia/Jakarta" };
  const rawNow = new Date();
  
  const hariIniStr = rawNow.toLocaleDateString("id-ID", { weekday: "long", ...options });
  const hariIni = hariIniStr.charAt(0).toUpperCase() + hariIniStr.slice(1).toLowerCase();

  const dateFormatter = new Intl.DateTimeFormat('en-CA', { ...options, year: 'numeric', month: '2-digit', day: '2-digit' });
  const todayStr = dateFormatter.format(rawNow);

  // A. Cek apakah hari ini adalah hari aktif
  const aktifHariIni = await db.select().from(pengaturanHariAktif)
    .where(eq(pengaturanHariAktif.hari, hariIni))
    .limit(1);
    
  if (aktifHariIni.length > 0 && !aktifHariIni[0].isAktif) {
    return { isLibur: true, message: `Afwan, Hari ini (${hariIni}) Libur KBM, dan tidak perlu izin.` };
  }

  // B. Cek apakah hari ini adalah libur khusus (libur tanggal)
  const liburTanggal = await db.select().from(hariLibur)
    .where(and(eq(hariLibur.tanggal, todayStr), eq(hariLibur.isAktif, true)))
    .limit(1);

  if (liburTanggal.length > 0) {
    return { isLibur: true, message: `Afwan, Hari ini Libur KBM (${liburTanggal[0].keterangan}), dan tidak perlu izin.` };
  }

  return { isLibur: false };
}

export async function submitIzin(formData: FormData) {
  const idSantri = formData.get("idSantri") as string;
  const kategori = formData.get("kategori") as string;
  const keterangan = formData.get("keterangan") as string;
  const jumlahHariStr = formData.get("jumlahHari") as string;
  const buktiFile = formData.get("buktiFile") as File | null;

  if (!idSantri || !kategori || !keterangan || !jumlahHariStr) {
    return { success: false, message: "Data tidak lengkap" };
  }

  const jumlahHari = parseInt(jumlahHariStr, 10);
  if (isNaN(jumlahHari) || jumlahHari < 1 || jumlahHari > 9) {
    return { success: false, message: "Jumlah hari tidak valid" };
  }

  const options = { timeZone: "Asia/Jakarta" };
  const rawNow = new Date();
  
  const hariIniStr = rawNow.toLocaleDateString("id-ID", { weekday: "long", ...options });
  const hariIni = hariIniStr.charAt(0).toUpperCase() + hariIniStr.slice(1).toLowerCase();

  const dateFormatter = new Intl.DateTimeFormat('en-CA', { ...options, year: 'numeric', month: '2-digit', day: '2-digit' });
  const todayStr = dateFormatter.format(rawNow);

  // --- VALIDASI HARI LIBUR ---
  const aktifHariIni = await db.select().from(pengaturanHariAktif)
    .where(eq(pengaturanHariAktif.hari, hariIni))
    .limit(1);
    
  if (aktifHariIni.length > 0 && !aktifHariIni[0].isAktif) {
    return { success: false, message: `Hari ini (${hariIni}) adalah hari libur KBM. Tidak perlu mengajukan izin.` };
  }

  const liburTanggal = await db.select().from(hariLibur)
    .where(and(eq(hariLibur.tanggal, todayStr), eq(hariLibur.isAktif, true)))
    .limit(1);

  if (liburTanggal.length > 0) {
    return { success: false, message: `Hari ini sedang libur (${liburTanggal[0].keterangan}). Tidak perlu mengajukan izin.` };
  }

  // --- VALIDASI IZIN GANDA ---
  const startDate = new Date(`${todayStr}T00:00:00.000+07:00`);
  
  const targetDate = new Date(startDate);
  targetDate.setDate(targetDate.getDate() + (jumlahHari - 1));
  const targetStr = dateFormatter.format(targetDate);
  const endDate = new Date(`${targetStr}T23:59:59.999+07:00`);

  const existingIzin = await db.select().from(perizinanSantri)
    .where(
      and(
        eq(perizinanSantri.idSantri, idSantri),
        gte(perizinanSantri.tanggalSelesai, startDate),
        lte(perizinanSantri.tanggalMulai, endDate)
      )
    );

  if (existingIzin.length > 0) {
    return { success: false, message: "Santri sudah memiliki izin aktif pada rentang tanggal ini." };
  }

  let buktiUrl: string | null = null;
  if (buktiFile && buktiFile.size > 0) {
    if (!buktiFile.type.startsWith('image/')) {
       return { success: false, message: "File bukti harus berupa gambar (JPG, PNG, dll)" };
    }
    
    try {
      const buffer = Buffer.from(await buktiFile.arrayBuffer());
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: "izin_santri" },
          (error, result) => {
            if (error || !result) reject(error || new Error("Unknown upload error"));
            else resolve(result);
          }
        ).end(buffer);
      });

      buktiUrl = uploadResult.secure_url;
    } catch (e) {
      console.error("Gagal mengunggah bukti ke Cloudinary:", e);
      return { success: false, message: "Gagal mengunggah bukti gambar" };
    }
  }

  // Insert to perizinan_santri
  await db.insert(perizinanSantri).values({
    id: uuidv4(),
    idSantri,
    kategori,
    keterangan,
    tanggalMulai: startDate,
    tanggalSelesai: endDate,
    buktiUrl,
    waktuPengajuan: rawNow
  });

  // Loop through days from start to end and insert to absensi
  let current = new Date(startDate);
  while (current <= endDate) {
    await db.insert(absensi).values({
      id: uuidv4(),
      idSantri,
      waktuScan: new Date(current),
      metodeScan: 'Portal Ortu',
      jenisAbsen: 'masuk',
      statusKehadiran: kategori.toLowerCase(),
    });
    // Add one day
    current.setDate(current.getDate() + 1);
  }

  return { success: true, message: "Izin berhasil diajukan" };
}

export async function getRiwayatIzin(idSantri: string) {
  const data = await db.select().from(perizinanSantri).where(eq(perizinanSantri.idSantri, idSantri));
  return data.map(d => ({
    ...d,
    status: (new Date() >= d.tanggalMulai && new Date() <= d.tanggalSelesai) ? 'aktif' : (new Date() > d.tanggalSelesai ? 'selesai' : 'mendatang')
  })).sort((a, b) => b.waktuPengajuan.getTime() - a.waktuPengajuan.getTime());
}

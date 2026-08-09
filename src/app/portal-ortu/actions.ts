"use server";

import { db } from "@/db";
import { santri, perizinanSantri, absensi, pengaturanHumas, mutabaahSetoran, pengaturanHariAktif, hariLibur } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
import { sendTemplatedMessage } from "@/lib/fonnte";
import { halaqoh } from "@/db/schema";

export async function loginOrtu(nis: string) {
  const [data] = await db.select().from(santri).where(eq(santri.nomorInduk, nis)).limit(1);
  if (!data) return { success: false, message: "NIS tidak ditemukan" };

  // Set session cookie
  const cookieStore = await cookies();
  cookieStore.set("ortu_session", data.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/"
  });

  return { success: true, santri: data };
}

export async function getOrtuSession() {
  const cookieStore = await cookies();
  const idSantri = cookieStore.get("ortu_session")?.value;
  if (!idSantri) return null;

  const [data] = await db.select().from(santri).where(eq(santri.id, idSantri)).limit(1);
  return data || null;
}

export async function logoutOrtu() {
  const cookieStore = await cookies();
  cookieStore.delete("ortu_session");
  return { success: true };
}

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

  // --- PAKSA ZONA WAKTU LOKAL WIB (Asia/Jakarta) ---
  const options = { timeZone: "Asia/Jakarta" };
  const rawNow = new Date();
  
  // 1. Dapatkan nama hari dalam bahasa Indonesia (Cth: "Senin")
  const hariIniStr = rawNow.toLocaleDateString("id-ID", { weekday: "long", ...options });
  const hariIni = hariIniStr.charAt(0).toUpperCase() + hariIniStr.slice(1).toLowerCase();

  // 2. Dapatkan string tanggal format YYYY-MM-DD
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { ...options, year: 'numeric', month: '2-digit', day: '2-digit' });
  const todayStr = dateFormatter.format(rawNow);

  // 3. Konversi waktu spesifik hari ini di WIB untuk boundary (start/end)
  // Trick: Parse the WIB time string back to a Date object to get local values
  const wibTimeStr = rawNow.toLocaleString("en-US", { ...options }); 
  const now = new Date(wibTimeStr);
  
  // --- VALIDASI HARI LIBUR ---
  // A. Cek apakah hari ini adalah hari aktif
  const aktifHariIni = await db.select().from(pengaturanHariAktif)
    .where(eq(pengaturanHariAktif.hari, hariIni))
    .limit(1);
    
  if (aktifHariIni.length > 0 && !aktifHariIni[0].isAktif) {
    return { success: false, message: `Hari ini (${hariIni}) adalah hari libur KBM. Tidak perlu mengajukan izin.` };
  }

  // B. Cek apakah hari ini adalah libur khusus (libur tanggal)
  const liburTanggal = await db.select().from(hariLibur)
    .where(and(eq(hariLibur.tanggal, todayStr), eq(hariLibur.isAktif, true)))
    .limit(1);

  if (liburTanggal.length > 0) {
    return { success: false, message: `Hari ini sedang libur (${liburTanggal[0].keterangan}). Tidak perlu mengajukan izin.` };
  }

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const existing = await db.select().from(perizinanSantri)
    .where(
      and(
        eq(perizinanSantri.idSantri, idSantri),
        gte(perizinanSantri.waktuPengajuan, startOfToday),
        lte(perizinanSantri.waktuPengajuan, endOfToday)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return { success: false, message: "Anda sudah mengajukan izin hari ini. Silakan coba lagi besok untuk menghindari data ganda." };
  }

  let buktiUrl = null;
  if (buktiFile && buktiFile.size > 0) {
    try {
      const buffer = Buffer.from(await buktiFile.arrayBuffer());
      
      const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
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
    }
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(startDate.getDate() + (jumlahHari - 1));
  // endDate sudah dihitung di atas
  // now sudah ada di atas

  // Insert to perizinan_santri
  await db.insert(perizinanSantri).values({
    id: uuidv4(),
    idSantri,
    kategori,
    keterangan,
    tanggalMulai: startDate,
    tanggalSelesai: endDate,
    buktiUrl,
    waktuPengajuan: now
  });

  // Loop through days from start to end and insert to absensi
  let current = new Date(startDate);
  while (current <= endDate) {
    // Only insert if it's not Sunday (assuming Minggu is libur) - wait, let's just insert it anyway, reports can filter it
    await db.insert(absensi).values({
      id: uuidv4(),
      idSantri,
      waktuScan: new Date(current),
      metodeScan: 'Portal Ortu',
      jenisAbsen: 'masuk',
      statusKehadiran: kategori.toLowerCase()
    });
    current.setDate(current.getDate() + 1);
  }

  // -------------------------------------------------------------
  // Fonnte API Messaging for Izin
  // -------------------------------------------------------------
  const [santriData] = await db.select().from(santri).where(eq(santri.id, idSantri));
  if (santriData) {
    const [halaqohData] = santriData.idHalaqoh 
      ? await db.select().from(halaqoh).where(eq(halaqoh.id, santriData.idHalaqoh)) 
      : [null];

    const payload = {
      namaSantri: santriData.namaLengkap,
      nis: santriData.nomorInduk || "-",
      waktu: new Intl.DateTimeFormat('id-ID', { timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date()),
      tanggal: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(new Date()),
      halaqah: halaqohData ? halaqohData.namaHalaqoh : "Belum Ada Halaqoh",
      keterangan: `${kategori} - ${keterangan} (${jumlahHari} Hari)`
    };

    // 1. Keterangan Izin ke Orang Tua
    await sendTemplatedMessage(santriData.kontakOrtu, "izin_ortu", payload);

    // 2. Info Izin ke Admin
    const [humas] = await db.select().from(pengaturanHumas).limit(1);
    if (humas && humas.nomorAdmin && humas.isAktif) {
      await sendTemplatedMessage(humas.nomorAdmin, "izin_admin", payload);
    }

    // 3. Info Izin ke Guru
    if (halaqohData && halaqohData.kontakPengajar) {
      await sendTemplatedMessage(halaqohData.kontakPengajar, "izin_guru", payload);
    }
  }
  
  revalidatePath("/laporan-absensi");
  revalidatePath("/laporan-absensi/perizinan");

  return { success: true, message: "Pengajuan izin berhasil" };
}

export async function getRiwayatIzin(idSantri: string) {
  return await db.select()
    .from(perizinanSantri)
    .where(eq(perizinanSantri.idSantri, idSantri))
    .orderBy(desc(perizinanSantri.waktuPengajuan));
}

export async function updateFotoProfil(idSantri: string, formData: FormData): Promise<{success: boolean, message: string, url?: string}> {
  const fotoFile = formData.get("fotoFile") as File | null;
  if (!fotoFile || fotoFile.size === 0) return { success: false, message: "File kosong" };

  try {
    const buffer = Buffer.from(await fotoFile.arrayBuffer());
    
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "profil_santri" },
        (error, result) => {
          if (error || !result) reject(error || new Error("Unknown upload error"));
          else resolve(result);
        }
      ).end(buffer);
    });

    const newUrl = uploadResult.secure_url;
    await db.update(santri).set({ urlFotoWajah: newUrl }).where(eq(santri.id, idSantri));
    revalidatePath("/izin/dashboard");
    return { success: true, message: "Foto profil berhasil diperbarui", url: newUrl };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, message: "Gagal mengunggah foto profil" };
  }
}

export async function resetFotoProfil(idSantri: string): Promise<{success: boolean, message: string}> {
  try {
    // Optionally delete from cloudinary if it's a cloudinary URL, but we can skip it to be safe 
    // or if we had a specific function. We'll just reset DB.
    await db.update(santri).set({ urlFotoWajah: null }).where(eq(santri.id, idSantri));
    revalidatePath("/izin/dashboard");
    return { success: true, message: "Foto profil direset ke default" };
  } catch (error) {
    return { success: false, message: "Gagal mereset foto profil" };
  }
}


// --- MUTABAAH ACTIONS ---











export async function getMutabaahOrtuData() {
  const sessionSantri = await getOrtuSession();
  if (!sessionSantri) return null;
  const santriId = sessionSantri.id;

  try {
    const [santriData] = await db.select({
      id: santri.id,
      namaLengkap: santri.namaLengkap,
      nomorInduk: santri.nomorInduk,
      namaHalaqoh: halaqoh.namaHalaqoh
    })
    .from(santri)
    .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id))
    .where(eq(santri.id, santriId));

    if (!santriData) return null;

    const riwayat = await db.select()
      .from(mutabaahSetoran)
      .where(eq(mutabaahSetoran.idSantri, santriId))
      .orderBy(desc(mutabaahSetoran.waktuDibuat))
      .limit(100);

    return { profil: santriData, riwayat };
  } catch (err: any) {
    return null;
  }
}

export async function tandaiTelahDilihat(idSetoran: string, catatanOrtu: string) {
  const sessionSantri = await getOrtuSession();
  if (!sessionSantri) return { success: false, message: "Akses ditolak" };
  const santriId = sessionSantri.id;

  try {
    await db.update(mutabaahSetoran)
      .set({ isSeenByOrtu: true, catatanOrtu })
      .where(eq(mutabaahSetoran.id, idSetoran));
    
    revalidatePath("/portal-ortu/mutabaah");
    return { success: true, message: "Berhasil ditandai" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function tambahSetoranLiburOrtu(jenis: 'mengaji' | 'hafalan', capaian: string, tanggal: string) {
  const sessionSantri = await getOrtuSession();
  if (!sessionSantri) return { success: false, message: "Akses ditolak" };
  const santriId = sessionSantri.id;

  try {
    await db.insert(mutabaahSetoran).values({
      id: uuidv4(),
      idSantri: santriId,
      inputOleh: 'ortu',
      jenis,
      capaian,
      tanggal,
      isSeenByOrtu: true, // Otomatis checked karena ortu yang input
      waktuDibuat: new Date()
    });

    revalidatePath("/portal-ortu/mutabaah");
    return { success: true, message: "Setoran mandiri berhasil disimpan" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

"use server";

import { db } from "@/db";
import { santri, perizinanSantri, absensi, pengaturanHumas } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
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

  const now = new Date();
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
      const ext = path.extname(buktiFile.name) || '.jpg';
      const filename = `${uuidv4()}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'izin');
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(uploadDir, filename), buffer);
      buktiUrl = `/uploads/izin/${filename}`;
    } catch (e) {
      console.error("Gagal mengunggah bukti:", e);
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

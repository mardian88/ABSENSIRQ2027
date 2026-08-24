"use server";

import { db } from "@/db";
import { absensi, santri, halaqoh, sesiAbsensi, keluarga } from "@/db/schema";
import { eq, gte, and, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getSesiOptions() {
  const result = await db.select({
    id: sesiAbsensi.id,
    namaSesi: sesiAbsensi.namaSesi,
    jamMulai: sesiAbsensi.waktuMulaiMasuk,
  }).from(sesiAbsensi).orderBy(asc(sesiAbsensi.waktuMulaiMasuk));
  
  return result;
}

export async function getSantriBelumHadir(idSesi?: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role || "admin_cabang";
  const userCabang = session?.user?.idCabang;

  // Format WIB Start of Today
  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
  const wibDateString = dateFormatter.format(now);
  const startOfTodayWIB = new Date(`${wibDateString}T00:00:00.000+07:00`);

  // 1. Get all santri IDs that already have a record today (masuk, pulang, izin, alpa)
  const attendedRecords = await db.select({
    idSantri: absensi.idSantri
  })
  .from(absensi)
  .where(gte(absensi.waktuScan, startOfTodayWIB));

  const attendedIds = new Set(attendedRecords.map(r => r.idSantri));

  // 2. Fetch active santri (filter by cabang if applicable, and by sesi if provided)
  const conditions = [eq(santri.statusSantri, 'aktif')];
  if (role !== "superadmin" && userCabang) {
    conditions.push(eq(santri.idCabang, userCabang));
  }
  if (idSesi) {
    conditions.push(eq(santri.idSesiAbsensi, idSesi));
  }

  const allActiveSantri = await db.select({
    id: santri.id,
    nomorInduk: santri.nomorInduk,
    namaLengkap: santri.namaLengkap,
    halaqoh: halaqoh.namaHalaqoh,
    sesi: sesiAbsensi.namaSesi,
  })
  .from(santri)
  .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id))
  .leftJoin(sesiAbsensi, eq(santri.idSesiAbsensi, sesiAbsensi.id))
  .where(and(...conditions));

  // 3. Filter out those who attended
  let belumHadir = allActiveSantri.filter(s => !attendedIds.has(s.id));

  // 4. Get log pesan manual
  const logs = await db.select({
    idSantri: logPesanManual.idSantri,
    status: logPesanManual.status
  }).from(logPesanManual).where(
    and(
      eq(logPesanManual.tanggal, wibDateString),
      eq(logPesanManual.jenis, 'belum_hadir')
    )
  );

  const logMap = new Map(logs.map(l => [l.idSantri, l.status]));

  // Add statusPesan
  const belumHadirWithStatus = belumHadir.map(s => ({
    ...s,
    statusPesan: logMap.get(s.id) || null
  }));

  // 5. Sort by namaLengkap
  belumHadirWithStatus.sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap));

  return belumHadirWithStatus;
}

import { v4 as uuidv4 } from "uuid";
import { logPesanManual } from "@/db/schema";
import { sendTemplatedMessage } from "@/lib/fonnte";

export async function sendPesanBelumHadir(idSantri: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, message: "Unauthorized" };

  // Get santri details
  const [s] = await db.select({
    id: santri.id,
    namaLengkap: santri.namaLengkap,
    nomorInduk: santri.nomorInduk,
    nomorWhatsapp: keluarga.nomorWhatsapp,
    halaqoh: halaqoh.namaHalaqoh,
  })
  .from(santri)
  .leftJoin(keluarga, eq(santri.idKeluarga, keluarga.id))
  .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id))
  .where(eq(santri.id, idSantri));

  if (!s) return { success: false, message: "Santri tidak ditemukan" };
  if (!s.nomorWhatsapp) return { success: false, message: "Nomor WhatsApp tidak tersedia" };

  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
  const wibDateString = dateFormatter.format(now);

  // Check if already sent today
  const [existingLog] = await db.select().from(logPesanManual).where(
    and(
      eq(logPesanManual.idSantri, idSantri),
      eq(logPesanManual.tanggal, wibDateString),
      eq(logPesanManual.jenis, 'belum_hadir')
    )
  );

  if (existingLog) return { success: false, message: "Pesan sudah dikirim hari ini" };

  const timeFormatter = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' });
  const timeStr = timeFormatter.format(now);

  const payload = {
    namaSantri: s.namaLengkap,
    waktu: timeStr,
    tanggal: wibDateString,
    halaqah: s.halaqoh || "-",
    nis: s.nomorInduk || "-"
  };

  const result = await sendTemplatedMessage(s.nomorWhatsapp, "belum_datang", payload);
  
  if (result && result.success) {
    let fonnteId = (result as any).fonnteId || null;
    // Fonnte returns result.message as JSON string if we modified it? Wait, let's just save 'sent' or 'pending'
    await db.insert(logPesanManual).values({
      id: uuidv4(),
      idSantri: idSantri,
      fonnteId: fonnteId,
      jenis: 'belum_hadir',
      tanggal: wibDateString,
      status: 'terkirim', // The user uses 'terkirim' in UI
      createdAt: now,
      updatedAt: now
    });
    return { success: true, message: "Pesan berhasil dikirim" };
  } else {
    // If failed
    await db.insert(logPesanManual).values({
      id: uuidv4(),
      idSantri: idSantri,
      jenis: 'belum_hadir',
      tanggal: wibDateString,
      status: 'gagal',
      createdAt: now,
      updatedAt: now
    });
    return { success: false, message: result?.message || "Gagal mengirim pesan" };
  }
}


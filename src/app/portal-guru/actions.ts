"use server";

import { db } from "@/db";
import { guru, absensiGuru, kontrakGuru, kafalahBonus, perizinanSantri, santri, halaqoh } from "@/db/schema";
import { eq, and, desc, between, lte, gte, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

const GURU_SESSION_COOKIE = "guru_session";

export async function loginGuru(nip: string, kontakWa: string) {
  const [guruData] = await db.select().from(guru).where(
    and(eq(guru.nip, nip), eq(guru.kontakWa, kontakWa))
  );

  if (!guruData) {
    return { success: false, message: "NIP atau Nomor WA tidak sesuai." };
  }

  if (!guruData.statusAktif) {
    return { success: false, message: "Akun Anda berstatus Non-Aktif." };
  }

  // Set cookie
  (await cookies()).set(GURU_SESSION_COOKIE, guruData.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7 // 1 minggu
  });

  return { success: true };
}

export async function logoutGuru() {
  (await cookies()).delete(GURU_SESSION_COOKIE);
  return { success: true };
}

export async function getGuruSession() {
  const cookieStore = await cookies();
  const idGuru = cookieStore.get(GURU_SESSION_COOKIE)?.value;
  if (!idGuru) return null;

  const [guruData] = await db.select().from(guru).where(eq(guru.id, idGuru));
  if (!guruData) return null;

  return guruData;
}

export async function getGuruDashboardData() {
  const session = await getGuruSession();
  if (!session) return null;

  const idGuru = session.id;

  // Absensi 30 hari terakhir
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const absensiData = await db.select().from(absensiGuru).where(
    and(
      eq(absensiGuru.idGuru, idGuru),
      between(absensiGuru.waktuScan, thirtyDaysAgo, now)
    )
  ).orderBy(desc(absensiGuru.waktuScan)).limit(10);

  // Kontrak aktif
  const kontrakList = await db.select().from(kontrakGuru).where(
    eq(kontrakGuru.idGuru, idGuru)
  ).orderBy(desc(kontrakGuru.createdAt));

  return {
    profil: session,
    absensi: absensiData,
    kontrak: kontrakList
  };
}

export async function updateKontrakSignature(idKontrak: string, signatureUrl: string) {
  const session = await getGuruSession();
  if (!session) return { success: false, message: "Unauthorized" };

  try {
    await db.update(kontrakGuru).set({
      eSignUrl: signatureUrl,
      statusKontrak: 'aktif'
    }).where(
      and(eq(kontrakGuru.id, idKontrak), eq(kontrakGuru.idGuru, session.id))
    );
    revalidatePath("/portal-guru/kontrak");
    return { success: true, message: "Tanda tangan berhasil disimpan. Kontrak sekarang Aktif." };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function getSantriIzinHariIni() {
  const session = await getGuruSession();
  if (!session) return { success: false, data: [] };

  try {
    // Cari halaqoh yang diajar oleh guru ini
    const guruHalaqoh = await db.select({ id: halaqoh.id, namaHalaqoh: halaqoh.namaHalaqoh }).from(halaqoh).where(eq(halaqoh.idGuru, session.id));
    const halaqohIds = guruHalaqoh.map(h => h.id);

    if (halaqohIds.length === 0) return { success: true, data: [] };

    // Tentukan hari ini (mulai dari 00:00 sampai 23:59)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Dapatkan data perizinan aktif hari ini untuk santri di halaqoh guru tersebut
    const activeIzin = await db.select({
      id: perizinanSantri.id,
      kategori: perizinanSantri.kategori,
      tanggalMulai: perizinanSantri.tanggalMulai,
      tanggalSelesai: perizinanSantri.tanggalSelesai,
      keterangan: perizinanSantri.keterangan,
      buktiUrl: perizinanSantri.buktiUrl,
      waktuPengajuan: perizinanSantri.waktuPengajuan,
      santri: {
        namaLengkap: santri.namaLengkap,
        nomorInduk: santri.nomorInduk,
      },
      halaqoh: {
        namaHalaqoh: halaqoh.namaHalaqoh
      }
    })
    .from(perizinanSantri)
    .innerJoin(santri, eq(perizinanSantri.idSantri, santri.id))
    .innerJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id))
    .where(
      and(
        inArray(santri.idHalaqoh, halaqohIds),
        lte(perizinanSantri.tanggalMulai, endOfToday), // Mulai sebelum/pas hari ini berakhir
        gte(perizinanSantri.tanggalSelesai, today)     // Selesai setelah/pas hari ini dimulai
      )
    )
    .orderBy(desc(perizinanSantri.waktuPengajuan));

    return { success: true, data: activeIzin };
  } catch (err: any) {
    console.error("Error getSantriIzinHariIni:", err);
    return { success: false, data: [] };
  }
}

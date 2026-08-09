"use server";

import { db } from "@/db";
import { absensi, santri, halaqoh, sesiAbsensi } from "@/db/schema";
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
  const belumHadir = allActiveSantri.filter(s => !attendedIds.has(s.id));

  // 4. Sort by namaLengkap
  belumHadir.sort((a, b) => a.namaLengkap.localeCompare(b.namaLengkap));

  return belumHadir;
}

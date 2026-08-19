"use server";

import { db } from "@/db";
import { santri, guru } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getFaces() {
  const santriList = await db.select({
    id: santri.id,
    namaLengkap: santri.namaLengkap,
    dataVektorWajah: santri.dataVektorWajah,
  }).from(santri).where(eq(santri.statusSantri, "aktif"));

  const guruList = await db.select({
    id: guru.id,
    namaLengkap: guru.namaLengkap,
    dataVektorWajah: guru.dataVektorWajah,
  }).from(guru).where(eq(guru.statusAktif, true));

  const validSantri = santriList.filter((s: any) => s.dataVektorWajah !== null);
  const validGuru = guruList.filter((g: any) => g.dataVektorWajah !== null);

  return [...validSantri, ...validGuru];
}

export async function getAllActiveForRegistration() {
  const santriList = await db.select({
    id: santri.id,
    namaLengkap: santri.namaLengkap,
    nomorInduk: santri.nomorInduk,
  }).from(santri).where(eq(santri.statusSantri, "aktif"));
  
  return santriList;
}


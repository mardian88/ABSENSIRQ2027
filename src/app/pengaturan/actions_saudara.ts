"use server";

import { db } from "@/db";
import { keluarga, santri } from "@/db/schema";
import { eq, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function getKeluargaWithSantri() {
  const keluargaList = await db.select().from(keluarga).orderBy(keluarga.namaWali);
  const santriList = await db.select({
    id: santri.id,
    namaLengkap: santri.namaLengkap,
    idKeluarga: santri.idKeluarga,
    nomorInduk: santri.nomorInduk
  }).from(santri);

  return keluargaList.map(k => ({
    ...k,
    anggota: santriList.filter(s => s.idKeluarga === k.id)
  }));
}

export async function getSantriWithoutKeluarga() {
  return await db.select({
    id: santri.id,
    namaLengkap: santri.namaLengkap,
    nomorInduk: santri.nomorInduk
  }).from(santri).where(isNull(santri.idKeluarga)).orderBy(santri.namaLengkap);
}

export async function createKeluarga(namaKeluarga: string, santriIds: string[]) {
  const idKeluarga = uuidv4();
  
  await db.insert(keluarga).values({
    id: idKeluarga,
    namaWali: namaKeluarga
  });

  if (santriIds.length > 0) {
    for (const id of santriIds) {
      await db.update(santri).set({ idKeluarga }).where(eq(santri.id, id));
    }
  }

  revalidatePath("/pengaturan");
  return { success: true };
}

export async function removeSantriFromKeluarga(idSantri: string) {
  await db.update(santri).set({ idKeluarga: null }).where(eq(santri.id, idSantri));
  revalidatePath("/pengaturan");
  return { success: true };
}

export async function addSantriToKeluarga(idKeluarga: string, idSantri: string) {
  await db.update(santri).set({ idKeluarga }).where(eq(santri.id, idSantri));
  revalidatePath("/pengaturan");
  return { success: true };
}

export async function deleteKeluarga(idKeluarga: string) {
  // Unlink all santri first
  await db.update(santri).set({ idKeluarga: null }).where(eq(santri.idKeluarga, idKeluarga));
  
  // Delete the keluarga record
  await db.delete(keluarga).where(eq(keluarga.id, idKeluarga));
  
  revalidatePath("/pengaturan");
  return { success: true };
}

"use server";

import { db } from "@/db";
import { halaqoh, mutabaahSetoran, santri } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

const GURU_SESSION_COOKIE = "guru_session";

async function getSessionGuruId() {
  const c = await cookies();
  const guruId = c.get(GURU_SESSION_COOKIE)?.value;
  return guruId;
}

export async function getSantriHalaqohGuru() {
  const guruId = await getSessionGuruId();
  if (!guruId) return { success: false, data: [] };

  try {
    const listHalaqoh = await db.select().from(halaqoh).where(eq(halaqoh.idGuru, guruId));
    if (listHalaqoh.length === 0) return { success: true, data: [] };

    // Fetch santri
    const listSantri = await db.select({
      id: santri.id,
      namaLengkap: santri.namaLengkap,
      nomorInduk: santri.nomorInduk,
      namaHalaqoh: halaqoh.namaHalaqoh
    })
    .from(santri)
    .innerJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id))
    .where(eq(halaqoh.idGuru, guruId))
    .orderBy(santri.namaLengkap);

    return { success: true, data: listSantri };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function getRiwayatMutabaahGuru() {
  const guruId = await getSessionGuruId();
  if (!guruId) return { success: false, data: [] };

  try {
    const riwayat = await db.select({
      id: mutabaahSetoran.id,
      jenis: mutabaahSetoran.jenis,
      capaian: mutabaahSetoran.capaian,
      tanggal: mutabaahSetoran.tanggal,
      isSeenByOrtu: mutabaahSetoran.isSeenByOrtu,
      catatanOrtu: mutabaahSetoran.catatanOrtu,
      waktuDibuat: mutabaahSetoran.waktuDibuat,
      namaSantri: santri.namaLengkap
    })
    .from(mutabaahSetoran)
    .innerJoin(santri, eq(mutabaahSetoran.idSantri, santri.id))
    .where(eq(mutabaahSetoran.idGuru, guruId))
    .orderBy(desc(mutabaahSetoran.waktuDibuat))
    .limit(100);

    return { success: true, data: riwayat };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function tambahSetoranMutabaah(idSantri: string, jenis: 'mengaji' | 'hafalan', capaian: string, tanggal: string) {
  const guruId = await getSessionGuruId();
  if (!guruId) return { success: false, message: "Akses ditolak" };

  try {
    await db.insert(mutabaahSetoran).values({
      id: uuidv4(),
      idSantri,
      idGuru: guruId,
      inputOleh: 'guru',
      jenis,
      capaian,
      tanggal,
      waktuDibuat: new Date()
    });

    revalidatePath("/portal-guru/mutabaah");
    return { success: true, message: "Setoran berhasil disimpan" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

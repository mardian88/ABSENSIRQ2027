"use server";

import { db } from "@/db";
import { halaqoh, santri, sesiAbsensi } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function getHalaqohList() {
  // Ambil semua halaqoh
  const halaqohs = await db
    .select()
    .from(halaqoh)
    .orderBy(desc(halaqoh.id));

  // Ambil semua santri yang aktif
  const allSantri = await db
    .select({
      id: santri.id,
      namaLengkap: santri.namaLengkap,
      nomorInduk: santri.nomorInduk,
      jenjangSekolah: santri.jenjangSekolah,
      kelasSekolah: santri.kelasSekolah,
      idHalaqoh: santri.idHalaqoh,
    })
    .from(santri)
    .where(eq(santri.statusSantri, 'aktif'))
    .orderBy(santri.namaLengkap);

  // Ambil data sesi absensi
  const sesiList = await db.select().from(sesiAbsensi);

  // Petakan santri ke dalam halaqoh masing-masing
  const mappedHalaqoh = halaqohs.map(h => {
    const santriList = allSantri.filter(s => s.idHalaqoh === h.id);
    const sesi = sesiList.find(s => s.id === h.idSesiAbsensi);
    return {
      id: h.id,
      namaHalaqoh: h.namaHalaqoh,
      namaPengajar: h.namaPengajar,
      idSesiAbsensi: h.idSesiAbsensi,
      sesi: sesi ? { namaSesi: sesi.namaSesi, waktuMulaiMasuk: sesi.waktuMulaiMasuk, waktuMulaiPulang: sesi.waktuMulaiPulang } : null,
      jumlahSantri: santriList.length,
      santri: santriList
    };
  });

  // Santri yang belum ada halaqoh (idHalaqoh null atau tidak ada di halaqoh manapun)
  const unassignedSantri = allSantri.filter(s => !s.idHalaqoh);

  return {
    halaqohs: mappedHalaqoh,
    unassigned: unassignedSantri,
    sesiList: sesiList.map(s => ({ id: s.id, namaSesi: s.namaSesi }))
  };
}

export async function updateSantriHalaqoh(idSantri: string, idHalaqoh: string | null) {
  let targetSesiId = null;

  if (idHalaqoh) {
    const targetHalaqoh = await db.select().from(halaqoh).where(eq(halaqoh.id, idHalaqoh)).limit(1);
    if (targetHalaqoh.length > 0) {
      targetSesiId = targetHalaqoh[0].idSesiAbsensi;
    }
  }

  await db.update(santri)
    .set({ 
      idHalaqoh,
      idSesiAbsensi: targetSesiId // Sesuaikan sesi absensi santri dengan halaqohnya
    })
    .where(eq(santri.id, idSantri));
  revalidatePath("/halaqoh");
}

export async function createHalaqoh(data: { namaHalaqoh: string, namaPengajar: string, idSesiAbsensi?: string | null }) {
  await db.insert(halaqoh).values({
    id: uuidv4(),
    namaHalaqoh: data.namaHalaqoh,
    namaPengajar: data.namaPengajar,
    idSesiAbsensi: data.idSesiAbsensi || null
  });
  revalidatePath("/halaqoh");
}

export async function updateHalaqoh(id: string, data: { namaHalaqoh: string, namaPengajar: string, idSesiAbsensi?: string | null }) {
  await db.update(halaqoh).set({
    namaHalaqoh: data.namaHalaqoh,
    namaPengajar: data.namaPengajar,
    idSesiAbsensi: data.idSesiAbsensi || null
  }).where(eq(halaqoh.id, id));
  revalidatePath("/halaqoh");
}

export async function deleteHalaqoh(id: string) {
  // Optional: Reset id_halaqoh in santri before deleting
  await db.update(santri).set({ idHalaqoh: null }).where(eq(santri.idHalaqoh, id));
  await db.delete(halaqoh).where(eq(halaqoh.id, id));
  revalidatePath("/halaqoh");
}

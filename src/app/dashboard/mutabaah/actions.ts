"use server";

import { db } from "@/db";
import { mutabaahSetoran, santri, halaqoh, guru } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getSemuaMutabaahAdmin() {
  try {
    const data = await db.select({
      id: mutabaahSetoran.id,
      jenis: mutabaahSetoran.jenis,
      capaian: mutabaahSetoran.capaian,
      tanggal: mutabaahSetoran.tanggal,
      inputOleh: mutabaahSetoran.inputOleh,
      isSeenByOrtu: mutabaahSetoran.isSeenByOrtu,
      catatanOrtu: mutabaahSetoran.catatanOrtu,
      namaSantri: santri.namaLengkap,
      namaHalaqoh: halaqoh.namaHalaqoh,
      namaGuru: guru.namaLengkap
    })
    .from(mutabaahSetoran)
    .innerJoin(santri, eq(mutabaahSetoran.idSantri, santri.id))
    .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id))
    .leftJoin(guru, eq(mutabaahSetoran.idGuru, guru.id))
    .orderBy(desc(mutabaahSetoran.waktuDibuat))
    .limit(200);

    return { success: true, data };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

"use server";

import { db } from "@/db";
import { raportSantri, santri, halaqoh, semester, tahsinMaster, pengaturanRaport } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getAdminInputData(idHalaqah: string, idSemester: string) {
  // Fetch Santri in this halaqah
  const santriList = await db.select().from(santri).where(eq(santri.idHalaqoh, idHalaqah));
  
  // Fetch existing Raport for this semester
  const raportList = await db.select().from(raportSantri)
    .where(and(eq(raportSantri.idSemester, idSemester), eq(raportSantri.idHalaqah, idHalaqah)));
    
  // Fetch Tahsin items (Global or specific to halaqah)
  const tahsinItems = await db.select().from(tahsinMaster).where(eq(tahsinMaster.isAktif, true));
  
  // Fetch Pengaturan for Bobot
  const pengaturan = await db.select().from(pengaturanRaport).limit(1);
  const bobot = pengaturan[0] || { bobotAkhlak: 20, bobotKedisiplinan: 20, bobotKognitif: 60 };
  
  // Map Data
  const data = santriList.map(s => {
    const existing = raportList.find(r => r.idSantri === s.id);
    return {
      idSantri: s.id,
      namaSantri: s.namaLengkap,
      nis: s.nomorInduk,
      raport: existing || null
    };
  });
  
  return { santriData: data, tahsinItems, bobot };
}

export async function saveAdminInput(data: any[]) {
  for (const item of data) {
    if (item.idRaport) {
      await db.update(raportSantri).set(item.payload).where(eq(raportSantri.id, item.idRaport));
    } else {
      await db.insert(raportSantri).values(item.payload);
    }
  }
  return { success: true };
}

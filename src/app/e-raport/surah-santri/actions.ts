"use server";

import { db } from "@/db";
import { santri, santriSurah, surahMaster, halaqoh } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function getSurahAssignments(idHalaqah: string) {
  // Fetch Santri in this halaqah
  const santriList = await db.select().from(santri).where(eq(santri.idHalaqoh, idHalaqah));
  
  // Fetch assignments
  const allAssignments = await db.select().from(santriSurah);
  
  // Map assignments to santri
  const result = santriList.map(s => {
    const assigned = allAssignments.filter(a => a.idSantri === s.id && a.isAktif).map(a => a.idSurah);
    return {
      idSantri: s.id,
      namaSantri: s.namaLengkap,
      nis: s.nomorInduk,
      assignedSurahIds: assigned
    };
  });
  
  return result;
}

export async function getAllSurah() {
  return await db.select().from(surahMaster).where(eq(surahMaster.isAktif, true));
}

export async function saveSurahAssignments(idSantri: string, newSurahIds: string[]) {
  // Deactivate all existing assignments for this santri
  // Wait, Drizzle SQLite doesn't natively support easy upsert for this without a lot of logic.
  // Easiest is delete and insert, OR mark as inactive.
  
  // For simplicity and since we don't need historical tracking of assignments right now,
  // let's just delete existing and insert new ones.
  await db.delete(santriSurah).where(eq(santriSurah.idSantri, idSantri));
  
  if (newSurahIds.length > 0) {
    const inserts = newSurahIds.map(surahId => ({
      id: uuidv4(),
      idSantri,
      idSurah: surahId,
      isAktif: true
    }));
    await db.insert(santriSurah).values(inserts);
  }
  
  return { success: true };
}

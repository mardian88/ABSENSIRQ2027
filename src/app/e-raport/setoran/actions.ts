"use server";

import { db } from "@/db";
import { 
  santri, santriSurah, surahMaster, raportSantri, raportTahfidzProgress, pengaturanRaport
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function getSetoranData(idHalaqah: string, idSemester: string) {
  // 1. Santri in halaqah
  const santriList = await db.select().from(santri).where(eq(santri.idHalaqoh, idHalaqah));
  const santriIds = santriList.map(s => s.id);
  if (santriIds.length === 0) return { santriData: [], skalaPenilaian: [] };

  // 2. Surah assignments per santri
  const allAssignments = await db.select({
    id: santriSurah.id,
    idSantri: santriSurah.idSantri,
    idSurah: surahMaster.id,
    namaSurah: surahMaster.namaSurah,
    namaArab: surahMaster.namaArab,
    nomorSurah: surahMaster.nomorSurah,
    jumlahAyat: surahMaster.jumlahAyat,
  })
  .from(santriSurah)
  .innerJoin(surahMaster, eq(santriSurah.idSurah, surahMaster.id))
  .where(and(inArray(santriSurah.idSantri, santriIds), eq(santriSurah.isAktif, true)));

  // 3. Existing raport entries for this semester + halaqah
  const raportList = await db.select().from(raportSantri)
    .where(and(eq(raportSantri.idSemester, idSemester), eq(raportSantri.idHalaqah, idHalaqah)));

  // 4. Existing tahfidz progress
  const raportIds = raportList.map(r => r.id);
  let allProgress: any[] = [];
  if (raportIds.length > 0) {
    allProgress = await db.select().from(raportTahfidzProgress)
      .where(inArray(raportTahfidzProgress.idRaport, raportIds));
  }

  // 5. Pengaturan for skala penilaian
  const pengaturanList = await db.select().from(pengaturanRaport).limit(1);
  let skalaPenilaian: any[] = [];
  if (pengaturanList[0]?.skalaPenilaian) {
    try { skalaPenilaian = JSON.parse(pengaturanList[0].skalaPenilaian); } catch(e) {}
  }

  // 6. Combine
  const santriData = santriList.map(s => {
    const raport = raportList.find(r => r.idSantri === s.id);
    const assignments = allAssignments.filter(a => a.idSantri === s.id);

    const surahProgress = assignments.map(a => {
      const progress = raport 
        ? allProgress.find(p => p.idRaport === raport.id && p.idSurah === a.idSurah) 
        : null;
      return {
        idSurah: a.idSurah,
        namaSurah: a.namaSurah,
        namaArab: a.namaArab,
        nomorSurah: a.nomorSurah,
        jumlahAyat: a.jumlahAyat,
        // Existing progress
        idProgress: progress?.id || null,
        statusSetoran: progress?.statusSetoran || "",
        nilaiKb: progress?.nilaiKb ?? null,
        predikatKb: progress?.predikatKb || "",
        catatanKb: progress?.catatanKb || "",
        nilaiKh: progress?.nilaiKh ?? null,
        predikatKh: progress?.predikatKh || "",
        catatanKh: progress?.catatanKh || "",
      };
    });

    return {
      idSantri: s.id,
      namaSantri: s.namaLengkap,
      nis: s.nomorInduk,
      idRaport: raport?.id || null,
      surahProgress,
    };
  });

  return { santriData, skalaPenilaian };
}

export async function saveSetoranProgress(
  idSantri: string, 
  idSemester: string, 
  idHalaqah: string,
  progressList: {
    idSurah: string;
    idProgress: string | null;
    statusSetoran: string;
    nilaiKb: number | null;
    predikatKb: string;
    catatanKb: string;
    nilaiKh: number | null;
    predikatKh: string;
    catatanKh: string;
  }[]
) {
  // 1. Ensure raport_santri record exists
  let raportList = await db.select().from(raportSantri)
    .where(and(
      eq(raportSantri.idSantri, idSantri), 
      eq(raportSantri.idSemester, idSemester),
      eq(raportSantri.idHalaqah, idHalaqah)
    ));
  
  let idRaport: string;
  if (raportList.length === 0) {
    idRaport = uuidv4();
    await db.insert(raportSantri).values({
      id: idRaport,
      idSantri,
      idSemester,
      idHalaqah,
      sakit: 0,
      izin: 0,
      alpa: 0,
      jumlahHariEfektif: 0,
      waktuDibuat: new Date(),
      diperbaruiPada: new Date(),
    });
  } else {
    idRaport = raportList[0].id;
  }

  // 2. Upsert each surah progress
  for (const item of progressList) {
    if (item.idProgress) {
      // Update existing
      await db.update(raportTahfidzProgress).set({
        statusSetoran: item.statusSetoran,
        nilaiKb: item.nilaiKb,
        predikatKb: item.predikatKb,
        catatanKb: item.catatanKb,
        nilaiKh: item.nilaiKh,
        predikatKh: item.predikatKh,
        catatanKh: item.catatanKh,
      }).where(eq(raportTahfidzProgress.id, item.idProgress));
    } else {
      // Insert new
      await db.insert(raportTahfidzProgress).values({
        id: uuidv4(),
        idRaport,
        idSurah: item.idSurah,
        statusSetoran: item.statusSetoran,
        nilaiKb: item.nilaiKb,
        predikatKb: item.predikatKb,
        catatanKb: item.catatanKb,
        nilaiKh: item.nilaiKh,
        predikatKh: item.predikatKh,
        catatanKh: item.catatanKh,
      });
    }
  }

  return { success: true };
}

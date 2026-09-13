"use server";

import { db } from "@/db";
import { 
  raportSantri, 
  santri, 
  halaqoh, 
  semester, 
  tahunAjaran,
  tahsinMaster, 
  pengaturanRaport,
  santriSurah,
  surahMaster,
  raportTahfidzProgress
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

export async function getLegerData(idHalaqah: string, idSemester: string) {
  // 1. Fetch Master Data
  const halaqahData = await db.select().from(halaqoh).where(eq(halaqoh.id, idHalaqah)).limit(1);
  const semesterData = await db.select().from(semester).where(eq(semester.id, idSemester)).limit(1);
  const pengaturanList = await db.select().from(pengaturanRaport).limit(1);
  const pengaturan = pengaturanList[0] || null;
  const tahsinItems = await db.select().from(tahsinMaster).where(eq(tahsinMaster.isAktif, true));
  
  let idTahunAjaran = semesterData[0]?.idTahunAjaran;
  let tahunAjaranData = null;
  if (idTahunAjaran) {
    const ta = await db.select().from(tahunAjaran).where(eq(tahunAjaran.id, idTahunAjaran)).limit(1);
    tahunAjaranData = ta[0];
  }

  // 2. Fetch Santri
  const santriList = await db.select().from(santri).where(eq(santri.idHalaqoh, idHalaqah));
  
  // 3. Fetch Admin Input (Raport)
  const raportList = await db.select().from(raportSantri)
    .where(and(eq(raportSantri.idSemester, idSemester), eq(raportSantri.idHalaqah, idHalaqah)));

  // 4. Fetch Surah Assignments & Progress
  const santriIds = santriList.map(s => s.id);
  
  let allSurahAssignments: any[] = [];
  let allSurahProgress: any[] = [];
  
  if (santriIds.length > 0) {
    allSurahAssignments = await db.select({
      idSantri: santriSurah.idSantri,
      idSurah: surahMaster.id,
      namaSurah: surahMaster.namaSurah,
      namaArab: surahMaster.namaArab,
      jumlahAyat: surahMaster.jumlahAyat,
    })
    .from(santriSurah)
    .innerJoin(surahMaster, eq(santriSurah.idSurah, surahMaster.id))
    .where(and(inArray(santriSurah.idSantri, santriIds), eq(santriSurah.isAktif, true)));

    const raportIds = raportList.map(r => r.id);
    if (raportIds.length > 0) {
      allSurahProgress = await db.select()
        .from(raportTahfidzProgress)
        .where(inArray(raportTahfidzProgress.idRaport, raportIds));
    }
  }

  // 5. Combine everything into Leger Rows
  const legerRows = santriList.map(s => {
    const raport = raportList.find(r => r.idSantri === s.id) || null;
    
    // Parse JSON
    let akhlak = { adab: 0, rajin: 0, rapi: 0 };
    let kedisiplinan = { waktu: 0, seragam: 0, ibadah: 0 };
    let kognitif = { uasTulis: 0, uasLisan: 0, tahsin: {} };
    
    if (raport) {
      if (raport.akhlak) akhlak = JSON.parse(raport.akhlak);
      if (raport.kedisiplinan) kedisiplinan = JSON.parse(raport.kedisiplinan);
      if (raport.kognitif) kognitif = JSON.parse(raport.kognitif);
    }
    
    // Hafalan Target vs Tercapai
    const assignments = allSurahAssignments.filter(a => a.idSantri === s.id);
    let targetCount = assignments.length;
    let tercapaiKb = 0;
    let tercapaiKh = 0;
    
    // Calculate averages (replicated logic from client, useful for leger table)
    const akVals = Object.values(akhlak) as number[];
    const akAvg = akVals.length ? akVals.reduce((a, b) => a + b, 0) / akVals.length : 0;
    
    const kdVals = Object.values(kedisiplinan) as number[];
    const kdAvg = kdVals.length ? kdVals.reduce((a, b) => a + b, 0) / kdVals.length : 0;
    
    const tahsinVals = Object.values(kognitif.tahsin) as number[];
    const tahsinAvg = tahsinVals.length ? tahsinVals.reduce((a, b) => a + b, 0) / tahsinVals.length : 0;
    const kgAvg = (tahsinAvg + kognitif.uasTulis + kognitif.uasLisan) / 3;
    
    const targetSurahDetail = assignments.map(a => {
      const progress = allSurahProgress.find(p => p.idRaport === raport?.id && p.idSurah === a.idSurah);
      if (progress?.kb) tercapaiKb++;
      if (progress?.kh) tercapaiKh++;
      
      return {
        ...a,
        kb: progress?.kb || false,
        kh: progress?.kh || false,
        nilai: progress?.nilai || 0,
        predikat: progress?.predikat || ''
      };
    });

    return {
      santri: s,
      raport: raport,
      akhlak,
      kedisiplinan,
      kognitif,
      averages: {
        akhlak: Math.round(akAvg),
        kedisiplinan: Math.round(kdAvg),
        kognitif: Math.round(kgAvg),
        tahsin: Math.round(tahsinAvg)
      },
      hafalan: {
        targetCount,
        tercapaiKb,
        tercapaiKh,
        detail: targetSurahDetail
      }
    };
  });

  return {
    meta: {
      halaqah: halaqahData[0],
      semester: semesterData[0],
      tahunAjaran: tahunAjaranData,
      pengaturan,
      tahsinItems
    },
    rows: legerRows
  };
}

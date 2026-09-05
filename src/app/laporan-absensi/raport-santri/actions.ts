'use server'

import { db } from "@/db";
import { 
  santri, halaqoh, user,
  pengaturanSemester, surahMaster, 
  pengaturanPredikatRaport, raportSantri, raportCapaianSurah
} from "@/db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

export async function getRaportData(idHalaqah?: string) {
  // 1. Get active semester
  const activeSemesters = await db.select().from(pengaturanSemester).where(eq(pengaturanSemester.isAktif, true)).limit(1);
  const activeSemester = activeSemesters[0] || null;

  // 2. Get all halaqahs for filter
  const allHalaqah = await db.select({
    id: halaqoh.id,
    nama: halaqoh.namaHalaqoh,
    namaMusyrif: halaqoh.namaPengajar
  })
  .from(halaqoh);

  // 3. Get all santri if halaqah is selected
  let santriList: any[] = [];
  if (idHalaqah) {
    santriList = await db.select({
      id: santri.id,
      namaLengkap: santri.namaLengkap,
      nis: santri.nomorInduk
    })
    .from(santri)
    .where(and(eq(santri.idHalaqoh, idHalaqah), eq(santri.statusSantri, 'aktif')))
    .orderBy(asc(santri.namaLengkap));
  }

  // 4. Get master surah
  const surahs = await db.select().from(surahMaster).orderBy(desc(surahMaster.juz), asc(surahMaster.urutanDalamJuz));

  // 5. Get predicates
  const predicates = await db.select().from(pengaturanPredikatRaport);

  return {
    activeSemester,
    allHalaqah,
    santriList,
    surahs,
    predicates
  };
}

export async function getCapaianSantri(idSantri: string, idSemester: string) {
  // Get report card header
  const headers = await db.select().from(raportSantri)
    .where(and(eq(raportSantri.idSantri, idSantri), eq(raportSantri.idSemester, idSemester)))
    .limit(1);
  
  const header = headers[0] || null;
  
  let details: any[] = [];
  if (header) {
    details = await db.select().from(raportCapaianSurah)
      .where(eq(raportCapaianSurah.idRaport, header.id));
  }

  return { header, details };
}

export async function saveCapaianSurah(
  idSantri: string, 
  idSemester: string, 
  idHalaqah: string,
  capaianData: any[] // array of capaian objects
) {
  try {
    // Check if header exists
    const headers = await db.select().from(raportSantri)
      .where(and(eq(raportSantri.idSantri, idSantri), eq(raportSantri.idSemester, idSemester)))
      .limit(1);
    
    let idRaport = headers[0]?.id;

    if (!idRaport) {
      idRaport = uuidv4();
      await db.insert(raportSantri).values({
        id: idRaport,
        idSantri,
        idSemester,
        idHalaqah,
        waktuDibuat: new Date(),
        diperbaruiPada: new Date()
      });
    } else {
      await db.update(raportSantri)
        .set({ idHalaqah, diperbaruiPada: new Date() })
        .where(eq(raportSantri.id, idRaport));
    }

    // Prepare inserts/updates
    for (const item of capaianData) {
      // check if exists
      const existing = await db.select().from(raportCapaianSurah)
        .where(and(eq(raportCapaianSurah.idRaport, idRaport), eq(raportCapaianSurah.idSurah, item.idSurah)))
        .limit(1);
      
      if (existing.length > 0) {
        await db.update(raportCapaianSurah).set({
          statusSetoran: item.statusSetoran,
          nilaiKb: item.nilaiKb,
          predikatKb: item.predikatKb,
          catatanKb: item.catatanKb,
          nilaiKh: item.nilaiKh,
          predikatKh: item.predikatKh,
          catatanKh: item.catatanKh,
          tanggalUjian: item.tanggalUjian,
          isVerifikasi: item.isVerifikasi
        }).where(eq(raportCapaianSurah.id, existing[0].id));
      } else {
        await db.insert(raportCapaianSurah).values({
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
          tanggalUjian: item.tanggalUjian,
          isVerifikasi: item.isVerifikasi
        });
      }
    }

    revalidatePath('/laporan-absensi/raport-santri');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

"use server";

import { db } from "@/db";
import { pengaturanRaport, tahunAjaran, semester, tahsinMaster } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

// ==============================
// PROFIL RAPORT
// ==============================
export async function getPengaturanRaport() {
  const result = await db.select().from(pengaturanRaport).limit(1);
  return result[0] || null;
}

export async function savePengaturanRaport(data: any) {
  const existing = await getPengaturanRaport();
  if (existing) {
    await db.update(pengaturanRaport).set(data).where(eq(pengaturanRaport.id, existing.id));
  } else {
    await db.insert(pengaturanRaport).values({
      id: uuidv4(),
      ...data
    });
  }
  revalidatePath("/pengaturan");
  return { success: true };
}

// ==============================
// TAHUN AJARAN & SEMESTER
// ==============================
export async function getTahunAjaranList() {
  return await db.select().from(tahunAjaran).orderBy(desc(tahunAjaran.waktuDibuat));
}

export async function createTahunAjaran(nama: string) {
  const id = uuidv4();
  await db.insert(tahunAjaran).values({
    id,
    nama,
    isAktif: false,
    waktuDibuat: new Date()
  });
  
  // Auto create Ganjil & Genap
  await db.insert(semester).values([
    {
      id: uuidv4(),
      idTahunAjaran: id,
      nama: "Ganjil",
      isAktif: false,
      jumlahHariEfektif: 100,
      waktuDibuat: new Date()
    },
    {
      id: uuidv4(),
      idTahunAjaran: id,
      nama: "Genap",
      isAktif: false,
      jumlahHariEfektif: 100,
      waktuDibuat: new Date()
    }
  ]);
  
  revalidatePath("/pengaturan");
  return { success: true };
}

export async function setActiveTahunAjaran(id: string) {
  await db.update(tahunAjaran).set({ isAktif: false });
  await db.update(tahunAjaran).set({ isAktif: true }).where(eq(tahunAjaran.id, id));
  
  // deactivate all semesters
  await db.update(semester).set({ isAktif: false });
  
  revalidatePath("/pengaturan");
  return { success: true };
}

export async function getSemesterList(idTahunAjaran: string) {
  return await db.select().from(semester).where(eq(semester.idTahunAjaran, idTahunAjaran));
}

export async function setActiveSemester(id: string) {
  await db.update(semester).set({ isAktif: false });
  await db.update(semester).set({ isAktif: true }).where(eq(semester.id, id));
  revalidatePath("/pengaturan");
  return { success: true };
}

export async function updateSemesterHariEfektif(id: string, jumlah: number) {
  await db.update(semester).set({ jumlahHariEfektif: jumlah }).where(eq(semester.id, id));
  revalidatePath("/pengaturan");
  return { success: true };
}

// ==============================
// ITEM TAHSIN
// ==============================
export async function getTahsinItems() {
  return await db.select().from(tahsinMaster).orderBy(tahsinMaster.urutan);
}

export async function saveTahsinItem(data: { id?: string, namaItem: string, urutan: number, isAktif: boolean }) {
  if (data.id) {
    await db.update(tahsinMaster).set({
      namaItem: data.namaItem,
      urutan: data.urutan,
      isAktif: data.isAktif
    }).where(eq(tahsinMaster.id, data.id));
  } else {
    await db.insert(tahsinMaster).values({
      id: uuidv4(),
      namaItem: data.namaItem,
      urutan: data.urutan,
      isAktif: data.isAktif
    });
  }
  revalidatePath("/pengaturan");
  return { success: true };
}

export async function deleteTahsinItem(id: string) {
  await db.delete(tahsinMaster).where(eq(tahsinMaster.id, id));
  revalidatePath("/pengaturan");
  return { success: true };
}

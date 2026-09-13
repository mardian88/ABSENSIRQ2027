"use server";

import { db } from "@/db";
import { guru, kontrakGuru } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getGuruList() {
  const session = await auth.api.getSession({ headers: await headers() });
  
  const query = db
    .select()
    .from(guru)
    .orderBy(desc(guru.id));

  const result = await query;
  return result.map(g => ({
    ...g,
    hasFaceData: !!g.dataVektorWajah
  }));
}

export async function addGuru(data: any) {
  const id = uuidv4();
  try {
    await db.insert(guru).values({
      id,
      nip: data.nip,
      namaLengkap: data.namaLengkap,
      kontakWa: data.kontakWa,
      jenisKelamin: data.jenisKelamin,
      tempatLahir: data.tempatLahir,
      tanggalLahir: data.tanggalLahir,
      alamat: data.alamat,
      statusAktif: data.statusAktif,
      kodeQr: data.nip, // Auto-assign QR = NIP
      tanggalMasuk: data.tanggalMasuk ? new Date(data.tanggalMasuk) : new Date(),
    });
    revalidatePath("/admin-guru");
    return { success: true, message: "Guru berhasil ditambahkan" };
  } catch (error: any) {
    console.error(error);
    return { success: false, message: error.message || "Gagal menambahkan guru" };
  }
}

export async function updateGuru(id: string, data: any) {
  try {
    await db.update(guru).set({
      nip: data.nip,
      namaLengkap: data.namaLengkap,
      kontakWa: data.kontakWa,
      jenisKelamin: data.jenisKelamin,
      tempatLahir: data.tempatLahir,
      tanggalLahir: data.tanggalLahir,
      alamat: data.alamat,
      statusAktif: data.statusAktif,
      tanggalMasuk: data.tanggalMasuk ? new Date(data.tanggalMasuk) : undefined,
    }).where(eq(guru.id, id));
    revalidatePath("/admin-guru");
    return { success: true, message: "Data guru berhasil diubah" };
  } catch (error: any) {
    return { success: false, message: error.message || "Gagal merubah data guru" };
  }
}

export async function deleteGurus(ids: string[]) {
  try {
    for (const id of ids) {
      await db.delete(kontrakGuru).where(eq(kontrakGuru.idGuru, id));
      await db.delete(guru).where(eq(guru.id, id));
    }
    revalidatePath("/admin-guru");
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function updateGuruFaceData(id: string, faceData: string) {
  try {
    await db.update(guru).set({
      dataVektorWajah: faceData
    }).where(eq(guru.id, id));
    revalidatePath("/admin-guru");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function getKontrakByGuruId(idGuru: string) {
  return await db.select().from(kontrakGuru).where(eq(kontrakGuru.idGuru, idGuru)).orderBy(desc(kontrakGuru.createdAt));
}

export async function saveKontrakGuru(data: any) {
  try {
    const isPermanen = data.jenisKontrak === 'permanen';
    
    if (data.id) {
      await db.update(kontrakGuru).set({
        jabatan: data.jabatan,
        jenisKontrak: data.jenisKontrak,
        tanggalMulai: isPermanen || !data.tanggalMulai ? null : new Date(data.tanggalMulai),
        tanggalSelesai: isPermanen || !data.tanggalSelesai ? null : new Date(data.tanggalSelesai),
        satuanKafalah: parseFloat(String(data.satuanKafalah).replace(/\./g, '')),
        statusKontrak: data.statusKontrak
      }).where(eq(kontrakGuru.id, data.id));
    } else {
      await db.insert(kontrakGuru).values({
        id: uuidv4(),
        idGuru: data.idGuru,
        jabatan: data.jabatan,
        jenisKontrak: data.jenisKontrak,
        tanggalMulai: isPermanen || !data.tanggalMulai ? null : new Date(data.tanggalMulai),
        tanggalSelesai: isPermanen || !data.tanggalSelesai ? null : new Date(data.tanggalSelesai),
        satuanKafalah: parseFloat(String(data.satuanKafalah).replace(/\./g, '')),
        statusKontrak: 'menunggu_ttd',
        createdAt: new Date()
      });
    }
    revalidatePath("/admin-guru");
    return { success: true, message: "Kontrak berhasil disimpan" };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

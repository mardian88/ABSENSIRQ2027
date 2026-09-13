"use server";

import { db } from "@/db";
import { pendaftar, santri } from "@/db/schema";
import { eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function terimaPendaftar(id: string) {
  const [dataPendaftar] = await db.select().from(pendaftar).where(eq(pendaftar.id, id));
  if (!dataPendaftar) return { success: false, message: "Data tidak ditemukan" };

  const yearPrefix = `0${new Date().getFullYear().toString().slice(-2)}`;
  let isUnique = false;
  let nipGenerator = '';
  
  while (!isUnique) {
    const random5 = Math.floor(10000 + Math.random() * 90000).toString(); // 5 digit random
    nipGenerator = `${yearPrefix}${random5}`;
    const [existing] = await db.select().from(santri).where(eq(santri.nomorInduk, nipGenerator));
    if (!existing) {
      isUnique = true;
    }
  }

  // Move to santri
  await db.insert(santri).values({
    id: uuidv4(),
    namaLengkap: dataPendaftar.namaLengkap,
    kontakOrtu: dataPendaftar.kontakOrtu,
    nomorInduk: nipGenerator,
    statusSantri: 'aktif',
    tempatLahir: dataPendaftar.tempatLahir,
    tanggalLahir: dataPendaftar.tanggalLahir,
    jenisKelamin: dataPendaftar.jenisKelamin,
    alamatLengkap: dataPendaftar.alamatLengkap,
    isAlamatDomisiliSama: dataPendaftar.isAlamatDomisiliSama,
    alamatDomisili: dataPendaftar.alamatDomisili,
    jenjangSekolah: dataPendaftar.jenjangSekolah,
    jenjangSekolahLainnya: dataPendaftar.jenjangSekolahLainnya,
    namaSekolah: dataPendaftar.namaSekolah,
    kelasSekolah: dataPendaftar.kelasSekolah,
    ikutLes: dataPendaftar.ikutLes,
    hariLes: dataPendaftar.hariLes,
    jamLesMulai: dataPendaftar.jamLesMulai,
    jamLesSelesai: dataPendaftar.jamLesSelesai,
    namaAyah: dataPendaftar.namaAyah,
    pekerjaanAyah: dataPendaftar.pekerjaanAyah,
    pekerjaanAyahLainnya: dataPendaftar.pekerjaanAyahLainnya,
    instansiAyah: dataPendaftar.instansiAyah,
    namaIbu: dataPendaftar.namaIbu,
    pekerjaanIbu: dataPendaftar.pekerjaanIbu,
    pekerjaanIbuLainnya: dataPendaftar.pekerjaanIbuLainnya,
    instansiIbu: dataPendaftar.instansiIbu,
  });

  // Delete pendaftar record
  await db.delete(pendaftar).where(eq(pendaftar.id, id));

  revalidatePath("/admin-psb");
  revalidatePath("/santri");
  return { success: true, message: "Pendaftar berhasil diterima" };
}

export async function tolakPendaftar(id: string) {
  await db.update(pendaftar).set({ status: 'ditolak' }).where(eq(pendaftar.id, id));
  revalidatePath("/admin-psb");
  return { success: true, message: "Pendaftar ditolak" };
}

export async function markAsRead(id: string) {
  await db.update(pendaftar).set({ isRead: true }).where(eq(pendaftar.id, id));
  revalidatePath("/admin-psb");
  return { success: true };
}

export async function getPsbCounts() {
  const all = await db.select().from(pendaftar).where(ne(pendaftar.status, 'diterima'));
  const unread = all.filter(p => !p.isRead).length;
  const read = all.filter(p => p.isRead).length;
  return { unread, read };
}

export async function deletePendaftar(ids: string[]) {
  for (const id of ids) {
    await db.delete(pendaftar).where(eq(pendaftar.id, id));
  }
  revalidatePath("/admin-psb");
  return { success: true };
}

export async function resetPendaftar() {
  await db.delete(pendaftar);
  revalidatePath("/admin-psb");
  return { success: true };
}

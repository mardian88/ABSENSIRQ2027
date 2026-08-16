"use server";

import { db } from "@/db";
import { santri, halaqoh } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getSantriList() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role || "admin_cabang";
  const userCabang = session?.user?.idCabang;

  let query = db
    .select({
      id: santri.id,
      nomorInduk: santri.nomorInduk,
      namaLengkap: santri.namaLengkap,
      kontakOrtu: santri.kontakOrtu,
      statusSantri: santri.statusSantri,
      halaqoh: halaqoh.namaHalaqoh,
      idHalaqoh: santri.idHalaqoh,
      idSesiAbsensi: santri.idSesiAbsensi,
      kodeQr: santri.kodeQr,
      hasFaceData: santri.dataVektorWajah,
      idCabang: santri.idCabang,
      tempatLahir: santri.tempatLahir,
      tanggalLahir: santri.tanggalLahir,
      jenisKelamin: santri.jenisKelamin,
      alamatLengkap: santri.alamatLengkap,
      isAlamatDomisiliSama: santri.isAlamatDomisiliSama,
      alamatDomisili: santri.alamatDomisili,
      jenjangSekolah: santri.jenjangSekolah,
      jenjangSekolahLainnya: santri.jenjangSekolahLainnya,
      namaSekolah: santri.namaSekolah,
      kelasSekolah: santri.kelasSekolah,
      ikutLes: santri.ikutLes,
      hariLes: santri.hariLes,
      jamLesMulai: santri.jamLesMulai,
      jamLesSelesai: santri.jamLesSelesai,
      namaAyah: santri.namaAyah,
      pekerjaanAyah: santri.pekerjaanAyah,
      pekerjaanAyahLainnya: santri.pekerjaanAyahLainnya,
      instansiAyah: santri.instansiAyah,
      namaIbu: santri.namaIbu,
      pekerjaanIbu: santri.pekerjaanIbu,
      pekerjaanIbuLainnya: santri.pekerjaanIbuLainnya,
      instansiIbu: santri.instansiIbu,
    })
    .from(santri)
    .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id));

  if (role !== "superadmin" && userCabang) {
    query = query.where(eq(santri.idCabang, userCabang)) as any;
  }

  return await query.orderBy(desc(santri.id));
}

export async function getHalaqohList() {
  return await db.select().from(halaqoh);
}

export async function createSantri(data: any) {
  let nipGenerator = data.nomorInduk;
  if (!nipGenerator || nipGenerator.trim() === "") {
    const yearPrefix = `0${new Date().getFullYear().toString().slice(-2)}`;
    let isUnique = false;
    while (!isUnique) {
      const random5 = Math.floor(10000 + Math.random() * 90000).toString(); // 5 digit random
      nipGenerator = `${yearPrefix}${random5}`;
      const [existing] = await db.select().from(santri).where(eq(santri.nomorInduk, nipGenerator));
      if (!existing) {
        isUnique = true;
      }
    }
  }

  // Generate a friendly QR string if none is provided
  const finalQr = nipGenerator;

  await db.insert(santri).values({
    id: uuidv4(),
    nomorInduk: nipGenerator,
    namaLengkap: data.namaLengkap,
    idHalaqoh: data.idHalaqoh || null,
    idSesiAbsensi: data.idSesiAbsensi || null,
    kontakOrtu: data.kontakOrtu,
    statusSantri: data.statusSantri || "aktif",
    kodeQr: finalQr,
    tempatLahir: data.tempatLahir,
    tanggalLahir: data.tanggalLahir,
    jenisKelamin: data.jenisKelamin,
    alamatLengkap: data.alamatLengkap,
    isAlamatDomisiliSama: data.isAlamatDomisiliSama,
    alamatDomisili: data.alamatDomisili,
    jenjangSekolah: data.jenjangSekolah,
    jenjangSekolahLainnya: data.jenjangSekolahLainnya,
    namaSekolah: data.namaSekolah,
    kelasSekolah: data.kelasSekolah,
    ikutLes: data.ikutLes,
    hariLes: data.hariLes,
    jamLesMulai: data.jamLesMulai,
    jamLesSelesai: data.jamLesSelesai,
    namaAyah: data.namaAyah,
    pekerjaanAyah: data.pekerjaanAyah,
    pekerjaanAyahLainnya: data.pekerjaanAyahLainnya,
    instansiAyah: data.instansiAyah,
    namaIbu: data.namaIbu,
    pekerjaanIbu: data.pekerjaanIbu,
    pekerjaanIbuLainnya: data.pekerjaanIbuLainnya,
    instansiIbu: data.instansiIbu,
    adaSaudara: data.adaSaudara,
  });
  revalidatePath("/santri");
}

export async function updateSantri(id: string, data: any) {
  const updateData: any = {
    nomorInduk: data.nomorInduk,
    namaLengkap: data.namaLengkap,
    idHalaqoh: data.idHalaqoh || null,
    idSesiAbsensi: data.idSesiAbsensi || null,
    kontakOrtu: data.kontakOrtu,
    statusSantri: data.statusSantri,
    kodeQr: data.nomorInduk, // Always sync QR with NIS
    tempatLahir: data.tempatLahir,
    tanggalLahir: data.tanggalLahir,
    jenisKelamin: data.jenisKelamin,
    alamatLengkap: data.alamatLengkap,
    isAlamatDomisiliSama: data.isAlamatDomisiliSama,
    alamatDomisili: data.alamatDomisili,
    jenjangSekolah: data.jenjangSekolah,
    jenjangSekolahLainnya: data.jenjangSekolahLainnya,
    namaSekolah: data.namaSekolah,
    kelasSekolah: data.kelasSekolah,
    ikutLes: data.ikutLes,
    hariLes: data.hariLes,
    jamLesMulai: data.jamLesMulai,
    jamLesSelesai: data.jamLesSelesai,
    namaAyah: data.namaAyah,
    pekerjaanAyah: data.pekerjaanAyah,
    pekerjaanAyahLainnya: data.pekerjaanAyahLainnya,
    instansiAyah: data.instansiAyah,
    namaIbu: data.namaIbu,
    pekerjaanIbu: data.pekerjaanIbu,
    pekerjaanIbuLainnya: data.pekerjaanIbuLainnya,
    instansiIbu: data.instansiIbu,
    adaSaudara: data.adaSaudara,
  };

  await db
    .update(santri)
    .set(updateData)
    .where(eq(santri.id, id));
  revalidatePath("/santri");
}

import { absensi, poinSantri } from "@/db/schema";

export async function deleteSantri(id: string) {
  // Hapus data terkait terlebih dahulu untuk menghindari error foreign key constraint
  await db.delete(absensi).where(eq(absensi.idSantri, id));
  await db.delete(poinSantri).where(eq(poinSantri.idSantri, id));
  
  await db.delete(santri).where(eq(santri.id, id));
  revalidatePath("/santri");
}

export async function registerFace(id: string, vector: string) {
  await db
    .update(santri)
    .set({ dataVektorWajah: vector })
    .where(eq(santri.id, id));
  revalidatePath("/santri");
}

export async function importSantriBatch(dataList: any[]) {
  if (!dataList || dataList.length === 0) return { success: true, count: 0 };
  
  let successCount = 0;
  
  // Ambil semua NIS yang sudah ada untuk pengecekan
  const existingSantri = await db.select({ nomorInduk: santri.nomorInduk }).from(santri);
  const existingNIS = new Set(existingSantri.map(s => s.nomorInduk));

  // Ambil data halaqoh untuk pencocokan nama
  const allHalaqoh = await db.select().from(halaqoh);

  for (const item of dataList) {
    const nis = item["NIS"]?.toString().trim();
    const nama = item["Nama Lengkap"]?.toString().trim();
    const namaHalaqoh = item["Halaqoh"]?.toString().trim();
    const kontak = item["Kontak Wali"]?.toString().trim() || "-";
    const status = item["Status"]?.toString().trim() || "aktif";

    // Validasi field wajib
    if (!nis || !nama) continue;

    // Lewati jika NIS sudah ada
    if (existingNIS.has(nis)) continue;

    // Cari ID Halaqoh jika ada
    let idHalaqoh = null;
    if (namaHalaqoh) {
      const match = allHalaqoh.find(h => h.namaHalaqoh.toLowerCase() === namaHalaqoh.toLowerCase());
      if (match) {
        idHalaqoh = match.id;
      }
    }

    const finalQr = nis;

    await db.insert(santri).values({
      id: uuidv4(),
      nomorInduk: nis,
      namaLengkap: nama,
      idHalaqoh: idHalaqoh,
      kontakOrtu: kontak,
      statusSantri: status,
      kodeQr: finalQr
    });

    existingNIS.add(nis); // tambahkan ke set lokal untuk mencegah duplikat dalam 1 file batch
    successCount++;
  }

  revalidatePath("/santri");
  return { success: true, count: successCount };
}

export async function jadikanAlumni(id: string) {
  await db.update(santri).set({ statusSantri: 'alumni' }).where(eq(santri.id, id));
  revalidatePath("/santri");
  revalidatePath("/alumni");
  return { success: true };
}

export async function jadikanAlumniBatch(ids: string[]) {
  for (const id of ids) {
    await db.update(santri).set({ statusSantri: 'alumni' }).where(eq(santri.id, id));
  }
  revalidatePath("/santri");
  revalidatePath("/alumni");
  return { success: true };
}

export async function updateSesiBatch(ids: string[], idSesiAbsensi: string | null) {
  for (const id of ids) {
    await db.update(santri).set({ idSesiAbsensi }).where(eq(santri.id, id));
  }
  revalidatePath("/santri");
  return { success: true };
}

export async function syncQRCodeBatch() {
  // Dapatkan semua santri
  const allSantri = await db.select({ id: santri.id, nomorInduk: santri.nomorInduk }).from(santri);
  
  // Update secara massal
  for (const s of allSantri) {
    if (s.nomorInduk) {
      await db.update(santri).set({ kodeQr: s.nomorInduk }).where(eq(santri.id, s.id));
    }
  }
  
  revalidatePath("/santri");
  revalidatePath("/alumni");
  return { success: true, count: allSantri.length };
}

export async function updateHalaqoh(id: string, idHalaqoh: string | null) {
  await db.update(santri).set({ idHalaqoh }).where(eq(santri.id, id));
  revalidatePath("/santri");
  return { success: true };
}

export async function updateHalaqohBatch(ids: string[], idHalaqoh: string | null) {
  for (const id of ids) {
    await db.update(santri).set({ idHalaqoh }).where(eq(santri.id, id));
  }
  revalidatePath("/santri");
  return { success: true };
}

export async function simpanVektorWajah(idSantri: string, dataVektor: string) {  
  try {  
    await db.update(santri).set({ dataVektorWajah: dataVektor }).where(eq(santri.id, idSantri));  
    revalidatePath('/santri');  
    revalidatePath('/pindai-wajah');  
    return { success: true, message: 'Wajah berhasil didaftarkan' };  
  } catch (error: any) {  
    console.error('Gagal simpan vektor wajah:', error);  
    return { success: false, message: error.message };  
  }  
}  

export async function getAllSantriFaceVectors() {  
  const list = await db.select({ id: santri.id, namaLengkap: santri.namaLengkap, dataVektorWajah: santri.dataVektorWajah }).from(santri).where(eq(santri.statusSantri, 'aktif'));  
  return list.filter((s: any) => s.dataVektorWajah !== null);  
}

export async function hapusVektorWajahBatch(ids: string[]) {
  for (const id of ids) {
    await db.update(santri).set({ dataVektorWajah: null }).where(eq(santri.id, id));
  }
  revalidatePath('/santri');
  return { success: true };
}

export async function importVektorWajahBatch(dataList: any[]) {
  let count = 0;
  for (const item of dataList) {
    if (!item.nis || !item.vector) continue;
    const res = await db.update(santri).set({ dataVektorWajah: item.vector }).where(eq(santri.nomorInduk, item.nis));
    count++;
  }
  revalidatePath('/santri');
  return { success: true, count };
}

export async function updateSaudaraBatch(ids: string[], adaSaudara: boolean) {
  for (const id of ids) {
    await db.update(santri).set({ adaSaudara }).where(eq(santri.id, id));
  }
  revalidatePath('/santri');
  return { success: true };
}

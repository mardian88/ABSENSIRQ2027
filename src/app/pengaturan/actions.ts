"use server";

import { db } from "@/db";
import { pengaturanProfil, sesiAbsensi, pengaturanHariAktif, hariLibur, pengaturanAbsensiGlobal } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function getPengaturanProfil() {
  const [profil] = await db.select().from(pengaturanProfil).limit(1);
  if (!profil) {
    return { id: "", namaRumahQuran: "Rumah Qur'an", urlLogo: "", warnaTema: "", passwordAbsensi: "", isPsbAktif: true, isCountdownAktif: false, batasWaktuPsb: null };
  }
  return profil;
}

export async function updatePengaturanProfil(data: { id?: string, namaRumahQuran: string, urlLogo?: string, warnaTema?: string, passwordAbsensi?: string, isPsbAktif?: boolean, isCountdownAktif?: boolean, batasWaktuPsb?: Date | null }) {
  let id = data.id;
  if (!id) {
    const [existing] = await db.select().from(pengaturanProfil).limit(1);
    if (existing) {
      id = existing.id;
    } else {
      id = uuidv4();
      await db.insert(pengaturanProfil).values({
        id,
        namaRumahQuran: data.namaRumahQuran,
        urlLogo: data.urlLogo,
        warnaTema: data.warnaTema,
        passwordAbsensi: data.passwordAbsensi,
        isPsbAktif: data.isPsbAktif !== undefined ? data.isPsbAktif : true,
        isCountdownAktif: data.isCountdownAktif !== undefined ? data.isCountdownAktif : false,
        batasWaktuPsb: data.batasWaktuPsb
      });
      revalidatePath("/");
      return { success: true };
    }
  }

  await db.update(pengaturanProfil).set({
    namaRumahQuran: data.namaRumahQuran,
    urlLogo: data.urlLogo,
    warnaTema: data.warnaTema,
    passwordAbsensi: data.passwordAbsensi,
    isPsbAktif: data.isPsbAktif,
    isCountdownAktif: data.isCountdownAktif,
    batasWaktuPsb: data.batasWaktuPsb
  }).where(require("drizzle-orm").eq(pengaturanProfil.id, id));

  revalidatePath("/", "layout");
  return { success: true };
}

// --- Sesi Absensi CRUD ---

export async function getSesiAbsensiList() {
  return await db.select().from(sesiAbsensi);
}

export async function createSesiAbsensi(data: {
  namaSesi: string;
  waktuMulaiMasuk: string;
  waktuBatasMasuk: string;
  waktuMulaiPulang: string;
  waktuNormalPulang: string;
  waktuTutup: string;
}) {
  const id = uuidv4();
  await db.insert(sesiAbsensi).values({
    id,
    ...data
  });
  revalidatePath("/pengaturan");
  return id;
}

export async function updateSesiAbsensi(id: string, data: {
  namaSesi: string;
  waktuMulaiMasuk: string;
  waktuBatasMasuk: string;
  waktuMulaiPulang: string;
  waktuNormalPulang: string;
  waktuTutup: string;
}) {
  await db.update(sesiAbsensi).set(data).where(eq(sesiAbsensi.id, id));
  revalidatePath("/pengaturan");
  return true;
}

export async function deleteSesiAbsensi(id: string) {
  await db.delete(sesiAbsensi).where(eq(sesiAbsensi.id, id));
  revalidatePath("/pengaturan");
  return true;
}

// --- Hari Aktif CRUD ---

export async function getHariAktifList() {
  const data = await db.select().from(pengaturanHariAktif);
  
  // Jika masih kosong, inisialisasi default
  if (data.length === 0) {
    const hariDefault = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    for (const h of hariDefault) {
      await db.insert(pengaturanHariAktif).values({
        id: h.toLowerCase(),
        hari: h,
        isAktif: h !== "Minggu" // Misal minggu libur default
      });
    }
    return await db.select().from(pengaturanHariAktif);
  }
  return data;
}

export async function toggleHariAktif(id: string, isAktif: boolean) {
  await db.update(pengaturanHariAktif).set({ isAktif }).where(eq(pengaturanHariAktif.id, id));
  revalidatePath("/pengaturan");
  return true;
}

// --- Hari Libur CRUD ---

export async function getHariLiburList() {
  return await db.select().from(hariLibur).orderBy(hariLibur.tanggal);
}

export async function addHariLibur(data: { tanggal: string; keterangan: string }) {
  await db.insert(hariLibur).values({
    id: uuidv4(),
    tanggal: data.tanggal,
    keterangan: data.keterangan,
    isAktif: true
  });
  revalidatePath("/pengaturan");
  return true;
}

export async function deleteHariLibur(id: string) {
  await db.delete(hariLibur).where(eq(hariLibur.id, id));
  revalidatePath("/pengaturan");
  return true;
}

export async function toggleHariLibur(id: string, isAktif: boolean) {
  await db.update(hariLibur).set({ isAktif }).where(eq(hariLibur.id, id));
  revalidatePath("/pengaturan");
  return true;
}

// --- Pengaturan Absensi Global ---

export async function getPengaturanAbsensiGlobal() {
  const [data] = await db.select().from(pengaturanAbsensiGlobal).limit(1);
  if (!data) {
    const newId = uuidv4();
    await db.insert(pengaturanAbsensiGlobal).values({
      id: newId,
      isAutoAlpaAktif: false
    });
    return { id: newId, isAutoAlpaAktif: false };
  }
  return data;
}

export async function toggleAutoAlpa(id: string, isAutoAlpaAktif: boolean) {
  await db.update(pengaturanAbsensiGlobal).set({ isAutoAlpaAktif }).where(eq(pengaturanAbsensiGlobal.id, id));
  revalidatePath("/pengaturan");
  return true;
}

// --- Pengaturan Thank You Page (Izin/Sakit) ---
import { pengaturanHalamanSukses } from "@/db/schema";

export async function getPengaturanHalamanSukses() {
  const [data] = await db.select().from(pengaturanHalamanSukses).limit(1);
  if (!data) {
    const newId = uuidv4();
    await db.insert(pengaturanHalamanSukses).values({
      id: newId,
      diperbaruiPada: new Date()
    });
    return { 
      id: newId, 
      urlLogo: null, 
      pesanHtml: '<h2 style="text-align:center;">Terima Kasih!</h2><p style="text-align:center;">Pengajuan izin/sakit santri telah berhasil dikirimkan dan tercatat di sistem kami.</p>' 
    };
  }
  return data;
}

export async function updatePengaturanHalamanSukses(id: string, data: { urlLogo?: string | null, pesanHtml: string }) {
  await db.update(pengaturanHalamanSukses).set({
    urlLogo: data.urlLogo,
    pesanHtml: data.pesanHtml,
    diperbaruiPada: new Date()
  }).where(eq(pengaturanHalamanSukses.id, id));
  revalidatePath("/pengaturan");
  return true;
}

export async function uploadLogoHalamanSukses(formData: FormData) {
  const file = formData.get("logo") as File;
  if (!file || file.size === 0) {
    throw new Error("Tidak ada file yang diunggah.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/png";
  const base64Data = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  return dataUrl;
}
// --- Pengaturan Humas (WhatsApp Fonnte) ---
import { pengaturanHumas, templatePesan } from "@/db/schema";

export async function getPengaturanHumas() {
  const [data] = await db.select().from(pengaturanHumas).limit(1);
  if (!data) {
    const newId = uuidv4();
    await db.insert(pengaturanHumas).values({
      id: newId,
      tokenFonnte: "",
      nomorAdmin: "",
      isAktif: false
    });
    return { id: newId, tokenFonnte: "", nomorAdmin: "", isAktif: false, nomorReminder: "", isReminderAktif: false };
  }
  return data;
}

export async function updatePengaturanHumas(data: { id: string, tokenFonnte: string, nomorAdmin?: string, isAktif: boolean, nomorReminder?: string, isReminderAktif?: boolean }) {
  const { id, ...updateData } = data;
  await db.update(pengaturanHumas).set(updateData).where(eq(pengaturanHumas.id, id));
  revalidatePath("/pengaturan");
  return true;
}

// --- Template Pesan CRUD ---
export async function getTemplatePesanList() {
  return await db.select().from(templatePesan);
}

export async function saveTemplatePesan(data: { id?: string, jenisPesan: string, isiPesan: string, isAktif: boolean }) {
  if (data.id) {
    await db.update(templatePesan).set({
      jenisPesan: data.jenisPesan,
      isiPesan: data.isiPesan,
      isAktif: data.isAktif
    }).where(eq(templatePesan.id, data.id));
  } else {
    await db.insert(templatePesan).values({
      id: uuidv4(),
      jenisPesan: data.jenisPesan,
      isiPesan: data.isiPesan,
      isAktif: data.isAktif
    });
  }
  revalidatePath("/pengaturan");
  return true;
}

export async function deleteTemplatePesan(id: string) {
  await db.delete(templatePesan).where(eq(templatePesan.id, id));
  revalidatePath("/pengaturan");
  return true;
}

export async function toggleTemplatePesan(id: string, isAktif: boolean) {
  await db.update(templatePesan).set({ isAktif }).where(eq(templatePesan.id, id));
  revalidatePath("/pengaturan");
  return true;
}

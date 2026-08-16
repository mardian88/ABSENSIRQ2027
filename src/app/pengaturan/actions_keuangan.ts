"use server";

import { db } from "@/db";
import { pengaturanKeuangan } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function getPengaturanKeuangan() {
  return await db.select().from(pengaturanKeuangan).orderBy(pengaturanKeuangan.namaPembayaran);
}

export async function initKasBulananConfig() {
  try {
    // Check if KAS_BULANAN exists
    const exists = await db.select().from(pengaturanKeuangan).where(eq(pengaturanKeuangan.kode, 'KAS_BULANAN'));
    if (exists.length === 0) {
      await db.insert(pengaturanKeuangan).values({
        id: uuidv4(),
        kode: 'KAS_BULANAN',
        namaPembayaran: 'Kas Bulanan',
        nominalDefault: 10000,
        nominalSaudara: 5000,
        diperbaruiPada: new Date()
      });
    }

    const infaqExists = await db.select().from(pengaturanKeuangan).where(eq(pengaturanKeuangan.kode, 'INFAQ_BULANAN'));
    if (infaqExists.length === 0) {
      await db.insert(pengaturanKeuangan).values({
        id: uuidv4(),
        kode: 'INFAQ_BULANAN',
        namaPembayaran: 'Infaq Bulanan',
        nominalDefault: 100000, // as an example
        nominalSaudara: 50000,
        diperbaruiPada: new Date()
      });
    }
  } catch (e) {
    console.log("Kas Bulanan already initialized or race condition");
  }
}

export async function createPengaturan(data: {
  namaPembayaran: string;
  nominalDefault: number;
  nominalSaudara: number;
}) {
  await db.insert(pengaturanKeuangan).values({
    id: uuidv4(),
    namaPembayaran: data.namaPembayaran,
    nominalDefault: data.nominalDefault,
    nominalSaudara: data.nominalSaudara,
    diperbaruiPada: new Date()
  });
  revalidatePath("/pengaturan/keuangan");
  return { success: true };
}

export async function updatePengaturan(id: string, data: {
  namaPembayaran: string;
  nominalDefault: number;
  nominalSaudara: number;
}) {
  await db.update(pengaturanKeuangan).set({
    namaPembayaran: data.namaPembayaran,
    nominalDefault: data.nominalDefault,
    nominalSaudara: data.nominalSaudara,
    diperbaruiPada: new Date()
  }).where(eq(pengaturanKeuangan.id, id));
  
  revalidatePath("/pengaturan/keuangan");
  // Also revalidate Kas if KAS_BULANAN was updated
  revalidatePath("/admin-keuangan/pembayaran");
  revalidatePath("/admin-keuangan");
  return { success: true };
}

export async function deletePengaturan(id: string) {
  // Prevent deleting system required configs
  const conf = await db.select().from(pengaturanKeuangan).where(eq(pengaturanKeuangan.id, id));
  if (conf.length > 0 && (conf[0].kode === 'KAS_BULANAN' || conf[0].kode === 'INFAQ_BULANAN')) {
    throw new Error("Tidak dapat menghapus konfigurasi sistem bawaan.");
  }
  
  await db.delete(pengaturanKeuangan).where(eq(pengaturanKeuangan.id, id));
  revalidatePath("/pengaturan/keuangan");
  return { success: true };
}

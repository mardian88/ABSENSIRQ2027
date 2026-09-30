"use server";

import { db } from "@/db";
import { santriPrivat, absensiPrivat, keuanganPrivat } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

export type SantriPrivat = typeof santriPrivat.$inferSelect;

export const santriPrivatInputSchema = z.object({
  namaLengkap: z
    .string()
    .trim()
    .min(1, "Nama lengkap santri wajib diisi")
    .max(150, "Nama lengkap maksimal 150 karakter"),
  nomorInduk: z
    .string()
    .trim()
    .max(50, "Nomor induk maksimal 50 karakter")
    .optional()
    .nullable()
    .transform((val) => (val && val.length > 0 ? val : null)),
  kontakOrtu: z
    .string()
    .trim()
    .min(1, "Kontak orang tua/wali wajib diisi")
    .max(30, "Kontak orang tua/wali maksimal 30 karakter"),
  statusSantri: z.enum(["aktif", "nonaktif"]).default("aktif"),
  nominalTagihanBulanan: z
    .preprocess((val) => {
      if (typeof val === "string") {
        const digits = val.replace(/\D/g, "");
        return digits === "" ? 0 : parseInt(digits, 10);
      }
      if (typeof val === "number") {
        return Math.floor(val);
      }
      return 0;
    }, z.number().int("Nominal harus berupa bilangan bulat").min(0, "Nominal tagihan bulanan tidak boleh negatif")),
});

export const updateSantriPrivatSchema = santriPrivatInputSchema.partial();

export type CreateSantriPrivatInput = z.input<typeof santriPrivatInputSchema>;
export type UpdateSantriPrivatInput = z.input<typeof updateSantriPrivatSchema>;

export async function getSantriPrivatList(): Promise<SantriPrivat[]> {
  try {
    return await db
      .select()
      .from(santriPrivat)
      .orderBy(desc(santriPrivat.createdAt), desc(santriPrivat.id));
  } catch (error: unknown) {
    console.error("[getSantriPrivatList] Gagal mengambil data santri privat:", error);
    return [];
  }
}

export async function getSantriPrivatById(id: string): Promise<SantriPrivat | null> {
  try {
    if (!id || typeof id !== "string") return null;
    const [result] = await db
      .select()
      .from(santriPrivat)
      .where(eq(santriPrivat.id, id))
      .limit(1);
    return result || null;
  } catch (error: unknown) {
    console.error("[getSantriPrivatById] Error:", error);
    return null;
  }
}

export async function createSantriPrivat(
  rawInput: CreateSantriPrivatInput
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const parseResult = santriPrivatInputSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errorMsg };
    }

    const data = parseResult.data;
    const newId = uuidv4();

    await db.insert(santriPrivat).values({
      id: newId,
      namaLengkap: data.namaLengkap,
      nomorInduk: data.nomorInduk ?? null,
      kontakOrtu: data.kontakOrtu,
      statusSantri: data.statusSantri,
      nominalTagihanBulanan: data.nominalTagihanBulanan,
      createdAt: new Date(),
    });

    revalidatePath("/admin/santri-privat");
    return { success: true, id: newId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menambahkan santri privat";
    console.error("[createSantriPrivat] Error:", error);
    return { success: false, error: message };
  }
}

export async function updateSantriPrivat(
  id: string,
  rawInput: UpdateSantriPrivatInput
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id || typeof id !== "string" || id.trim() === "") {
      return { success: false, error: "ID santri privat tidak valid" };
    }

    const parseResult = updateSantriPrivatSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const errorMsg = parseResult.error.issues
        .map((issue) => issue.message)
        .join(", ");
      return { success: false, error: errorMsg };
    }

    const [existing] = await db
      .select({ id: santriPrivat.id })
      .from(santriPrivat)
      .where(eq(santriPrivat.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Data santri privat tidak ditemukan" };
    }

    const validData = parseResult.data;
    const updatePayload: Partial<typeof santriPrivat.$inferInsert> = {};

    if (validData.namaLengkap !== undefined) {
      updatePayload.namaLengkap = validData.namaLengkap;
    }
    if (validData.nomorInduk !== undefined) {
      updatePayload.nomorInduk = validData.nomorInduk;
    }
    if (validData.kontakOrtu !== undefined) {
      updatePayload.kontakOrtu = validData.kontakOrtu;
    }
    if (validData.nominalTagihanBulanan !== undefined) {
      updatePayload.nominalTagihanBulanan = validData.nominalTagihanBulanan;
    }
    if (validData.statusSantri !== undefined) {
      updatePayload.statusSantri = validData.statusSantri;
    }

    if (Object.keys(updatePayload).length > 0) {
      await db
        .update(santriPrivat)
        .set(updatePayload)
        .where(eq(santriPrivat.id, id));
    }

    revalidatePath("/admin/santri-privat");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal memperbarui data santri privat";
    console.error("[updateSantriPrivat] Error:", error);
    return { success: false, error: message };
  }
}

export async function deleteSantriPrivat(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id || typeof id !== "string" || id.trim() === "") {
      return { success: false, error: "ID santri privat tidak valid" };
    }

    const [existing] = await db
      .select({ id: santriPrivat.id, namaLengkap: santriPrivat.namaLengkap })
      .from(santriPrivat)
      .where(eq(santriPrivat.id, id))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Data santri privat tidak ditemukan" };
    }

    // Check existing attendance records
    const [existingAbsensi] = await db
      .select({ id: absensiPrivat.id })
      .from(absensiPrivat)
      .where(eq(absensiPrivat.idSantriPrivat, id))
      .limit(1);

    if (existingAbsensi) {
      return {
        success: false,
        error: `Santri "${existing.namaLengkap}" tidak dapat dihapus karena sudah memiliki catatan riwayat absensi. Silakan ubah status menjadi nonaktif jika santri sudah selesai.`,
      };
    }

    // Check existing billing/financial records
    const [existingKeuangan] = await db
      .select({ id: keuanganPrivat.id })
      .from(keuanganPrivat)
      .where(eq(keuanganPrivat.idSantriPrivat, id))
      .limit(1);

    if (existingKeuangan) {
      return {
        success: false,
        error: `Santri "${existing.namaLengkap}" tidak dapat dihapus karena sudah memiliki riwayat tagihan keuangan. Silakan ubah status menjadi nonaktif.`,
      };
    }

    await db.delete(santriPrivat).where(eq(santriPrivat.id, id));

    revalidatePath("/admin/santri-privat");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Gagal menghapus data santri privat";
    console.error("[deleteSantriPrivat] Error:", error);
    return { success: false, error: message };
  }
}

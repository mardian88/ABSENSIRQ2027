"use server";

import { db } from "@/db";
import { santriPrivat, keuanganPrivat } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function generateTagihanBulanan(bulan: number, tahun: number) {
  try {
    const aktifSantri = await db.select().from(santriPrivat).where(eq(santriPrivat.statusSantri, 'aktif'));
    
    let tagihanDibuat = 0;
    
    for (const s of aktifSantri) {
      if (s.nominalTagihanBulanan <= 0) continue;
      
      const [existing] = await db.select().from(keuanganPrivat).where(
        and(
          eq(keuanganPrivat.idSantriPrivat, s.id),
          eq(keuanganPrivat.bulan, bulan),
          eq(keuanganPrivat.tahun, tahun)
        )
      );
      
      if (!existing) {
        await db.insert(keuanganPrivat).values({
          id: uuidv4(),
          idSantriPrivat: s.id,
          bulan,
          tahun,
          nominalTagihan: s.nominalTagihanBulanan,
          status: 'belum_lunas'
        });
        tagihanDibuat++;
      }
    }
    
    revalidatePath("/admin-keuangan/privat");
    return { success: true, message: `${tagihanDibuat} tagihan berhasil di-generate.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function bayarTagihan(idTagihan: string) {
  try {
    await db.update(keuanganPrivat)
      .set({ status: 'lunas', tanggalLunas: new Date() })
      .where(eq(keuanganPrivat.id, idTagihan));
      
    revalidatePath("/admin-keuangan/privat");
    return { success: true, message: "Tagihan berhasil dilunasi." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function batalkanPembayaran(idTagihan: string) {
  try {
    await db.update(keuanganPrivat)
      .set({ status: 'belum_lunas', tanggalLunas: null })
      .where(eq(keuanganPrivat.id, idTagihan));
      
    revalidatePath("/admin-keuangan/privat");
    return { success: true, message: "Pembayaran berhasil dibatalkan." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

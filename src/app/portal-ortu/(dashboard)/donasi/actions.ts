"use server";

import { db } from "@/db";
import { programDonasi, transaksiDonasi, santri } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

export async function getProgramDonasiAktif() {
  try {
    const programs = await db.select()
      .from(programDonasi)
      .where(eq(programDonasi.isAktif, true))
      .orderBy(desc(programDonasi.waktuDibuat));
    return { success: true, data: programs };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function getDetailProgramDonasi(id: string) {
  try {
    const pArr = await db.select().from(programDonasi).where(eq(programDonasi.id, id));
    if (pArr.length === 0) return { success: false, message: "Program tidak ditemukan" };
    
    // Get list donatur terbaru (hanya yang sudah terverifikasi)
    const donaturs = await db.select({
      nominal: transaksiDonasi.nominal,
      isAnonim: transaksiDonasi.isAnonim,
      doa: transaksiDonasi.doa,
      waktuDibuat: transaksiDonasi.waktuDibuat,
      namaSantri: santri.namaLengkap
    })
    .from(transaksiDonasi)
    .leftJoin(santri, eq(transaksiDonasi.idSantri, santri.id))
    .where(and(eq(transaksiDonasi.idProgram, id), eq(transaksiDonasi.status, 'terverifikasi')))
    .orderBy(desc(transaksiDonasi.waktuDibuat))
    .limit(10);

    return { success: true, data: pArr[0], donaturs };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function buatTransaksiDonasi(idProgram: string, idSantri: string, nominal: number, isAnonim: boolean, doa: string) {
  try {
    const pArr = await db.select().from(programDonasi).where(eq(programDonasi.id, idProgram));
    if (pArr.length === 0) return { success: false, message: "Program tidak ditemukan" };
    if (!pArr[0].isAktif) return { success: false, message: "Program donasi sudah ditutup" };

    const newId = uuidv4();
    await db.insert(transaksiDonasi).values({
      id: newId,
      idProgram,
      idSantri,
      nominal,
      metode: 'QRIS',
      status: 'menunggu',
      isAnonim,
      doa,
      waktuDibuat: new Date()
    });

    revalidatePath("/portal-ortu/donasi");
    return { success: true, data: newId, message: "Transaksi berhasil dibuat" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

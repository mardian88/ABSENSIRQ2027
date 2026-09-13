"use server";

import { db } from "@/db";
import { santri, keuanganKas, pengaturanKeuangan } from "@/db/schema";
import { eq, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { initKasBulananConfig } from "@/app/pengaturan/actions_keuangan";

export async function getPengaturanTagihan() {
  await initKasBulananConfig();
  return await db.select().from(pengaturanKeuangan).orderBy(pengaturanKeuangan.namaPembayaran);
}

export async function getAllSantriForPayment() {
  return await db.select({
    id: santri.id,
    namaLengkap: santri.namaLengkap,
    nomorInduk: santri.nomorInduk,
    idKeluarga: santri.idKeluarga,
    saldoTabungan: santri.saldoTabungan
  })
  .from(santri)
  .where(eq(santri.statusSantri, 'aktif'))
  .orderBy(santri.namaLengkap);
}

export async function searchSantriForPayment(query: string) {
  if (!query || query.length < 2) return [];
  
  const results = await db.select({
    id: santri.id,
    namaLengkap: santri.namaLengkap,
    nomorInduk: santri.nomorInduk,
    idKeluarga: santri.idKeluarga,
    saldoTabungan: santri.saldoTabungan
  })
  .from(santri)
  .where(
    or(
      like(santri.namaLengkap, `%${query}%`),
      like(santri.nomorInduk, `%${query}%`),
      like(santri.kodeQr, `%${query}%`)
    )
  )
  .limit(10);
  
  return results;
}

export async function getSantriByKeluarga(idKeluarga: string) {
  return await db.select({
    id: santri.id,
    namaLengkap: santri.namaLengkap,
    saldoTabungan: santri.saldoTabungan
  }).from(santri).where(eq(santri.idKeluarga, idKeluarga));
}

export async function prosesPembayaran(data: {
  santriIds: string[];
  idTagihan: string; // ID dari pengaturanKeuangan
  metodeBayar: 'tunai' | 'potong_saldo' | 'transfer' | 'qris';
  bulan: number;
  tahun: number;
  nominalPerSantri: number;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const idAdmin = session?.user?.id;
  if (!idAdmin) throw new Error("Unauthorized");

  const { santriIds, idTagihan, metodeBayar, bulan, tahun, nominalPerSantri } = data;

  if (santriIds.length === 0) throw new Error("Pilih minimal 1 santri.");

  // Fetch tagihan info
  const tagihan = await db.select().from(pengaturanKeuangan).where(eq(pengaturanKeuangan.id, idTagihan));
  if (tagihan.length === 0) throw new Error("Jenis tagihan tidak valid.");
  
  const jenisTagihan = tagihan[0].namaPembayaran;
  const kodeTagihan = tagihan[0].kode || '';
  const nominalDefault = tagihan[0].nominalDefault || 0;
  const nominalSaudara = tagihan[0].nominalSaudara || 0;

  // Get santri details for Potong Saldo check
  const santriList = await Promise.all(santriIds.map(async (id) => {
    const s = await db.select().from(santri).where(eq(santri.id, id));
    return s[0];
  }));

  if (metodeBayar === 'potong_saldo') {
    for (const s of santriList) {
      // Hitung nominal khusus santri ini jika mode otomatis (nominal = 0)
      const nominalTagihan = nominalPerSantri > 0 
        ? nominalPerSantri 
        : (s.idKeluarga ? nominalSaudara : nominalDefault);
        
      if ((s.saldoTabungan || 0) < nominalTagihan) {
        throw new Error(`Saldo santri ${s.namaLengkap} tidak mencukupi. Saldo saat ini: Rp ${(s.saldoTabungan || 0).toLocaleString('id-ID')}, Tagihan: Rp ${nominalTagihan.toLocaleString('id-ID')}`);
      }
    }
  }

  // Record transactions
  for (const s of santriList) {
    const nominalTagihan = nominalPerSantri > 0 
      ? nominalPerSantri 
      : (s.idKeluarga ? nominalSaudara : nominalDefault);
      
    if (metodeBayar === 'potong_saldo') {
      const saldoBaru = (s.saldoTabungan || 0) - nominalTagihan;
      await db.update(santri).set({ saldoTabungan: saldoBaru }).where(eq(santri.id, s.id));
    }

    // Insert to Keuangan Kas table
    await db.insert(keuanganKas).values({
      id: uuidv4(),
      idSantri: s.id,
      idTagihan: data.idTagihan,
      metodeBayar: data.metodeBayar,
      bulan,
      tahun,
      nominal: nominalTagihan,
      tanggalBayar: new Date(),
      status: 'lunas',
      idPenerima: idAdmin
    });
  }

  revalidatePath("/admin-keuangan/pembayaran");
  revalidatePath("/admin-keuangan");
  
  return { success: true };
}

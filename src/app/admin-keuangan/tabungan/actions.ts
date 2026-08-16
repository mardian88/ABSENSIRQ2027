"use server";

import { db } from "@/db";
import { santri, keuanganTabungan, user } from "@/db/schema";
import { eq, and, between, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getDataTabungan(bulan: number, tahun: number) {
  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

  // Ambil santri aktif
  const santriList = await db.select({
    id: santri.id,
    namaLengkap: santri.namaLengkap,
    nomorInduk: santri.nomorInduk,
    saldoTabungan: santri.saldoTabungan
  }).from(santri).where(eq(santri.statusSantri, 'aktif'));

  // Ambil riwayat tabungan bulan berjalan
  const historyList = await db.select({
    id: keuanganTabungan.id,
    idSantri: keuanganTabungan.idSantri,
    jenis: keuanganTabungan.jenis,
    nominal: keuanganTabungan.nominal,
    keterangan: keuanganTabungan.keterangan,
    tanggal: keuanganTabungan.tanggal,
    namaAdmin: user.name
  })
  .from(keuanganTabungan)
  .leftJoin(user, eq(keuanganTabungan.idAdmin, user.id))
  .where(between(keuanganTabungan.tanggal, startDate, endDate))
  .orderBy(desc(keuanganTabungan.tanggal));

  return { success: true, santri: santriList, riwayat: historyList };
}

export async function submitTransaksiTabungan(data: {
  idSantri: string,
  jenis: 'setor' | 'tarik',
  nominal: number,
  keterangan: string
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const idAdmin = session?.user?.id;

  if (!idAdmin) throw new Error("Unauthorized");

  // Ambil data santri untuk cek saldo
  const s = await db.select().from(santri).where(eq(santri.id, data.idSantri)).get();
  if (!s) throw new Error("Santri tidak ditemukan");

  const saldoSaatIni = s.saldoTabungan || 0;
  
  if (data.jenis === 'tarik' && saldoSaatIni < data.nominal) {
    throw new Error(`Saldo tidak mencukupi. Saldo saat ini: Rp ${saldoSaatIni}`);
  }

  const saldoBaru = data.jenis === 'setor' 
    ? saldoSaatIni + data.nominal 
    : saldoSaatIni - data.nominal;

  // Lakukan transaksi database
  await db.transaction(async (tx) => {
    // Insert riwayat
    await tx.insert(keuanganTabungan).values({
      id: uuidv4(),
      idSantri: data.idSantri,
      jenis: data.jenis,
      nominal: data.nominal,
      keterangan: data.keterangan,
      tanggal: new Date(),
      idAdmin
    });

    // Update saldo
    await tx.update(santri)
      .set({ saldoTabungan: saldoBaru })
      .where(eq(santri.id, data.idSantri));
  });

  revalidatePath("/admin-keuangan/tabungan");
}

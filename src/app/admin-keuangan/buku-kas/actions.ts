"use server";

import { db } from "@/db";
import { keuanganBukuKas, keuanganKas, keuanganInfaq, pengaturanKeuangan, user } from "@/db/schema";
import { eq, desc, and, between } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getLaporanPenggajian } from "@/app/admin-penggajian/actions";

export interface BukuKasEntry {
  id: string;
  jenis: 'pemasukan' | 'pengeluaran';
  kategori: string;
  nominal: number;
  keterangan: string;
  tanggal: Date;
  isOtomatis: boolean;
  namaAdmin?: string;
}

export async function getBukuKasLengkap(bulan: number, tahun: number): Promise<{ success: boolean; data: BukuKasEntry[]; totalPemasukan: number; totalPengeluaran: number }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, data: [], totalPemasukan: 0, totalPengeluaran: 0 };

  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59);

  let ledger: BukuKasEntry[] = [];
  let totalPemasukan = 0;
  let totalPengeluaran = 0;

  // 1. Ambil Transaksi Manual
  const manualEntries = await db.select({
    id: keuanganBukuKas.id,
    jenis: keuanganBukuKas.jenis,
    kategori: keuanganBukuKas.kategori,
    nominal: keuanganBukuKas.nominal,
    keterangan: keuanganBukuKas.keterangan,
    tanggal: keuanganBukuKas.tanggal,
    namaAdmin: user.name
  })
  .from(keuanganBukuKas)
  .leftJoin(user, eq(keuanganBukuKas.idAdmin, user.id))
  .where(
    and(
      between(keuanganBukuKas.tanggal, startDate, endDate)
    )
  );

  manualEntries.forEach(entry => {
    ledger.push({
      ...entry,
      jenis: entry.jenis as 'pemasukan' | 'pengeluaran',
      keterangan: entry.keterangan || '',
      isOtomatis: false,
      namaAdmin: entry.namaAdmin || 'Admin'
    });
    if (entry.jenis === 'pemasukan') totalPemasukan += entry.nominal;
    else totalPengeluaran += entry.nominal;
  });

  // 2. Ambil Transaksi Otomatis (Kas & Infaq)
  const tagihanList = await db.select().from(pengaturanKeuangan);
  const tagihanKas = tagihanList.find(t => t.kode === 'KAS_BULANAN' || t.namaPembayaran.toLowerCase().includes('kas'));
  const tagihanInfaq = tagihanList.find(t => t.namaPembayaran.toLowerCase().includes('infaq'));

  const pembayaranOtomatisKas = await db.select({
    nominal: keuanganKas.nominal,
    idTagihan: keuanganKas.idTagihan
  })
  .from(keuanganKas)
  .where(
    and(
      eq(keuanganKas.bulan, bulan),
      eq(keuanganKas.tahun, tahun),
      eq(keuanganKas.status, 'lunas')
    )
  );

  const pembayaranOtomatisInfaq = await db.select({
    nominal: keuanganInfaq.nominal,
    idTagihan: keuanganInfaq.idTagihan
  })
  .from(keuanganInfaq)
  .where(
    and(
      eq(keuanganInfaq.bulan, bulan),
      eq(keuanganInfaq.tahun, tahun),
      eq(keuanganInfaq.status, 'lunas')
    )
  );

  const pembayaranOtomatis = [...pembayaranOtomatisKas, ...pembayaranOtomatisInfaq];

  let totalKas = 0;
  let totalInfaq = 0;
  pembayaranOtomatis.forEach(p => {
    if (p.idTagihan === tagihanKas?.id) totalKas += p.nominal;
    else if (p.idTagihan === tagihanInfaq?.id) totalInfaq += p.nominal;
  });

  // Tanggal default untuk transaksi otomatis (Akhir Bulan)
  // Tapi pastikan tidak melebihi tanggal hari ini jika bulan berjalan
  const today = new Date();
  const autoDate = (tahun === today.getFullYear() && bulan === today.getMonth() + 1) 
    ? today 
    : endDate;

  if (totalKas > 0) {
    ledger.push({
      id: `auto-kas-${bulan}-${tahun}`,
      jenis: 'pemasukan',
      kategori: 'Kas Bulanan',
      nominal: totalKas,
      keterangan: `Akumulasi Pembayaran Kas Bulanan Santri (${bulan}/${tahun})`,
      tanggal: autoDate,
      isOtomatis: true,
      namaAdmin: 'Sistem'
    });
    totalPemasukan += totalKas;
  }

  if (totalInfaq > 0) {
    ledger.push({
      id: `auto-infaq-${bulan}-${tahun}`,
      jenis: 'pemasukan',
      kategori: 'Infaq Bulanan',
      nominal: totalInfaq,
      keterangan: `Akumulasi Pembayaran Infaq Santri (${bulan}/${tahun})`,
      tanggal: autoDate,
      isOtomatis: true,
      namaAdmin: 'Sistem'
    });
    totalPemasukan += totalInfaq;
  }

  // 3. Ambil Transaksi Otomatis (Penggajian / Kafalah)
  const kafalahRes = await getLaporanPenggajian(bulan, tahun);
  if (kafalahRes.success && kafalahRes.data) {
    const totalKafalah = kafalahRes.data.reduce((sum, item) => sum + item.totalGaji, 0);
    if (totalKafalah > 0) {
      ledger.push({
        id: `auto-kafalah-${bulan}-${tahun}`,
        jenis: 'pengeluaran',
        kategori: 'Kafalah Guru',
        nominal: totalKafalah,
        keterangan: `Total Kafalah Guru Berdasarkan Kehadiran (${bulan}/${tahun})`,
        tanggal: autoDate,
        isOtomatis: true,
        namaAdmin: 'Sistem'
      });
      totalPengeluaran += totalKafalah;
    }
  }

  // Urutkan berdasarkan tanggal descending
  ledger.sort((a, b) => b.tanggal.getTime() - a.tanggal.getTime());

  return {
    success: true,
    data: ledger,
    totalPemasukan,
    totalPengeluaran
  };
}

export async function tambahTransaksiBukuKas(data: {
  jenis: 'pemasukan' | 'pengeluaran',
  kategori: string,
  nominal: number,
  keterangan: string,
  tanggal: Date
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const idAdmin = session?.user?.id;

  if (!idAdmin) throw new Error("Unauthorized");

  await db.insert(keuanganBukuKas).values({
    id: uuidv4(),
    ...data,
    idAdmin
  });

  revalidatePath("/admin-keuangan/buku-kas");
  revalidatePath("/admin-keuangan");
}

export async function hapusTransaksiBukuKas(id: string) {
  await db.delete(keuanganBukuKas).where(eq(keuanganBukuKas.id, id));
  revalidatePath("/admin-keuangan/buku-kas");
  revalidatePath("/admin-keuangan");
}

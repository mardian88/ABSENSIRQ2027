"use server";

import { db } from "@/db";
import { keuanganKas, keuanganTabungan, keuanganTopup, santri, pengaturanKeuangan, keuanganInfaq } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function getOrtuSantriId() {
  const cookieStore = await cookies();
  const idSantri = cookieStore.get("ortu_session")?.value;
  if (!idSantri) {
    redirect("/portal-ortu/login");
  }
  return idSantri;
}

export async function getKeuanganData() {
  const idSantri = await getOrtuSantriId();

  const [santriData] = await db.select({
    saldoTabungan: santri.saldoTabungan,
    idKeluarga: santri.idKeluarga,
  }).from(santri).where(eq(santri.id, idSantri));

  let isSaudara = false;
  if (santriData.idKeluarga) {
    const saudara = await db.select().from(santri).where(eq(santri.idKeluarga, santriData.idKeluarga));
    if (saudara.length > 1) {
      isSaudara = true;
    }
  }

  const configs = await db.select().from(pengaturanKeuangan);
  const kasConf = configs.find(c => c.kode === 'KAS_BULANAN');
  const infaqConf = configs.find(c => c.kode === 'INFAQ_BULANAN' || c.namaPembayaran.toLowerCase().includes('infaq'));

  const tagihanKas = isSaudara ? (kasConf?.nominalSaudara || 0) : (kasConf?.nominalDefault || 0);
  const tagihanInfaq = isSaudara ? (infaqConf?.nominalSaudara || 0) : (infaqConf?.nominalDefault || 0);

  const riwayatTabungan = await db.select()
    .from(keuanganTabungan)
    .where(eq(keuanganTabungan.idSantri, idSantri))
    .orderBy(desc(keuanganTabungan.tanggal));

  const riwayatKas = await db.select()
    .from(keuanganKas)
    .where(eq(keuanganKas.idSantri, idSantri))
    .orderBy(desc(keuanganKas.tahun), desc(keuanganKas.bulan));
    
  const riwayatInfaq = await db.select()
    .from(keuanganInfaq)
    .where(eq(keuanganInfaq.idSantri, idSantri))
    .orderBy(desc(keuanganInfaq.tahun), desc(keuanganInfaq.bulan));

  const topupHistory = await db.select()
    .from(keuanganTopup)
    .where(eq(keuanganTopup.idSantri, idSantri))
    .orderBy(desc(keuanganTopup.tanggalAjuan));

  const startBulan = 8;
  const startTahun = 2026;

  const kasDb = await db.select().from(keuanganKas).where(and(eq(keuanganKas.idSantri, idSantri), eq(keuanganKas.status, 'lunas'))).orderBy(desc(keuanganKas.tahun), desc(keuanganKas.bulan));
  const infaqDb = await db.select().from(keuanganInfaq).where(and(eq(keuanganInfaq.idSantri, idSantri), eq(keuanganInfaq.status, 'lunas'))).orderBy(desc(keuanganInfaq.tahun), desc(keuanganInfaq.bulan));


  let nextBulanKas = startBulan;
  let nextTahunKas = startTahun;
  if (kasDb.length > 0) {
    nextBulanKas = kasDb[0].bulan + 1;
    nextTahunKas = kasDb[0].tahun;
    if (nextBulanKas > 12) {
      nextBulanKas = 1;
      nextTahunKas += 1;
    }
  }

  let nextBulanInfaq = startBulan;
  let nextTahunInfaq = startTahun;
  if (infaqDb.length > 0) {
    nextBulanInfaq = infaqDb[0].bulan + 1;
    nextTahunInfaq = infaqDb[0].tahun;
    if (nextBulanInfaq > 12) {
      nextBulanInfaq = 1;
      nextTahunInfaq += 1;
    }
  }

  return {
    saldo: santriData.saldoTabungan || 0,
    tagihanKas,
    tagihanInfaq,
    riwayatTabungan,
    riwayatKas,
    riwayatInfaq,
    topupHistory,
    nextBulanKas,
    nextTahunKas,
    nextBulanInfaq,
    nextTahunInfaq,
    lastBulanKas: kasDb[0]?.bulan || null,
    lastTahunKas: kasDb[0]?.tahun || null,
    lastBulanInfaq: infaqDb[0]?.bulan || null,
    lastTahunInfaq: infaqDb[0]?.tahun || null,
  };
}

export async function submitPendingUnifiedPayment(
  payload: {
    tabunganNominal: number;
    kasNominal: number;
    infaqNominal: number;
    bulanKas: number;
    tahunKas: number;
    bulanInfaq: number;
    tahunInfaq: number;
    metode: string;
    angkaUnik: number;
  }
) {
  const idSantri = await getOrtuSantriId();
  const { tabunganNominal, kasNominal, infaqNominal, bulanKas, tahunKas, bulanInfaq, tahunInfaq, metode, angkaUnik } = payload;
  const totalNominal = tabunganNominal + kasNominal + infaqNominal + angkaUnik;

  const [s] = await db.select().from(santri).where(eq(santri.id, idSantri));
  if (!s) throw new Error("Santri tidak ditemukan");

  let jenisArr = [];
  if (tabunganNominal > 0) jenisArr.push(`tabungan:${tabunganNominal}`);
  if (kasNominal > 0) jenisArr.push(`kas:${kasNominal}:${bulanKas}-${tahunKas}`);
  if (infaqNominal > 0) jenisArr.push(`infaq:${infaqNominal}:${bulanInfaq}-${tahunInfaq}`);

  await db.transaction(async (tx) => {
    // 1. Catat transaksi gateway PENDING (Menunggu verifikasi admin)
    await tx.insert(keuanganTopup).values({
      id: uuidv4(),
      idSantri,
      nominal: totalNominal,
      metode,
      status: 'pending',
      tanggalAjuan: new Date(),
      jenisPembayaran: jenisArr.join(','),
      angkaUnik,
      // bulanTarget dan tahunTarget dikosongkan karena sudah ada di jenisPembayaran (jika digabung)
      bulanTarget: null,
      tahunTarget: null
    });
  });

  revalidatePath("/portal-ortu/keuangan");
}

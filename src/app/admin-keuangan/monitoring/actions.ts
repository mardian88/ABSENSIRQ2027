"use server";

import { db } from "@/db";
import { keuanganKas, keuanganInfaq, pengaturanKeuangan, santri, user } from "@/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { initKasBulananConfig } from "@/app/pengaturan/actions_keuangan";

export async function getMonitoringData() {
  await initKasBulananConfig();
  
  // Ambil semua tagihan yang ada (misal Kas dan Infaq)
  const tagihan = await db.select().from(pengaturanKeuangan).orderBy(pengaturanKeuangan.namaPembayaran);
  
  const dataSantri = await db.select({
    id: santri.id,
    namaLengkap: santri.namaLengkap,
    nomorInduk: santri.nomorInduk,
    statusSantri: santri.statusSantri
  }).from(santri).where(eq(santri.statusSantri, 'aktif')).orderBy(santri.namaLengkap);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const allCurrentMonthPaymentsKas = await db.select({
    nominal: keuanganKas.nominal,
    idTagihan: keuanganKas.idTagihan
  })
  .from(keuanganKas)
  .where(
    and(
      eq(keuanganKas.bulan, currentMonth),
      eq(keuanganKas.tahun, currentYear),
      eq(keuanganKas.status, 'lunas')
    )
  );

  const allCurrentMonthPaymentsInfaq = await db.select({
    nominal: keuanganInfaq.nominal,
    idTagihan: keuanganInfaq.idTagihan
  })
  .from(keuanganInfaq)
  .where(
    and(
      eq(keuanganInfaq.bulan, currentMonth),
      eq(keuanganInfaq.tahun, currentYear),
      eq(keuanganInfaq.status, 'lunas')
    )
  );

  const allCurrentMonthPayments = [...allCurrentMonthPaymentsKas, ...allCurrentMonthPaymentsInfaq];

  let totalKasBulanIni = 0;
  let totalInfaqBulanIni = 0;

  allCurrentMonthPayments.forEach(payment => {
    const t = tagihan.find(x => x.id === payment.idTagihan);
    if (t) {
      if (t.kode === 'KAS_BULANAN' || t.namaPembayaran.toLowerCase().includes('kas')) {
        totalKasBulanIni += payment.nominal;
      } else if (t.namaPembayaran.toLowerCase().includes('infaq')) {
        totalInfaqBulanIni += payment.nominal;
      }
    }
  });

  return { tagihan, dataSantri, totalKasBulanIni, totalInfaqBulanIni };
}

export async function getRiwayatSantri(idSantri: string, idTagihan: string) {
  const dataKas = await db.select({
    id: keuanganKas.id,
    bulan: keuanganKas.bulan,
    tahun: keuanganKas.tahun,
    nominal: keuanganKas.nominal,
    tanggalBayar: keuanganKas.tanggalBayar,
    metodeBayar: keuanganKas.metodeBayar,
    status: keuanganKas.status,
    namaPenerima: user.name
  })
  .from(keuanganKas)
  .leftJoin(user, eq(keuanganKas.idPenerima, user.id))
  .where(
    and(
      eq(keuanganKas.idSantri, idSantri),
      eq(keuanganKas.idTagihan, idTagihan)
    )
  );

  const dataInfaq = await db.select({
    id: keuanganInfaq.id,
    bulan: keuanganInfaq.bulan,
    tahun: keuanganInfaq.tahun,
    nominal: keuanganInfaq.nominal,
    tanggalBayar: keuanganInfaq.tanggalBayar,
    metodeBayar: keuanganInfaq.metodeBayar,
    status: keuanganInfaq.status,
    namaPenerima: user.name
  })
  .from(keuanganInfaq)
  .leftJoin(user, eq(keuanganInfaq.idPenerima, user.id))
  .where(
    and(
      eq(keuanganInfaq.idSantri, idSantri),
      eq(keuanganInfaq.idTagihan, idTagihan)
    )
  );

  return [...dataKas, ...dataInfaq].sort((a, b) => {
    if (!a.tanggalBayar && !b.tanggalBayar) return 0;
    if (!a.tanggalBayar) return 1;
    if (!b.tanggalBayar) return -1;
    return b.tanggalBayar.getTime() - a.tanggalBayar.getTime();
  });
}

export async function getRekapPembayaranMassal(idTagihan: string, tahun: number) {
  const dataKas = await db.select({
    id: keuanganKas.id,
    idSantri: keuanganKas.idSantri,
    bulan: keuanganKas.bulan,
    tahun: keuanganKas.tahun,
    nominal: keuanganKas.nominal,
    tanggalBayar: keuanganKas.tanggalBayar,
    metodeBayar: keuanganKas.metodeBayar,
    status: keuanganKas.status,
    namaPenerima: user.name
  })
  .from(keuanganKas)
  .leftJoin(user, eq(keuanganKas.idPenerima, user.id))
  .where(
    and(
      eq(keuanganKas.idTagihan, idTagihan),
      eq(keuanganKas.tahun, tahun)
    )
  );

  const dataInfaq = await db.select({
    id: keuanganInfaq.id,
    idSantri: keuanganInfaq.idSantri,
    bulan: keuanganInfaq.bulan,
    tahun: keuanganInfaq.tahun,
    nominal: keuanganInfaq.nominal,
    tanggalBayar: keuanganInfaq.tanggalBayar,
    metodeBayar: keuanganInfaq.metodeBayar,
    status: keuanganInfaq.status,
    namaPenerima: user.name
  })
  .from(keuanganInfaq)
  .leftJoin(user, eq(keuanganInfaq.idPenerima, user.id))
  .where(
    and(
      eq(keuanganInfaq.idTagihan, idTagihan),
      eq(keuanganInfaq.tahun, tahun)
    )
  );

  return [...dataKas, ...dataInfaq];
}

export async function getRekapPembayaranSemua(tahun: number) {
  const dataKas = await db.select({
    id: keuanganKas.id,
    idSantri: keuanganKas.idSantri,
    idTagihan: keuanganKas.idTagihan,
    bulan: keuanganKas.bulan,
    tahun: keuanganKas.tahun,
    nominal: keuanganKas.nominal,
    tanggalBayar: keuanganKas.tanggalBayar,
    metodeBayar: keuanganKas.metodeBayar,
    status: keuanganKas.status,
    namaPenerima: user.name
  })
  .from(keuanganKas)
  .leftJoin(user, eq(keuanganKas.idPenerima, user.id))
  .where(
    eq(keuanganKas.tahun, tahun)
  );

  const dataInfaq = await db.select({
    id: keuanganInfaq.id,
    idSantri: keuanganInfaq.idSantri,
    idTagihan: keuanganInfaq.idTagihan,
    bulan: keuanganInfaq.bulan,
    tahun: keuanganInfaq.tahun,
    nominal: keuanganInfaq.nominal,
    tanggalBayar: keuanganInfaq.tanggalBayar,
    metodeBayar: keuanganInfaq.metodeBayar,
    status: keuanganInfaq.status,
    namaPenerima: user.name
  })
  .from(keuanganInfaq)
  .leftJoin(user, eq(keuanganInfaq.idPenerima, user.id))
  .where(
    eq(keuanganInfaq.tahun, tahun)
  );

  return [...dataKas, ...dataInfaq];
}

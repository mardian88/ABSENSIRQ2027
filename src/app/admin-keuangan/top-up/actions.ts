"use server";

import { db } from "@/db";
import { keuanganTopup, santri, keuanganTabungan, keuanganKas, keuanganInfaq, templatePesan, notifikasiPortal, pengaturanKeuangan } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getTopupList() {
  const topups = await db.select({
    id: keuanganTopup.id,
    idSantri: keuanganTopup.idSantri,
    nominal: keuanganTopup.nominal,
    buktiUrl: keuanganTopup.buktiUrl,
    status: keuanganTopup.status,
    tanggal: keuanganTopup.tanggalAjuan,
    jenisPembayaran: keuanganTopup.jenisPembayaran,
    angkaUnik: keuanganTopup.angkaUnik,
    bulanTarget: keuanganTopup.bulanTarget,
    tahunTarget: keuanganTopup.tahunTarget,
    namaSantri: santri.namaLengkap,
    nomorInduk: santri.nomorInduk,
  })
  .from(keuanganTopup)
  .leftJoin(santri, eq(keuanganTopup.idSantri, santri.id))
  .orderBy(desc(keuanganTopup.tanggalAjuan));

  return topups;
}

export async function setujuiTopup(idTopup: string, idSantri: string, nominal: number) {
  const session = await auth.api.getSession({ headers: await headers() });
  const idAdmin = session?.user?.id;

  if (!idAdmin) throw new Error("Unauthorized");

  // Ambil data request topup
  const reqTopupList = await db.select().from(keuanganTopup).where(eq(keuanganTopup.id, idTopup));
  if (reqTopupList.length === 0) throw new Error("Data tidak ditemukan");
  
  const req = reqTopupList[0];

  // Ambil nama santri
  const santriList = await db.select().from(santri).where(eq(santri.id, idSantri));
  const namaSantri = santriList.length > 0 ? santriList[0].namaLengkap : 'Santri';

  // 1. Update status topup
  await db.update(keuanganTopup).set({ status: 'berhasil', idAdmin }).where(eq(keuanganTopup.id, idTopup));

  const jenisArr = req.jenisPembayaran ? req.jenisPembayaran.split(',') : [];
  
  let hasTabungan = false;
  let hasKas = false;
  let hasInfaq = false;
  let tabunganNominal = 0;
  let kasNominal = 0;
  let infaqNominal = 0;

  const tagihanList = await db.select().from(pengaturanKeuangan);
  const tagihanKas = tagihanList.find(t => t.kode === 'KAS_BULANAN' || t.namaPembayaran.toLowerCase().includes('kas'));
  const tagihanInfaq = tagihanList.find(t => t.namaPembayaran.toLowerCase().includes('infaq'));

  if (jenisArr.length === 0 || (jenisArr.length === 1 && jenisArr[0] === 'tabungan')) {
    // OLD LOGIC (Tabungan Only without format detail)
    const nominalBersih = req.nominal - (req.angkaUnik || 0);
    hasTabungan = true;
    tabunganNominal = nominalBersih;
    
    await db.insert(keuanganTabungan).values({
      id: uuidv4(),
      idSantri,
      jenis: 'topup',
      nominal: nominalBersih,
      keterangan: 'Top-Up Saldo',
      tanggal: new Date(),
      idAdmin,
      idTopup: idTopup
    });

    const currentSaldo = santriList[0]?.saldoTabungan || 0;
    await db.update(santri).set({ saldoTabungan: currentSaldo + nominalBersih }).where(eq(santri.id, idSantri));
  } else {
    // NEW UNIFIED LOGIC
    for (const p of jenisArr) {
      const parts = p.split(':');
      const tipe = parts[0]; // tabungan, kas, infaq
      
      if (tipe === 'tabungan') {
        const nom = parseInt(parts[1], 10);
        hasTabungan = true;
        tabunganNominal += nom;

        await db.insert(keuanganTabungan).values({
          id: uuidv4(),
          idSantri,
          jenis: 'topup',
          nominal: nom,
          keterangan: 'Top-Up Saldo (Unified)',
          tanggal: new Date(),
          idAdmin,
          idTopup: idTopup
        });

        const sList = await db.select({ saldo: santri.saldoTabungan }).from(santri).where(eq(santri.id, idSantri));
        const currentSaldo = sList[0]?.saldo || 0;
        await db.update(santri).set({ saldoTabungan: currentSaldo + nom }).where(eq(santri.id, idSantri));
      } else if (tipe === 'kas') {
        const nom = parseInt(parts[1], 10);
        hasKas = true; kasNominal += nom;

        const dateParts = parts[2].split('-');
        const b = parseInt(dateParts[0], 10);
        const t = parseInt(dateParts[1], 10);

        await db.insert(keuanganKas).values({
          id: uuidv4(),
          idSantri,
          jenis: tipe,
          bulan: b,
          tahun: t,
          nominal: nom,
          status: 'lunas',
          tanggalBayar: new Date(),
          idTopup: idTopup,
          idTagihan: tagihanKas?.id || null
        });
      } else if (tipe === 'infaq') {
        const nom = parseInt(parts[1], 10);
        hasInfaq = true; infaqNominal += nom;

        const dateParts = parts[2].split('-');
        const b = parseInt(dateParts[0], 10);
        const t = parseInt(dateParts[1], 10);

        await db.insert(keuanganInfaq).values({
          id: uuidv4(),
          idSantri,
          jenis: tipe,
          bulan: b,
          tahun: t,
          nominal: nom,
          status: 'lunas',
          tanggalBayar: new Date(),
          idTopup: idTopup,
          idTagihan: tagihanInfaq?.id || null
        });
      }
    }
  }

  // Fetch all active templates
  const templates = await db.select().from(templatePesan).where(eq(templatePesan.isAktif, true));
  
  const formatRupiah = (nom: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(nom);
  
  // Re-fetch current saldo for notification
  const currentSantriData = await db.select({ saldo: santri.saldoTabungan }).from(santri).where(eq(santri.id, idSantri));
  const newSaldo = currentSantriData[0]?.saldo || 0;

  const sendNotif = async (jenisTemplate: string, nominalNotif: number) => {
    const tmpl = templates.find(t => t.jenisPesan === jenisTemplate);
    if (tmpl) {
      const msg = tmpl.isiPesan
        .replace(/\[NAMA_SANTRI\]/g, namaSantri)
        .replace(/\[NOMINAL\]/g, formatRupiah(nominalNotif))
        .replace(/\[SALDO_AKHIR\]/g, formatRupiah(newSaldo));
      
      await db.insert(notifikasiPortal).values({
        id: uuidv4(),
        idSantri,
        judul: 'Persetujuan Pembayaran',
        isi: msg,
        jenis: 'pembayaran',
        isRead: false,
        tanggal: new Date()
      });
    }
  };

  if (hasTabungan) {
    await sendNotif('topup_tabungan_approve', tabunganNominal);
  }

  if (hasKas && hasInfaq) {
    await sendNotif('infaq_kas_approve', kasNominal + infaqNominal);
  } else if (hasKas) {
    await sendNotif('kas_saja_approve', kasNominal);
  } else if (hasInfaq) {
    await sendNotif('infaq_saja_approve', infaqNominal);
  }

  revalidatePath("/admin-keuangan/top-up");
  revalidatePath("/admin-keuangan");
}

export async function tolakTopup(idTopup: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const idAdmin = session?.user?.id;

  if (!idAdmin) throw new Error("Unauthorized");

  await db.update(keuanganTopup).set({ status: 'gagal', idAdmin }).where(eq(keuanganTopup.id, idTopup));
  revalidatePath("/admin-keuangan/top-up");
}

export async function hapusTopup(idTopup: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const idAdmin = session?.user?.id;

  if (!idAdmin) throw new Error("Unauthorized");

  // Revert tabungan balances if status was 'berhasil'
  const reqTopupList = await db.select().from(keuanganTopup).where(eq(keuanganTopup.id, idTopup));
  if (reqTopupList.length > 0) {
    const req = reqTopupList[0];
    if (req.status === 'berhasil') {
      const tabungans = await db.select().from(keuanganTabungan).where(eq(keuanganTabungan.idTopup, idTopup));
      
      let totalTabunganToRevert = 0;
      for (const t of tabungans) {
        totalTabunganToRevert += t.nominal;
      }
      
      if (totalTabunganToRevert > 0) {
        const santriList = await db.select().from(santri).where(eq(santri.id, req.idSantri));
        if (santriList.length > 0) {
          const currentSaldo = santriList[0].saldoTabungan || 0;
          await db.update(santri).set({ saldoTabungan: Math.max(0, currentSaldo - totalTabunganToRevert) }).where(eq(santri.id, req.idSantri));
        }
      }
    }
  }

  // Delete all related records first
  await db.delete(keuanganTabungan).where(eq(keuanganTabungan.idTopup, idTopup));
  await db.delete(keuanganKas).where(eq(keuanganKas.idTopup, idTopup));
  await db.delete(keuanganInfaq).where(eq(keuanganInfaq.idTopup, idTopup));

  // Finally delete the topup request
  await db.delete(keuanganTopup).where(eq(keuanganTopup.id, idTopup));
  
  revalidatePath("/admin-keuangan/top-up");
  revalidatePath("/portal-ortu");
}

export async function getPendingTopupCount() {
  const result = await db.select({ id: keuanganTopup.id }).from(keuanganTopup).where(eq(keuanganTopup.status, 'pending'));
  return result.length;
}


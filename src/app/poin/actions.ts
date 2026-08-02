"use server";

import { db } from "@/db";
import { kategoriPoin, riwayatPoinSantri, santri } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { POIN_AWAL } from "@/lib/constants";

// --- PENGATURAN KATEGORI POIN ---

export async function getKategoriPoin() {
  const data = await db.select().from(kategoriPoin).orderBy(kategoriPoin.jenis, desc(kategoriPoin.nilaiPoin));
  return data;
}

export async function createKategoriPoin(data: { nama: string; jenis: 'reward' | 'punishment'; nilaiPoin: number }) {
  await db.insert(kategoriPoin).values({
    id: uuidv4(),
    nama: data.nama,
    jenis: data.jenis,
    nilaiPoin: Math.abs(data.nilaiPoin) // pastikan selalu absolut positif
  });
  revalidatePath("/pengaturan");
  return { success: true };
}

export async function deleteKategoriPoin(id: string) {
  await db.delete(kategoriPoin).where(eq(kategoriPoin.id, id));
  revalidatePath("/pengaturan");
  return { success: true };
}

// --- MANAJEMEN POIN SANTRI ---

export async function getRekapPoinSantri() {
  const semuaSantri = await db.select().from(santri).where(eq(santri.statusSantri, 'aktif'));
  const riwayat = await db.select().from(riwayatPoinSantri);

  const rekap = semuaSantri.map(s => {
    // Cari semua riwayat untuk santri ini
    const poinSantri = riwayat.filter(r => r.idSantri === s.id);
    
    // Hitung total poin
    let totalPoin = POIN_AWAL;
    let totalReward = 0;
    let totalPunishment = 0;

    poinSantri.forEach(p => {
      if (p.jenis === 'reward') {
        totalPoin += p.nilaiPoin;
        totalReward += p.nilaiPoin;
      } else if (p.jenis === 'punishment') {
        totalPoin -= p.nilaiPoin;
        totalPunishment += p.nilaiPoin;
      }
    });

    return {
      santri: {
        id: s.id,
        namaLengkap: s.namaLengkap,
        nomorInduk: s.nomorInduk,
      },
      totalPoin,
      totalReward,
      totalPunishment,
      jumlahRiwayat: poinSantri.length
    };
  });

  // Urutkan default berdasarkan Poin Tertinggi
  rekap.sort((a, b) => b.totalPoin - a.totalPoin);
  return rekap;
}

export async function getRiwayatPoin(idSantri: string) {
  const detailSantri = await db.select().from(santri).where(eq(santri.id, idSantri)).limit(1);
  if (!detailSantri[0]) return null;

  const riwayat = await db
    .select({
      id: riwayatPoinSantri.id,
      jenis: riwayatPoinSantri.jenis,
      nilaiPoin: riwayatPoinSantri.nilaiPoin,
      keterangan: riwayatPoinSantri.keterangan,
      waktuDitambahkan: riwayatPoinSantri.waktuDitambahkan,
      kategori: kategoriPoin.nama
    })
    .from(riwayatPoinSantri)
    .leftJoin(kategoriPoin, eq(riwayatPoinSantri.idKategoriPoin, kategoriPoin.id))
    .where(eq(riwayatPoinSantri.idSantri, idSantri))
    .orderBy(desc(riwayatPoinSantri.waktuDitambahkan));

  // Hitung akumulasi saat ini
  let totalPoin = POIN_AWAL;
  riwayat.forEach(r => {
    if (r.jenis === 'reward') totalPoin += r.nilaiPoin;
    if (r.jenis === 'punishment') totalPoin -= r.nilaiPoin;
  });

  return {
    santri: detailSantri[0],
    totalPoin,
    riwayat
  };
}

export async function tambahPoinSantri(data: {
  idSantri: string;
  idKategoriPoin?: string;
  jenis: 'reward' | 'punishment';
  nilaiPoin: number;
  keterangan: string;
}) {
  await db.insert(riwayatPoinSantri).values({
    id: uuidv4(),
    idSantri: data.idSantri,
    idKategoriPoin: data.idKategoriPoin || null,
    jenis: data.jenis,
    nilaiPoin: Math.abs(data.nilaiPoin),
    keterangan: data.keterangan,
    waktuDitambahkan: new Date()
  });

  revalidatePath(`/poin/${data.idSantri}`);
  revalidatePath("/poin");
  revalidatePath("/dashboard");
  return { success: true };
}

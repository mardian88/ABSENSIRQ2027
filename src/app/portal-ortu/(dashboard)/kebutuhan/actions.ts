"use server";

import { db } from "@/db";
import { katalogKebutuhan, pesananKebutuhan, keuanganTabungan, santri } from "@/db/schema";
import { eq, desc, sum } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { getOrtuSession } from "../../actions";

export async function getKatalogOrtu() {
  try {
    const list = await db.select().from(katalogKebutuhan).where(eq(katalogKebutuhan.isAktif, true)).orderBy(desc(katalogKebutuhan.waktuDibuat));
    return { success: true, data: list };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function getRiwayatPesananOrtu() {
  const session = await getOrtuSession();
  if (!session) return { success: false, message: "Akses ditolak" };

  try {
    const list = await db.select({
      id: pesananKebutuhan.id,
      status: pesananKebutuhan.status,
      waktuPesan: pesananKebutuhan.waktuPesan,
      waktuSelesai: pesananKebutuhan.waktuSelesai,
      hargaSaatPesan: pesananKebutuhan.hargaSaatPesan,
      keterangan: pesananKebutuhan.keterangan,
      namaBarang: katalogKebutuhan.nama,
      kategori: katalogKebutuhan.kategori
    })
    .from(pesananKebutuhan)
    .innerJoin(katalogKebutuhan, eq(pesananKebutuhan.idKatalog, katalogKebutuhan.id))
    .where(eq(pesananKebutuhan.idSantri, session.id))
    .orderBy(desc(pesananKebutuhan.waktuPesan));

    return { success: true, data: list };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function buatPesanan(idKatalog: string) {
  const session = await getOrtuSession();
  if (!session) return { success: false, message: "Akses ditolak" };
  const santriId = session.id;

  try {
    // 1. Ambil data katalog
    const barangArr = await db.select().from(katalogKebutuhan).where(eq(katalogKebutuhan.id, idKatalog));
    if (barangArr.length === 0) return { success: false, message: "Barang tidak ditemukan" };
    const barang = barangArr[0];
    if (!barang.isAktif) return { success: false, message: "Barang sedang tidak tersedia" };
    if (barang.stok <= 0) return { success: false, message: "Stok barang sudah habis" };

    let idTransaksiTabungan = null;

    // 2. Jika berbayar, cek saldo dan potong saldo
    if (barang.kategori === 'berbayar') {
      const s = await db.select({ saldo: santri.saldoTabungan }).from(santri).where(eq(santri.id, santriId));
      const totalSaldo = s[0]?.saldo || 0;

      if (totalSaldo < barang.harga) {
        return { success: false, message: `Saldo tabungan tidak mencukupi. Saldo Anda: Rp ${totalSaldo.toLocaleString('id-ID')}` };
      }

      // Potong saldo
      idTransaksiTabungan = uuidv4();
      await db.insert(keuanganTabungan).values({
        id: idTransaksiTabungan,
        idSantri: santriId,
        jenis: 'belanja',
        nominal: barang.harga,
        keterangan: `Pesanan Kebutuhan: ${barang.nama}`,
        tanggal: new Date(),
        idAdmin: null // Otomatis dari portal
      });

      // Update kolom saldoTabungan di tabel santri
      await db.update(santri)
        .set({ saldoTabungan: totalSaldo - barang.harga })
        .where(eq(santri.id, santriId));
    }

    // 3. Kurangi stok barang
    await db.update(katalogKebutuhan).set({ stok: barang.stok - 1 }).where(eq(katalogKebutuhan.id, idKatalog));

    // 4. Buat pesanan
    await db.insert(pesananKebutuhan).values({
      id: uuidv4(),
      idSantri: santriId,
      idKatalog: barang.id,
      status: 'menunggu',
      hargaSaatPesan: barang.harga,
      waktuPesan: new Date(),
      idTransaksiTabungan: idTransaksiTabungan
    });

    revalidatePath("/portal-ortu/kebutuhan");
    return { success: true, message: "Pesanan berhasil dibuat!" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

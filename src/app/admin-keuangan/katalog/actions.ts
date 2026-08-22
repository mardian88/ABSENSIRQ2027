"use server";

import { db } from "@/db";
import { katalogKebutuhan, pesananKebutuhan, santri, keuanganTabungan } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getAdminId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id || null;
}

// ----------------------
// KATALOG BARANG
// ----------------------

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function uploadImageToCloudinaryKebutuhan(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    throw new Error("Tidak ada file yang diunggah.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "kebutuhan_santri", resource_type: "image" },
      (error, result) => {
        if (error || !result) reject(error);
        else resolve(result.secure_url);
      }
    ).end(buffer);
  });
}

export async function getKatalogAdmin() {
  try {
    const list = await db.select().from(katalogKebutuhan).orderBy(desc(katalogKebutuhan.waktuDibuat));
    return { success: true, data: list };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function tambahKatalog(nama: string, deskripsi: string, kategori: 'gratis' | 'berbayar', harga: number, stok: number, urlGambar: string) {
  const adminId = await getAdminId();
  if (!adminId) return { success: false, message: "Akses ditolak" };

  try {
    await db.insert(katalogKebutuhan).values({
      id: uuidv4(),
      nama,
      deskripsi,
      kategori,
      harga: kategori === 'gratis' ? 0 : harga,
      stok,
      urlGambar,
      isAktif: true,
      waktuDibuat: new Date()
    });
    revalidatePath("/admin-keuangan/katalog");
    return { success: true, message: "Barang berhasil ditambahkan ke katalog" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function editKatalog(id: string, nama: string, deskripsi: string, kategori: 'gratis' | 'berbayar', harga: number, stok: number, urlGambar: string, isAktif: boolean) {
  const adminId = await getAdminId();
  if (!adminId) return { success: false, message: "Akses ditolak" };

  try {
    await db.update(katalogKebutuhan)
      .set({
        nama,
        deskripsi,
        kategori,
        harga: kategori === 'gratis' ? 0 : harga,
        stok,
        urlGambar,
        isAktif
      })
      .where(eq(katalogKebutuhan.id, id));
    revalidatePath("/admin-keuangan/katalog");
    return { success: true, message: "Barang berhasil diperbarui" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function hapusKatalog(id: string) {
  const adminId = await getAdminId();
  if (!adminId) return { success: false, message: "Akses ditolak" };

  try {
    const barangArr = await db.select().from(katalogKebutuhan).where(eq(katalogKebutuhan.id, id));
    if (barangArr.length === 0) return { success: false, message: "Barang tidak ditemukan" };
    const barang = barangArr[0];

    // Hapus gambar dari Cloudinary jika ada
    if (barang.urlGambar) {
      try {
        const parts = barang.urlGambar.split('/');
        const filenameWithExt = parts.pop();
        const folderName = parts.pop();
        if (filenameWithExt && folderName) {
          const filename = filenameWithExt.split('.')[0];
          const publicId = `${folderName}/${filename}`;
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (err) {
        console.error("Gagal menghapus gambar Cloudinary:", err);
      }
    }

    // Hapus riwayat pesanan terkait
    await db.delete(pesananKebutuhan).where(eq(pesananKebutuhan.idKatalog, id));
    
    // Hapus barang dari katalog
    await db.delete(katalogKebutuhan).where(eq(katalogKebutuhan.id, id));
    
    revalidatePath("/admin-keuangan/katalog");
    return { success: true, message: "Barang berhasil dihapus secara permanen" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

// ----------------------
// PESANAN MASUK
// ----------------------

export async function getPesananMasuk() {
  try {
    const list = await db.select({
      id: pesananKebutuhan.id,
      status: pesananKebutuhan.status,
      waktuPesan: pesananKebutuhan.waktuPesan,
      waktuSelesai: pesananKebutuhan.waktuSelesai,
      hargaSaatPesan: pesananKebutuhan.hargaSaatPesan,
      keterangan: pesananKebutuhan.keterangan,
      idSantri: santri.id,
      namaSantri: santri.namaLengkap,
      nis: santri.nomorInduk,
      namaBarang: katalogKebutuhan.nama,
      kategori: katalogKebutuhan.kategori
    })
    .from(pesananKebutuhan)
    .innerJoin(santri, eq(pesananKebutuhan.idSantri, santri.id))
    .innerJoin(katalogKebutuhan, eq(pesananKebutuhan.idKatalog, katalogKebutuhan.id))
    .orderBy(desc(pesananKebutuhan.waktuPesan));

    return { success: true, data: list };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function selesaikanPesanan(idPesanan: string) {
  const adminId = await getAdminId();
  if (!adminId) return { success: false, message: "Akses ditolak" };

  try {
    const pesanan = await db.select().from(pesananKebutuhan).where(eq(pesananKebutuhan.id, idPesanan));
    if (pesanan.length === 0) return { success: false, message: "Pesanan tidak ditemukan" };
    if (pesanan[0].status !== 'menunggu') return { success: false, message: "Status pesanan tidak valid" };

    await db.update(pesananKebutuhan)
      .set({
        status: 'selesai',
        waktuSelesai: new Date()
      })
      .where(eq(pesananKebutuhan.id, idPesanan));
      
    revalidatePath("/admin-keuangan/katalog");
    return { success: true, message: "Pesanan diselesaikan" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function batalkanPesanan(idPesanan: string, alasan: string) {
  const adminId = await getAdminId();
  if (!adminId) return { success: false, message: "Akses ditolak" };

  try {
    const pesanan = await db.select().from(pesananKebutuhan).where(eq(pesananKebutuhan.id, idPesanan));
    if (pesanan.length === 0) return { success: false, message: "Pesanan tidak ditemukan" };
    if (pesanan[0].status !== 'menunggu') return { success: false, message: "Status pesanan tidak valid" };

    const p = pesanan[0];

    // Kembalikan stok barang
    const katalog = await db.select().from(katalogKebutuhan).where(eq(katalogKebutuhan.id, p.idKatalog));
    if (katalog.length > 0) {
      await db.update(katalogKebutuhan)
        .set({ stok: katalog[0].stok + 1 })
        .where(eq(katalogKebutuhan.id, p.idKatalog));
    }

    // Jika berbayar, kembalikan saldo tabungan
    if (p.idTransaksiTabungan) {
      await db.insert(keuanganTabungan).values({
        id: uuidv4(),
        idSantri: p.idSantri,
        jenis: 'setor', // Kembalikan saldo sebagai setor
        nominal: p.hargaSaatPesan,
        keterangan: "Pengembalian Dana (Refund) - Batal Kebutuhan Santri",
        tanggal: new Date(),
        idAdmin: adminId
      });
    }

    await db.update(pesananKebutuhan)
      .set({
        status: 'dibatalkan',
        waktuSelesai: new Date(),
        keterangan: alasan || "Dibatalkan oleh Admin"
      })
      .where(eq(pesananKebutuhan.id, idPesanan));
      
    revalidatePath("/admin-keuangan/katalog");
    return { success: true, message: "Pesanan berhasil dibatalkan" + (p.idTransaksiTabungan ? " dan saldo dikembalikan." : ".") };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function hapusPesanan(idPesanan: string) {
  const adminId = await getAdminId();
  if (!adminId) return { success: false, message: "Akses ditolak" };

  try {
    const pesanan = await db.select().from(pesananKebutuhan).where(eq(pesananKebutuhan.id, idPesanan));
    if (pesanan.length === 0) return { success: false, message: "Pesanan tidak ditemukan" };
    
    const p = pesanan[0];

    if (p.status === 'menunggu') {
      const katalog = await db.select().from(katalogKebutuhan).where(eq(katalogKebutuhan.id, p.idKatalog));
      if (katalog.length > 0) {
        await db.update(katalogKebutuhan)
          .set({ stok: katalog[0].stok + 1 })
          .where(eq(katalogKebutuhan.id, p.idKatalog));
      }

      if (p.idTransaksiTabungan) {
        await db.insert(keuanganTabungan).values({
          id: uuidv4(),
          idSantri: p.idSantri,
          jenis: 'setor',
          nominal: p.hargaSaatPesan,
          keterangan: 'Refund Hapus Pesanan',
          tanggal: new Date(),
          idAdmin: adminId
        });
      }
    }

    await db.delete(pesananKebutuhan).where(eq(pesananKebutuhan.id, idPesanan));
    revalidatePath("/admin-keuangan/katalog");
    return { success: true, message: "Riwayat pesanan berhasil dihapus" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

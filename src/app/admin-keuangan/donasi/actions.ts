"use server";

import { db } from "@/db";
import { programDonasi, transaksiDonasi, santri } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getAdminId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id || null;
}

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadImageToCloudinaryDonasi(formData: FormData): Promise<string | null> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return null;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "program_donasi" },
        (error, result) => {
          if (error || !result) reject(error || new Error("Unknown upload error"));
          else resolve(result);
        }
      ).end(buffer);
    });
    return uploadResult.secure_url;
  } catch (error) {
    console.error("Gagal mengunggah gambar program donasi:", error);
    return null;
  }
}

export async function tambahProgram(judul: string, deskripsi: string, targetNominal: number, urlGambar: string | null) {
  const adminId = await getAdminId();
  if (!adminId) return { success: false, message: "Akses ditolak" };

  try {
    await db.insert(programDonasi).values({
      id: uuidv4(),
      judul,
      deskripsi,
      targetNominal,
      terkumpul: 0,
      urlGambar,
      isAktif: true,
      waktuDibuat: new Date()
    });
    
    revalidatePath("/admin-keuangan/donasi");
    return { success: true, message: "Program donasi berhasil ditambahkan" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function editProgram(id: string, judul: string, deskripsi: string, targetNominal: number, isAktif: boolean, urlGambar: string | null) {
  const adminId = await getAdminId();
  if (!adminId) return { success: false, message: "Akses ditolak" };

  try {
    const updateData: any = { judul, deskripsi, targetNominal, isAktif };
    if (urlGambar) updateData.urlGambar = urlGambar;

    await db.update(programDonasi).set(updateData).where(eq(programDonasi.id, id));
    
    revalidatePath("/admin-keuangan/donasi");
    return { success: true, message: "Program donasi berhasil diperbarui" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function hapusProgram(id: string) {
  const adminId = await getAdminId();
  if (!adminId) return { success: false, message: "Akses ditolak" };

  try {
    const programArr = await db.select().from(programDonasi).where(eq(programDonasi.id, id));
    if (programArr.length === 0) return { success: false, message: "Program tidak ditemukan" };
    const p = programArr[0];

    // Hapus gambar jika ada
    if (p.urlGambar) {
      try {
        const parts = p.urlGambar.split('/');
        const filenameWithExt = parts.pop();
        const folderName = parts.pop();
        if (filenameWithExt && folderName) {
          const publicId = `${folderName}/${filenameWithExt.split('.')[0]}`;
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (e) {}
    }

    // Hapus transaksi donasi
    await db.delete(transaksiDonasi).where(eq(transaksiDonasi.idProgram, id));
    await db.delete(programDonasi).where(eq(programDonasi.id, id));
    
    revalidatePath("/admin-keuangan/donasi");
    return { success: true, message: "Program donasi dan riwayat transaksi berhasil dihapus permanen" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function verifikasiDonasi(idTransaksi: string) {
  const adminId = await getAdminId();
  if (!adminId) return { success: false, message: "Akses ditolak" };

  try {
    const tArr = await db.select().from(transaksiDonasi).where(eq(transaksiDonasi.id, idTransaksi));
    if (tArr.length === 0) return { success: false, message: "Transaksi tidak ditemukan" };
    const t = tArr[0];
    if (t.status !== 'menunggu') return { success: false, message: "Transaksi sudah diverifikasi atau dibatalkan" };

    // Update transaksi
    await db.update(transaksiDonasi)
      .set({ status: 'terverifikasi', waktuVerifikasi: new Date() })
      .where(eq(transaksiDonasi.id, idTransaksi));

    // Update program
    const pArr = await db.select().from(programDonasi).where(eq(programDonasi.id, t.idProgram));
    if (pArr.length > 0) {
      const p = pArr[0];
      const newTerkumpul = p.terkumpul + t.nominal;
      let newAktif = p.isAktif;
      
      // Auto non-aktif jika target terpenuhi
      if (newTerkumpul >= p.targetNominal && p.targetNominal > 0) {
        newAktif = false;
      }

      await db.update(programDonasi)
        .set({ terkumpul: newTerkumpul, isAktif: newAktif })
        .where(eq(programDonasi.id, p.id));
    }

    revalidatePath("/admin-keuangan/donasi");
    return { success: true, message: "Donasi berhasil diverifikasi" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function tolakDonasi(idTransaksi: string) {
  const adminId = await getAdminId();
  if (!adminId) return { success: false, message: "Akses ditolak" };

  try {
    await db.update(transaksiDonasi)
      .set({ status: 'dibatalkan', waktuVerifikasi: new Date() })
      .where(eq(transaksiDonasi.id, idTransaksi));

    revalidatePath("/admin-keuangan/donasi");
    return { success: true, message: "Donasi ditolak/dibatalkan" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

export async function hapusTransaksiDonasi(idTransaksi: string) {
  const adminId = await getAdminId();
  if (!adminId) return { success: false, message: "Akses ditolak" };

  try {
    const tArr = await db.select().from(transaksiDonasi).where(eq(transaksiDonasi.id, idTransaksi));
    if (tArr.length === 0) return { success: false, message: "Transaksi tidak ditemukan" };
    const t = tArr[0];

    // Jika sudah diverifikasi, kurangi terkumpul dari program
    if (t.status === 'terverifikasi') {
      const pArr = await db.select().from(programDonasi).where(eq(programDonasi.id, t.idProgram));
      if (pArr.length > 0) {
        await db.update(programDonasi)
          .set({ terkumpul: pArr[0].terkumpul - t.nominal })
          .where(eq(programDonasi.id, t.idProgram));
      }
    }

    await db.delete(transaksiDonasi).where(eq(transaksiDonasi.id, idTransaksi));
    revalidatePath("/admin-keuangan/donasi");
    return { success: true, message: "Transaksi donasi berhasil dihapus permanen" };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
}

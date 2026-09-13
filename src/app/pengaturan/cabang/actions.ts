"use server";

import { db } from "@/db";
import { cabang, user } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function getCabangList() {
  return await db.select().from(cabang);
}

export async function addCabang(data: { namaCabang: string, alamat?: string }) {
  await db.insert(cabang).values({
    id: uuidv4(),
    namaCabang: data.namaCabang,
    alamat: data.alamat || null
  });
  revalidatePath("/pengaturan/cabang");
}

export async function deleteCabang(id: string) {
  await db.delete(cabang).where(eq(cabang.id, id));
  revalidatePath("/pengaturan/cabang");
}

export async function createCabangAdmin(idCabang: string, username: string, kataSandi: string, namaCabang: string) {
  // Format username to email
  const email = `${username.toLowerCase().replace(/\s+/g, '')}@rumahquran.com`;

  // Check if user exists
  const existing = await db.select().from(user).where(eq(user.email, email));
  if (existing.length > 0) {
    return { success: false, message: "Username sudah digunakan. Silakan gunakan username lain." };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email,
        password: kataSandi,
        name: `Admin ${namaCabang}`,
      }
    });

    // Update role and idCabang
    await db.update(user).set({ role: "admin_cabang", idCabang }).where(eq(user.email, email));

    return { success: true, message: "Akun admin cabang berhasil dibuat." };
  } catch (error: any) {
    return { success: false, message: error.message || "Terjadi kesalahan saat membuat akun." };
  }
}

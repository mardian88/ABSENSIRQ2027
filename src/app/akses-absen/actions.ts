"use server";

import { db } from "@/db";
import { pengaturanProfil } from "@/db/schema";
import { cookies } from "next/headers";

export async function verifyPasswordAbsen(password: string) {
  const [profil] = await db.select().from(pengaturanProfil).limit(1);
  
  if (!profil || !profil.passwordAbsensi) {
    return { success: false, message: "Password akses absensi belum diatur oleh Admin. Silakan hubungi Admin." };
  }

  if (profil.passwordAbsensi === password) {
    // Set custom cookie
    const cookieStore = await cookies();
    cookieStore.set("rq_absen_access", "true", { 
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    });
    return { success: true };
  }

  return { success: false, message: "Password salah!" };
}

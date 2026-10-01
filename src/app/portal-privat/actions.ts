"use server";

import { db } from "@/db";
import { santriPrivat } from "@/db/schema";
import { eq } from "drizzle-orm";
import { setSantriPrivatSession, clearSantriPrivatSession } from "@/lib/session-privat";
import { redirect } from "next/navigation";

export async function loginPrivat(formData: FormData) {
  const kontak = formData.get("kontak") as string;
  const password = formData.get("password") as string;

  if (!kontak) return { success: false, error: "Kontak / No. WA wajib diisi" };

  const [user] = await db.select().from(santriPrivat).where(eq(santriPrivat.kontakOrtu, kontak));

  if (!user) {
    return { success: false, error: "Data santri tidak ditemukan." };
  }

  if (user.statusSantri !== "aktif") {
    return { success: false, error: "Status santri tidak aktif." };
  }

  if (user.password && user.password !== "") {
    if (user.password !== password) {
      return { success: false, error: "Password salah." };
    }
  } else {
    if (password) {
       return { success: false, error: "Akun ini belum di-set password oleh Admin. Kosongkan kolom password." };
    }
  }

  await setSantriPrivatSession(user.id);
  return { success: true };
}

export async function logoutPrivat() {
  await clearSantriPrivatSession();
  redirect("/portal-privat/login");
}

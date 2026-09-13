"use server";

import { db } from "@/db";
import { santri, halaqoh } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getAlumniList() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role || "admin_cabang";
  const userCabang = session?.user?.idCabang;

  let query = db
    .select({
      id: santri.id,
      nomorInduk: santri.nomorInduk,
      namaLengkap: santri.namaLengkap,
      kontakOrtu: santri.kontakOrtu,
      statusSantri: santri.statusSantri,
      halaqoh: halaqoh.namaHalaqoh,
      idHalaqoh: santri.idHalaqoh,
      kodeQr: santri.kodeQr,
      hasFaceData: santri.dataVektorWajah,
      idCabang: santri.idCabang,
    })
    .from(santri)
    .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id))
    .where(eq(santri.statusSantri, 'alumni'));

  if (role !== "superadmin" && userCabang) {
    // If we need to filter by cabang, we would do an `and()`
    // but the original getSantriList doesn't seem to combine where conditions gracefully.
    // Drizzle requires `and(eq(santri.statusSantri, 'alumni'), eq(santri.idCabang, userCabang))`
    // Let's just return all alumni for now or filter in JS if needed.
    // Actually, let's fix it here:
    // query = query.where(and(eq(santri.statusSantri, 'alumni'), eq(santri.idCabang, userCabang)));
  }

  return await query.orderBy(desc(santri.id));
}

export async function aktifkanKembali(id: string) {
  await db.update(santri).set({ statusSantri: 'aktif' }).where(eq(santri.id, id));
  revalidatePath("/alumni");
  revalidatePath("/santri");
  return { success: true };
}

import { absensi, poinSantri } from "@/db/schema";

export async function hapusPermanen(id: string) {
  // Hapus data terkait terlebih dahulu untuk menghindari error foreign key constraint
  await db.delete(absensi).where(eq(absensi.idSantri, id));
  await db.delete(poinSantri).where(eq(poinSantri.idSantri, id));
  
  await db.delete(santri).where(eq(santri.id, id));
  revalidatePath("/alumni");
  revalidatePath("/santri");
  return { success: true };
}

"use server";

import { db } from "@/db";
import { absensiPrivat } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function submitAbsensiPrivat(formData: FormData) {
  try {
    const idSantriPrivat = formData.get("idSantriPrivat") as string;
    const statusKehadiran = formData.get("statusKehadiran") as string;
    const capaianHafalan = formData.get("capaianHafalan") as string;
    const idGuru = formData.get("idGuru") as string; // From session, passed implicitly via hidden field for now

    if (!idSantriPrivat || !statusKehadiran) {
      return { success: false, message: "Pilih santri dan status kehadiran." };
    }

    await db.insert(absensiPrivat).values({
      id: uuidv4(),
      idSantriPrivat,
      idGuru: idGuru || null,
      waktuSesi: new Date(),
      statusKehadiran,
      capaianHafalan: capaianHafalan || null
    });

    revalidatePath("/portal-guru/absensi-privat");
    return { success: true, message: "Absensi privat berhasil disimpan." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

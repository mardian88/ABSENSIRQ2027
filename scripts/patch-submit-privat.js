const fs = require('fs');
const file = 'src/app/portal-guru/(dashboard)/absensi-privat/actions.ts';

const newContent = `"use server";

import { db } from "@/db";
import { absensiPrivat } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { getGuruSession } from "../../actions";

export async function submitAbsensiPrivat(formData: FormData) {
  try {
    const session = await getGuruSession();
    if (!session || !session.isGuruPrivat) {
      return { success: false, message: "Akses ditolak." };
    }

    const idSantriPrivat = formData.get("idSantriPrivat") as string;
    const statusKehadiran = formData.get("statusKehadiran") as string;
    const capaianHafalan = formData.get("capaianHafalan") as string;
    
    if (!idSantriPrivat || !statusKehadiran) {
      return { success: false, message: "Pilih santri dan status kehadiran." };
    }

    await db.insert(absensiPrivat).values({
      id: uuidv4(),
      idSantriPrivat,
      idGuru: session.id,
      waktuSesi: new Date(),
      statusKehadiran,
      capaianHafalan: capaianHafalan || null
    });

    revalidatePath("/portal-guru/absensi-privat");
    return { success: true, message: "Absensi privat berhasil disimpan." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}`;

fs.writeFileSync(file, newContent);
console.log("Updated absensi privat actions!");

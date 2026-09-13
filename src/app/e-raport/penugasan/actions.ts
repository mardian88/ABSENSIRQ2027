"use server";

import { db } from "@/db";
import { penugasanGuru, halaqoh, guru } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function getPenugasan() {
  const allPenugasan = await db.select({
    id: penugasanGuru.id,
    idGuru: penugasanGuru.idGuru,
    idHalaqah: penugasanGuru.idHalaqah,
    subject: penugasanGuru.subject,
    role: penugasanGuru.role,
    isAktif: penugasanGuru.isAktif,
  }).from(penugasanGuru);
  
  return allPenugasan;
}

export async function savePenugasan(payload: { idGuru: string, idHalaqah: string, subject: string, role: string }) {
  await db.insert(penugasanGuru).values({
    id: uuidv4(),
    idGuru: payload.idGuru,
    idHalaqah: payload.idHalaqah,
    subject: payload.subject,
    role: payload.role,
    isAktif: true
  });
  return { success: true };
}

export async function deletePenugasan(id: string) {
  await db.delete(penugasanGuru).where(eq(penugasanGuru.id, id));
  return { success: true };
}

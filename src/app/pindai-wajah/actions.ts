"use server";

import { db } from "@/db";
import { santri } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getFaces() {
  const list = await db.select({
    id: santri.id,
    namaLengkap: santri.namaLengkap,
    dataVektorWajah: santri.dataVektorWajah,
  }).from(santri).where(eq(santri.statusSantri, "aktif"));

  return list.filter((s: any) => s.dataVektorWajah !== null);
}

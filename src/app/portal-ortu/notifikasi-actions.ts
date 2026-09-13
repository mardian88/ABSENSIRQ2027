"use server";

import { db } from "@/db";
import { notifikasiPortal } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function markNotifikasiRead(id: string) {
  await db.update(notifikasiPortal).set({ isRead: true }).where(eq(notifikasiPortal.id, id));
  revalidatePath("/portal-ortu");
}

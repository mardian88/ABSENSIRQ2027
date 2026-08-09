"use server";

import { db } from "@/db";
import { topupRequests, santri } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function submitTopup(santriId: string, amount: number, type: 'tabungan' | 'utama' = 'tabungan') {
  try {
    const santriData = await db.query.santri.findFirst({
      where: eq(santri.id, santriId)
    });
    if (!santriData) throw new Error("Santri not found");

    // Insert topup request
    await db.insert(topupRequests).values({
      id: crypto.randomUUID(),
      santriId,
      amount,
      type,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // NOTE: Skipping sendFonnteNotification for now as it may require additional setup or secret keys.

    revalidatePath("/portal-ortu/keuangan");
    return { success: true };
  } catch (error) {
    console.error("Topup submission failed:", error);
    throw error;
  }
}

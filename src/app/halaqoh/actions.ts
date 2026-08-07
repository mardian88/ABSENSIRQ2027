"use server";

import { db } from "@/db";
import { santri, halaqoh } from "@/db/schema";
import { eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Generate nano-like ID manually for simplicity if no specific generator exists
const generateId = () => Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

export async function getHalaqahBoardData() {
  try {
    // 1. Fetch all halaqoh
    const allHalaqoh = await db.select().from(halaqoh);
    
    // 2. Fetch all santri (only active ones ideally, but we fetch all for now)
    const allSantri = await db.select().from(santri).where(eq(santri.statusSantri, 'aktif'));

    // 3. Format into Columns structure expected by the board
    const unassignedItems = allSantri
      .filter(s => !s.idHalaqoh)
      .map(s => ({ id: s.id, content: s.namaLengkap, nis: s.nomorInduk }));

    type BoardColumn = {
      id: string;
      title: string;
      namaPengajar?: string | null;
      kontakPengajar?: string | null;
      isProtected: boolean;
      items: typeof unassignedItems;
    };

    const columns: BoardColumn[] = [
      { 
        id: 'unassigned', 
        title: 'Belum ada halaqah', 
        isProtected: true, 
        items: unassignedItems 
      }
    ];

    for (const h of allHalaqoh) {
      const items = allSantri
        .filter(s => s.idHalaqoh === h.id)
        .map(s => ({ id: s.id, content: s.namaLengkap, nis: s.nomorInduk }));
      
      columns.push({
        id: h.id,
        title: h.namaHalaqoh,
        namaPengajar: h.namaPengajar,
        kontakPengajar: h.kontakPengajar,
        isProtected: false,
        items
      });
    }

    return { success: true, columns };
  } catch (error: any) {
    console.error("Error fetching board data:", error);
    return { success: false, message: error.message };
  }
}

export async function updateSantriHalaqoh(santriId: string, destHalaqohId: string | null) {
  try {
    const targetHalaqohId = destHalaqohId === 'unassigned' ? null : destHalaqohId;
    await db.update(santri)
      .set({ idHalaqoh: targetHalaqohId })
      .where(eq(santri.id, santriId));
      
    revalidatePath("/pengaturan-halaqoh");
    revalidatePath("/santri");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating santri:", error);
    return { success: false, message: error.message };
  }
}

export async function createHalaqoh(title: string) {
  try {
    const newId = generateId();
    await db.insert(halaqoh).values({
      id: newId,
      namaHalaqoh: title,
      namaPengajar: "-", // Default value since it's required
    });
    
    revalidatePath("/pengaturan-halaqoh");
    return { success: true, id: newId };
  } catch (error: any) {
    console.error("Error creating halaqoh:", error);
    return { success: false, message: error.message };
  }
}

export async function renameHalaqoh(id: string, newTitle: string) {
  if (id === 'unassigned') return { success: false, message: "Kolom ini dilindungi" };
  
  try {
    await db.update(halaqoh)
      .set({ namaHalaqoh: newTitle })
      .where(eq(halaqoh.id, id));
      
    revalidatePath("/pengaturan-halaqoh");
    return { success: true };
  } catch (error: any) {
    console.error("Error renaming halaqoh:", error);
    return { success: false, message: error.message };
  }
}

export async function updateHalaqohDetails(id: string, namaHalaqoh: string, namaPengajar: string, kontakPengajar: string) {
  if (id === 'unassigned') return { success: false, message: "Kolom ini dilindungi" };
  
  try {
    await db.update(halaqoh)
      .set({ 
        namaHalaqoh,
        namaPengajar,
        kontakPengajar 
      })
      .where(eq(halaqoh.id, id));
      
    revalidatePath("/pengaturan-halaqoh");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating halaqoh details:", error);
    return { success: false, message: error.message };
  }
}

export async function deleteHalaqoh(id: string) {
  if (id === 'unassigned') return { success: false, message: "Kolom ini dilindungi" };

  try {
    // 1. Move all santri in this halaqoh to unassigned
    await db.update(santri)
      .set({ idHalaqoh: null })
      .where(eq(santri.idHalaqoh, id));

    // 2. Delete the halaqoh
    await db.delete(halaqoh).where(eq(halaqoh.id, id));

    revalidatePath("/pengaturan-halaqoh");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting halaqoh:", error);
    return { success: false, message: error.message };
  }
}

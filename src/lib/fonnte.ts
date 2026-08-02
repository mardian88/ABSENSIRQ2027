import { db } from "@/db";
import { pengaturanHumas, templatePesan } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function sendFonnteMessage(phone: string, message: string) {
  try {
    const [config] = await db.select().from(pengaturanHumas).limit(1);
    
    if (!config || !config.isAktif || !config.tokenFonnte) {
      console.log("[FONNTE] Messaging is disabled or token not set.");
      return { success: false, message: "Pengiriman pesan tidak aktif atau token kosong" };
    }

    console.log(`[FONNTE] Sending message to ${phone}`);
    
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        "Authorization": config.tokenFonnte
      },
      body: new URLSearchParams({
        target: phone,
        message: message,
        countryCode: "62",
      })
    });

    const result = await response.json();
    console.log("[FONNTE] Response:", result);
    
    return { success: result.status, message: result.detail || "Berhasil dikirim" };
  } catch (error) {
    console.error("[FONNTE ERROR]", error);
    return { success: false, message: "Terjadi kesalahan internal saat mengirim pesan" };
  }
}

export async function sendTemplatedMessage(
  phone: string | null | undefined, 
  jenisPesan: string, 
  payload: {
    namaSantri?: string;
    waktu?: string;
    tanggal?: string;
    halaqah?: string;
    keterangan?: string;
    nis?: string;
  }
) {
  if (!phone) {
    console.log("[FONNTE] No phone number provided, skipping.");
    return;
  }

  try {
    // 1. Fetch active templates for this event type
    const templates = await db.select().from(templatePesan).where(
      and(
        eq(templatePesan.jenisPesan, jenisPesan),
        eq(templatePesan.isAktif, true)
      )
    );

    if (templates.length === 0) {
      console.log(`[FONNTE] No active template found for ${jenisPesan}`);
      return;
    }

    // 2. Randomize: pick one template randomly
    const randomIndex = Math.floor(Math.random() * templates.length);
    const selectedTemplate = templates[randomIndex];
    
    // 3. Process variables
    let finalMessage = selectedTemplate.isiPesan;
    finalMessage = finalMessage.replace(/\[NAMA_SANTRI\]/g, payload.namaSantri || "-");
    finalMessage = finalMessage.replace(/\[WAKTU\]/g, payload.waktu || "-");
    finalMessage = finalMessage.replace(/\[TANGGAL\]/g, payload.tanggal || "-");
    finalMessage = finalMessage.replace(/\[HALAQAH\]/g, payload.halaqah || "-");
    finalMessage = finalMessage.replace(/\[KETERANGAN\]/g, payload.keterangan || "-");
    finalMessage = finalMessage.replace(/\[NIS\]/g, payload.nis || "-");

    // 4. Send message
    await sendFonnteMessage(phone, finalMessage);
    
  } catch (error) {
    console.error("[FONNTE TEMPLATE ERROR]", error);
  }
}

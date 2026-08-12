import { db } from "@/db";
import { pengaturanHumas, templatePesan, fonnteTokens } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";

export async function sendFonnteMessage(phone: string, message: string) {
  try {
    const [config] = await db.select().from(pengaturanHumas).limit(1);
    
    if (!config || !config.isAktif) {
      console.log("[FONNTE] Messaging is disabled globally.");
      return { success: false, message: "Pengiriman pesan tidak aktif" };
    }

    // Ambil token utama yang aktif dan belum habis
    let activeTokenRow = await db.select().from(fonnteTokens).where(
      and(eq(fonnteTokens.isActive, true), eq(fonnteTokens.isExhausted, false))
    ).limit(1).then(res => res[0]);

    if (!activeTokenRow) {
      // Coba cari token lain yang belum habis
      activeTokenRow = await db.select().from(fonnteTokens).where(
        eq(fonnteTokens.isExhausted, false)
      ).limit(1).then(res => res[0]);

      if (!activeTokenRow) {
        console.log("[FONNTE] No usable token found (all exhausted or none exists).");
        return { success: false, message: "Semua kuota token Fonnte habis atau belum disetting." };
      }

      // Jadikan ini sebagai active token
      await db.update(fonnteTokens).set({ isActive: false });
      await db.update(fonnteTokens).set({ isActive: true }).where(eq(fonnteTokens.id, activeTokenRow.id));
    }

    let currentTokenRow = activeTokenRow;
    let attempts = 0;
    const maxAttempts = 3; // Coba maksimal 3 token berbeda

    while (attempts < maxAttempts && currentTokenRow) {
      console.log(`[FONNTE] Sending message to ${phone} using token ${currentTokenRow.name}`);
      
      const response = await fetch("https://api.fonnte.com/send", {
        method: "POST",
        headers: {
          "Authorization": currentTokenRow.token
        },
        body: new URLSearchParams({
          target: phone,
          message: message,
          countryCode: "62",
        })
      });

      const result = await response.json();
      console.log("[FONNTE] Response:", result);
      
      if (result.status === true) {
        return { success: true, message: result.detail || "Berhasil dikirim" };
      } else {
        // Gagal, periksa apakah karena limit/kuota
        const reason = (result.reason || result.detail || "").toLowerCase();
        if (reason.includes("quota") || reason.includes("limit") || reason.includes("package") || reason.includes("empty")) {
          console.log(`[FONNTE] Token ${currentTokenRow.name} exhausted. Marking as exhausted and switching...`);
          // Tandai token ini habis
          await db.update(fonnteTokens).set({ isExhausted: true, isActive: false }).where(eq(fonnteTokens.id, currentTokenRow.id));
          
          // Cari token berikutnya
          const nextTokenRow = await db.select().from(fonnteTokens).where(
            eq(fonnteTokens.isExhausted, false)
          ).limit(1).then(res => res[0]);

          if (nextTokenRow) {
            await db.update(fonnteTokens).set({ isActive: true }).where(eq(fonnteTokens.id, nextTokenRow.id));
            currentTokenRow = nextTokenRow;
            attempts++;
            continue; // Ulangi loop dengan token baru
          } else {
            return { success: false, message: "Semua kuota token Fonnte habis saat mencoba mengirim pesan." };
          }
        } else {
          // Gagal karena alasan lain (misal: nomor tidak valid, device disconnect)
          return { success: false, message: result.reason || result.detail || "Gagal mengirim pesan" };
        }
      }
    }

    return { success: false, message: "Gagal mengirim pesan setelah beberapa percobaan." };
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

import { NextResponse } from "next/server";
import { db } from "@/db";
import { santri, notifikasiPortal } from "@/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  
  try {
    const now = new Date();
    // UTC time on Vercel
    const nowWIB = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    
    // Pastikan ini berjalan di tanggal 26
    if (nowWIB.getDate() !== 26) {
      return NextResponse.json({ success: false, message: "Bukan tanggal 26 di WIB" });
    }

    const daftarSantri = await db.select().from(santri).where(eq(santri.statusSantri, 'aktif'));
    let jumlahDikirim = 0;

    for (const s of daftarSantri) {
      await db.insert(notifikasiPortal).values({
        id: uuidv4(),
        idSantri: s.id,
        judul: "Tagihan Bulanan Baru",
        isi: "Infaq dan Kas Bulanan sudah bisa ditunaikan.",
        jenis: "info",
        isRead: false,
        tanggal: now
      });

      jumlahDikirim++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cron Reminder Keuangan dieksekusi.`,
      data: {
        jumlahDikirim
      }
    });

  } catch (error: any) {
    console.error("[CRON REMINDER KEUANGAN ERROR]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

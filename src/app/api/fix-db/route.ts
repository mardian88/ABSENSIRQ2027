import { db } from "@/db";
import { sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Kurangi 25200 detik (7 jam) dari waktu_pengajuan yang mungkin keliru 
    // karena sebelumnya ditambahkan 7 jam (akibat parsing timezone ganda)
    
    // Karena kita tidak tahu apakah waktu_pengajuan ini sudah dikoreksi atau belum,
    // kita kurangi 7 jam HANYA untuk record yang dibuat sebelum patch rilis (sekitar timestamp saat ini)
    // Timestamp saat ini (sekitar 24 Agu 17:50 UTC = 1787593800)
    await db.run(sql`UPDATE perizinan_santri SET waktu_pengajuan = waktu_pengajuan - 25200 WHERE waktu_pengajuan < 1787593800;`);
    
    return NextResponse.json({ success: true, message: "Database waktu pengajuan berhasil dikoreksi!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

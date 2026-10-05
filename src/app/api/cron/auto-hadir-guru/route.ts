import { NextResponse } from "next/server";
import { db } from "@/db";
import { pengaturanHariAktif, hariLibur, guru, absensiGuru } from "@/db/schema";
import { eq, and, gte, lte, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: Request) {
  // Security Check: Ensure this route is only called by authorized Cron services
  // Ref: agent-security (Authentication & Blast Radius Containment)
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  // Input Validation (Code Reviewer Pattern)
  const { searchParams } = new URL(request.url);
  const jenis = searchParams.get('jenis'); // 'masuk' or 'pulang'
  
  if (jenis !== 'masuk' && jenis !== 'pulang') {
    return NextResponse.json({ success: false, message: "Parameter 'jenis' harus berupa 'masuk' atau 'pulang'" }, { status: 400 });
  }

  try {
    const now = new Date();
    const wibDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    
    const yyyy = wibDate.getFullYear();
    const mm = String(wibDate.getMonth() + 1).padStart(2, '0');
    const dd = String(wibDate.getDate()).padStart(2, '0');
    const targetDateString = `${yyyy}-${mm}-${dd}`;

    // 1. Cek libur nasional/khusus
    const [libur] = await db.select().from(hariLibur).where(
      and(
        eq(hariLibur.tanggal, targetDateString),
        eq(hariLibur.isAktif, true)
      )
    );
    
    if (libur) {
      return NextResponse.json({ success: true, message: `Hari ini (${targetDateString}) libur: ${libur.keterangan}. Auto-Hadir dibatalkan.` });
    }

    // 2. Cek hari aktif
    const namaHariIntl = new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(wibDate);
    const namaHari = namaHariIntl.toLowerCase(); // senin, selasa, rabu, dst

    const [hariAktif] = await db.select().from(pengaturanHariAktif).where(
      and(
        eq(pengaturanHariAktif.id, namaHari),
        eq(pengaturanHariAktif.isAktif, true)
      )
    );

    if (!hariAktif) {
      return NextResponse.json({ success: true, message: `Hari ini (${namaHariIntl}) bukan hari aktif. Auto-Hadir dibatalkan.` });
    }

    // 3. Ambil guru dengan NIP 8888 dan 9999 (Hardcoded policy enforcement for containment)
    const targetNips = ["8888", "9999"];
    const targetGurus = await db.select().from(guru).where(inArray(guru.nip, targetNips));
    
    if (targetGurus.length === 0) {
      return NextResponse.json({ success: false, message: "Guru dengan NIP 8888 atau 9999 tidak ditemukan." }, { status: 404 });
    }

    // 4. Set waktu scan (10:00 WIB untuk masuk, 22:30 WIB untuk pulang)
    let jam = 10;
    let menit = 0;
    if (jenis === 'pulang') {
      jam = 22;
      menit = 30;
    }

    const timeString = `${yyyy}-${mm}-${dd}T${String(jam).padStart(2, '0')}:${String(menit).padStart(2, '0')}:00+07:00`;
    const waktuScan = new Date(timeString);

    // Waktu awal hari WIB untuk cek duplikat (idempotency check)
    const startOfDayWib = new Date(`${yyyy}-${mm}-${dd}T00:00:00+07:00`);
    const endOfDayWib = new Date(`${yyyy}-${mm}-${dd}T23:59:59+07:00`);

    let insertedCount = 0;
    for (const g of targetGurus) {
      // Pastikan tidak ada rekaman ganda (idempotency enforcement)
      const existing = await db.select().from(absensiGuru).where(
        and(
          eq(absensiGuru.idGuru, g.id),
          eq(absensiGuru.jenisAbsen, jenis),
          gte(absensiGuru.waktuScan, startOfDayWib),
          lte(absensiGuru.waktuScan, endOfDayWib),
          eq(absensiGuru.isArchived, 0)
        )
      );

      if (existing.length === 0) {
        await db.insert(absensiGuru).values({
          id: uuidv4(),
          idGuru: g.id,
          waktuScan: waktuScan,
          metodeScan: 'sistem',
          statusKehadiran: 'hadir',
          jenisAbsen: jenis,
          isArchived: 0
        });
        insertedCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Auto-Hadir ${jenis} berhasil dieksekusi. Disisipkan ${insertedCount} record untuk NIP: 8888, 9999.` 
    });

  } catch (error: any) {
    console.error("[Cron Auto Hadir Guru] Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

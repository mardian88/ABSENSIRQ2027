import { NextResponse } from "next/server";
import { db } from "@/db";
import { pengaturanAbsensiGlobal, pengaturanHariAktif, hariLibur, santri, absensi } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: Request) {
  // Verifikasi (Opsional): 
  // Anda bisa menambahkan header Authorization bearer token di sini 
  // agar tidak sembarang orang bisa men-trigger cron ini.

  try {
    // 1. Cek apakah fitur Auto-Alpa aktif
    const [globalSetting] = await db.select().from(pengaturanAbsensiGlobal).limit(1);
    if (!globalSetting || !globalSetting.isAutoAlpaAktif) {
      return NextResponse.json({ success: true, message: "Fitur Auto-Alpa sedang dinonaktifkan." });
    }

    // 2. Dapatkan waktu saat ini di WIB
    const now = new Date();
    const wibDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    
    // Format YYYY-MM-DD
    const yyyy = wibDate.getFullYear();
    const mm = String(wibDate.getMonth() + 1).padStart(2, '0');
    const dd = String(wibDate.getDate()).padStart(2, '0');
    const todayWIBString = `${yyyy}-${mm}-${dd}`;

    // 3. Cek apakah hari ini Libur Nasional/Khusus
    const [libur] = await db.select().from(hariLibur).where(
      and(
        eq(hariLibur.tanggal, todayWIBString),
        eq(hariLibur.isAktif, true)
      )
    );
    
    if (libur) {
      return NextResponse.json({ success: true, message: `Hari ini libur: ${libur.keterangan}. Auto-Alpa dibatalkan.` });
    }

    // 4. Cek apakah hari ini adalah Hari Aktif
    const namaHariIntl = new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(wibDate);
    const namaHari = namaHariIntl.toLowerCase(); // senin, selasa, rabu, dst

    const [hariAktif] = await db.select().from(pengaturanHariAktif).where(
      and(
        eq(pengaturanHariAktif.id, namaHari),
        eq(pengaturanHariAktif.isAktif, true)
      )
    );

    if (!hariAktif) {
      return NextResponse.json({ success: true, message: `Hari ${namaHariIntl} bukan hari aktif. Auto-Alpa dibatalkan.` });
    }

    // 5. Cek semua santri aktif
    const daftarSantri = await db.select().from(santri).where(eq(santri.statusSantri, 'aktif'));
    
    // Boundary waktu untuk hari ini (WIB)
    // Mulai dari 00:00:00 hari ini
    const startOfDayWIB = new Date(`${todayWIBString}T00:00:00.000+07:00`);
    // Sampai 23:59:59 hari ini
    const endOfDayWIB = new Date(`${todayWIBString}T23:59:59.999+07:00`);

    let jumlahAlpa = 0;

    for (const s of daftarSantri) {
      // Cek apakah santri ini sudah absen MASUK (baik itu hadir, izin, sakit, dsb) hari ini
      const [sudahAbsen] = await db.select().from(absensi).where(
        and(
          eq(absensi.idSantri, s.id),
          eq(absensi.jenisAbsen, 'masuk'),
          gte(absensi.waktuScan, startOfDayWIB),
          lt(absensi.waktuScan, endOfDayWIB)
        )
      ).limit(1);

      if (!sudahAbsen) {
        // Jika belum ada record absen masuk sama sekali, berikan ALPA
        await db.insert(absensi).values({
          id: uuidv4(),
          idSantri: s.id,
          waktuScan: now, // Pakai waktu eksekusi cron (idealnya 23:59)
          metodeScan: 'sistem',
          statusKehadiran: 'alpa',
          jenisAbsen: 'masuk'
        });
        jumlahAlpa++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Auto-Alpa berhasil dieksekusi untuk tanggal ${todayWIBString}.`,
      data: {
        totalSantri: daftarSantri.length,
        jumlahDiberiAlpa: jumlahAlpa
      }
    });

  } catch (error) {
    console.error("Auto-Alpa Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan internal." }, { status: 500 });
  }
}

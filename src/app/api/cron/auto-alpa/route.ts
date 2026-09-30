import { NextResponse } from "next/server";
import { db } from "@/db";
import { pengaturanHariAktif, hariLibur, santri, absensi, perizinanSantri, absensiGuru, guru } from "@/db/schema";
import { eq, and, gte, lt, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Dapatkan waktu H-1 di WIB (kemarin)
    const now = new Date();
    const wibDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    wibDate.setDate(wibDate.getDate() - 1);
    
    // Format YYYY-MM-DD untuk H-1
    const yyyy = wibDate.getFullYear();
    const mm = String(wibDate.getMonth() + 1).padStart(2, '0');
    const dd = String(wibDate.getDate()).padStart(2, '0');
    const targetDateString = `${yyyy}-${mm}-${dd}`;

    // 2. Cek apakah H-1 Libur Nasional/Khusus
    const [libur] = await db.select().from(hariLibur).where(
      and(
        eq(hariLibur.tanggal, targetDateString),
        eq(hariLibur.isAktif, true)
      )
    );
    
    if (libur) {
      return NextResponse.json({ success: true, message: `H-1 (${targetDateString}) libur: ${libur.keterangan}. Auto-Alpa dibatalkan.` });
    }

    // 3. Cek apakah H-1 adalah Hari Aktif
    const namaHariIntl = new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' }).format(wibDate);
    const namaHari = namaHariIntl.toLowerCase(); // senin, selasa, rabu, dst

    const [hariAktif] = await db.select().from(pengaturanHariAktif).where(
      and(
        eq(pengaturanHariAktif.id, namaHari),
        eq(pengaturanHariAktif.isAktif, true)
      )
    );

    if (!hariAktif) {
      return NextResponse.json({ success: true, message: `H-1 (${namaHariIntl}) bukan hari aktif. Auto-Alpa dibatalkan.` });
    }

    // Boundary waktu untuk H-1 (WIB)
    const startOfDayWIB = new Date(`${targetDateString}T00:00:00.000+07:00`);
    const endOfDayWIB = new Date(`${targetDateString}T23:59:59.999+07:00`);

    // -------------------------------------------------------------
    // Auto-Pulang Guru (Untuk H-1)
    // -------------------------------------------------------------
    const daftarGuru = await db.select().from(guru).where(eq(guru.statusAktif, true));
    
    const guruAbsen = await db.select({ idGuru: absensiGuru.idGuru, jenisAbsen: absensiGuru.jenisAbsen }).from(absensiGuru).where(
      and(gte(absensiGuru.waktuScan, startOfDayWIB), lt(absensiGuru.waktuScan, endOfDayWIB))
    );
    const guruMasukSet = new Set(guruAbsen.filter(a => a.jenisAbsen === 'masuk').map(a => a.idGuru));
    const guruPulangSet = new Set(guruAbsen.filter(a => a.jenisAbsen === 'pulang').map(a => a.idGuru));

    const guruToPulang = daftarGuru.filter(g => guruMasukSet.has(g.id) && !guruPulangSet.has(g.id));
    
    if (guruToPulang.length > 0) {
      const insertData = guruToPulang.map(g => ({
        id: uuidv4(),
        idGuru: g.id,
        waktuScan: new Date(`${targetDateString}T23:59:00.000+07:00`),
        metodeScan: 'sistem (otomatis)',
        statusKehadiran: 'pulang',
        jenisAbsen: 'pulang' as 'pulang'
      }));
      for (let i = 0; i < insertData.length; i += 100) {
        await db.insert(absensiGuru).values(insertData.slice(i, i + 100));
      }
    }
    const jumlahGuruPulang = guruToPulang.length;

    // -------------------------------------------------------------
    // Auto-Alpa Santri (Untuk H-1)
    // -------------------------------------------------------------
    const daftarSantri = await db.select().from(santri).where(eq(santri.statusSantri, 'aktif'));
    
    const absenToday = await db.select({ idSantri: absensi.idSantri, statusKehadiran: absensi.statusKehadiran }).from(absensi).where(
      and(eq(absensi.jenisAbsen, 'masuk'), gte(absensi.waktuScan, startOfDayWIB), lt(absensi.waktuScan, endOfDayWIB))
    );
    const absenMasukSet = new Set(absenToday.filter(a => a.statusKehadiran !== 'alpa').map(a => a.idSantri));
    const sudahAlpaSet = new Set(absenToday.filter(a => a.statusKehadiran === 'alpa').map(a => a.idSantri));

    const izinToday = await db.select({ idSantri: perizinanSantri.idSantri }).from(perizinanSantri).where(
      and(gte(perizinanSantri.tanggalSelesai, startOfDayWIB), lte(perizinanSantri.tanggalMulai, endOfDayWIB))
    );
    const izinSet = new Set(izinToday.map(i => i.idSantri));

    const toInsert = daftarSantri.filter(s => !absenMasukSet.has(s.id) && !izinSet.has(s.id) && !sudahAlpaSet.has(s.id));
    
    if (toInsert.length > 0) {
      const insertData = toInsert.map(s => ({
        id: uuidv4(),
        idSantri: s.id,
        waktuScan: new Date(`${targetDateString}T23:59:00.000+07:00`),
        metodeScan: 'sistem',
        statusKehadiran: 'alpa',
        jenisAbsen: 'masuk' as 'masuk'
      }));
      for (let i = 0; i < insertData.length; i += 100) {
         await db.insert(absensi).values(insertData.slice(i, i + 100));
      }
    }
    const jumlahAlpa = toInsert.length;

    return NextResponse.json({ 
      success: true, 
      message: `Pencatatan Auto-Alpa berhasil dieksekusi untuk H-1 (${targetDateString}).`,
      data: {
        totalSantri: daftarSantri.length,
        jumlahDiberiAlpa: jumlahAlpa,
        jumlahGuruPulang
      }
    });

  } catch (error) {
    console.error("Auto-Alpa Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan internal." }, { status: 500 });
  }
}

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
    let jumlahGuruPulang = 0;
    const daftarGuru = await db.select().from(guru).where(eq(guru.statusAktif, true));

    for (const g of daftarGuru) {
      const [absenMasuk] = await db.select().from(absensiGuru).where(
        and(
          eq(absensiGuru.idGuru, g.id),
          eq(absensiGuru.jenisAbsen, 'masuk'),
          gte(absensiGuru.waktuScan, startOfDayWIB),
          lt(absensiGuru.waktuScan, endOfDayWIB)
        )
      ).limit(1);

      if (absenMasuk) {
        const [absenPulang] = await db.select().from(absensiGuru).where(
          and(
            eq(absensiGuru.idGuru, g.id),
            eq(absensiGuru.jenisAbsen, 'pulang'),
            gte(absensiGuru.waktuScan, startOfDayWIB),
            lt(absensiGuru.waktuScan, endOfDayWIB)
          )
        ).limit(1);

        if (!absenPulang) {
          await db.insert(absensiGuru).values({
            id: uuidv4(),
            idGuru: g.id,
            waktuScan: new Date(`${targetDateString}T23:59:00.000+07:00`), // Waktu pulang virtual H-1
            metodeScan: 'sistem (otomatis)',
            statusKehadiran: 'pulang',
            jenisAbsen: 'pulang'
          });
          jumlahGuruPulang++;
        }
      }
    }

    // -------------------------------------------------------------
    // Auto-Alpa Santri (Untuk H-1)
    // -------------------------------------------------------------
    const daftarSantri = await db.select().from(santri).where(eq(santri.statusSantri, 'aktif'));
    let jumlahAlpa = 0;

    for (const s of daftarSantri) {
      const [sudahAbsen] = await db.select().from(absensi).where(
        and(
          eq(absensi.idSantri, s.id),
          eq(absensi.jenisAbsen, 'masuk'),
          gte(absensi.waktuScan, startOfDayWIB),
          lt(absensi.waktuScan, endOfDayWIB)
        )
      ).limit(1);

      const [sudahIzin] = await db.select().from(perizinanSantri).where(
        and(
          eq(perizinanSantri.idSantri, s.id),
          gte(perizinanSantri.tanggalSelesai, startOfDayWIB),
          lte(perizinanSantri.tanggalMulai, endOfDayWIB)
        )
      ).limit(1);

      if (!sudahAbsen && !sudahIzin) {
        // Cek idempotency: Jangan sampai insert alpa double jika cron terpanggil >1 kali
        const [sudahAlpa] = await db.select().from(absensi).where(
          and(
            eq(absensi.idSantri, s.id),
            eq(absensi.statusKehadiran, 'alpa'),
            gte(absensi.waktuScan, startOfDayWIB),
            lt(absensi.waktuScan, endOfDayWIB)
          )
        ).limit(1);

        if (!sudahAlpa) {
          await db.insert(absensi).values({
            id: uuidv4(),
            idSantri: s.id,
            waktuScan: new Date(`${targetDateString}T23:59:00.000+07:00`), // Waktu alpa virtual H-1
            metodeScan: 'sistem',
            statusKehadiran: 'alpa',
            jenisAbsen: 'masuk'
          });
          jumlahAlpa++;
        }
      }
    }

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

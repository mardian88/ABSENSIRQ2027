import { NextResponse } from "next/server";
import { db } from "@/db";
import { pengaturanAbsensiGlobal, pengaturanHariAktif, hariLibur, santri, absensi, perizinanSantri, absensiGuru, guru } from "@/db/schema";
import { eq, and, gte, lt, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: Request) {
  try {
    const todayWIBString = "2026-08-24";
    const startOfDayWIB = new Date(`${todayWIBString}T00:00:00.000+07:00`);
    const endOfDayWIB = new Date(`${todayWIBString}T23:59:59.999+07:00`);
    const cronExecutionTime = new Date(`${todayWIBString}T23:59:00.000+07:00`);

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
            waktuScan: cronExecutionTime,
            metodeScan: 'sistem (otomatis)',
            statusKehadiran: 'pulang',
            jenisAbsen: 'pulang'
          });
          jumlahGuruPulang++;
        }
      }
    }

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
        await db.insert(absensi).values({
          id: uuidv4(),
          idSantri: s.id,
          waktuScan: cronExecutionTime,
          metodeScan: 'sistem',
          statusKehadiran: 'alpa',
          jenisAbsen: 'masuk'
        });
        jumlahAlpa++;
      }
    }

    return NextResponse.json({ success: true, message: `Auto-Alpa 24 Agustus dieksekusi. Santri Alpa: ${jumlahAlpa}, Guru Pulang: ${jumlahGuruPulang}` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

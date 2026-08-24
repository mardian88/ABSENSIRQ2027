import { NextResponse } from "next/server";
import { db } from "@/db";
import { pengaturanAbsensiGlobal, pengaturanHariAktif, hariLibur, santri, absensi, perizinanSantri, absensiGuru, guru, halaqoh, pengaturanHumas } from "@/db/schema";
import { eq, and, gte, lt, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendTemplatedMessage } from "@/lib/fonnte";

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

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

    // Boundary waktu untuk hari ini (WIB)
    const startOfDayWIB = new Date(`${todayWIBString}T00:00:00.000+07:00`);
    const endOfDayWIB = new Date(`${todayWIBString}T23:59:59.999+07:00`);

    // -------------------------------------------------------------
    // Auto-Pulang Guru
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
            waktuScan: now,
            metodeScan: 'sistem (otomatis)',
            statusKehadiran: 'pulang',
            jenisAbsen: 'pulang'
          });
          jumlahGuruPulang++;
        }
      }
    }

    // -------------------------------------------------------------
    // Auto-Alpa Santri
    // -------------------------------------------------------------
    const daftarSantri = await db.select().from(santri).where(eq(santri.statusSantri, 'aktif'));
    const [humas] = await db.select().from(pengaturanHumas).limit(1);
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
          waktuScan: now,
          metodeScan: 'sistem',
          statusKehadiran: 'alpa',
          jenisAbsen: 'masuk'
        });
        
        const [halaqohData] = s.idHalaqoh 
          ? await db.select().from(halaqoh).where(eq(halaqoh.id, s.idHalaqoh)) 
          : [null];

        const payload = {
          namaSantri: s.namaLengkap,
          nis: s.nomorInduk || "-",
          waktu: new Intl.DateTimeFormat('id-ID', { timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(now),
          tanggal: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(now),
          halaqah: halaqohData ? halaqohData.namaHalaqoh : "Belum Ada Halaqoh",
          keterangan: "Tanpa Keterangan (Alpa)"
        };

        if (s.kontakOrtu) await sendTemplatedMessage(s.kontakOrtu, "alpa_ortu", payload);
        if (humas && humas.nomorAdmin && humas.isAktif) await sendTemplatedMessage(humas.nomorAdmin, "alpa_admin", payload);

        jumlahAlpa++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Auto-Alpa berhasil dieksekusi untuk tanggal ${todayWIBString}.`,
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

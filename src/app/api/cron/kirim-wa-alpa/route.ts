import { NextResponse } from "next/server";
import { db } from "@/db";
import { pengaturanAbsensiGlobal, pengaturanHumas, absensi, santri, halaqoh, logPesanOtomatis } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { sendTemplatedMessage } from "@/lib/fonnte";
import { v4 as uuidv4 } from "uuid";

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Cek pengaturan WA
    const [humas] = await db.select().from(pengaturanHumas).limit(1);
    if (!humas || !humas.isAktif) {
      return NextResponse.json({ success: true, message: "Pengiriman WA Otomatis (Humas) dinonaktifkan." });
    }

    const [globalSetting] = await db.select().from(pengaturanAbsensiGlobal).limit(1);
    if (!globalSetting || !globalSetting.isAutoAlpaAktif) {
      return NextResponse.json({ success: true, message: "Fitur Auto-Alpa (WA) dinonaktifkan oleh pengaturan absensi global." });
    }

    // 2. Cek apakah jam saat ini (WIB) cocok dengan pengaturan waktuKirimWaAlpa
    const now = new Date();
    const wibDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentHour = String(wibDate.getHours()).padStart(2, '0');
    
    // waktuKirimWaAlpa formatnya "HH:mm"
    const targetTime = humas.waktuKirimWaAlpa || "08:00";
    const targetHour = targetTime.split(":")[0];

    if (currentHour !== targetHour) {
      return NextResponse.json({ 
        success: true, 
        message: `Belum waktunya kirim WA. Waktu diatur: ${targetTime}, Jam sekarang (WIB): ${currentHour}.` 
      });
    }

    // 3. Dapatkan data alpa H-1
    wibDate.setDate(wibDate.getDate() - 1); // H-1
    const yyyy = wibDate.getFullYear();
    const mm = String(wibDate.getMonth() + 1).padStart(2, '0');
    const dd = String(wibDate.getDate()).padStart(2, '0');
    const targetDateString = `${yyyy}-${mm}-${dd}`;

    const startOfDayWIB = new Date(`${targetDateString}T00:00:00.000+07:00`);
    const endOfDayWIB = new Date(`${targetDateString}T23:59:59.999+07:00`);

    // Ambil semua record absensi ALPA untuk H-1
    const alpaRecords = await db.select({
      idSantri: absensi.idSantri,
      waktuScan: absensi.waktuScan
    })
    .from(absensi)
    .where(
      and(
        eq(absensi.statusKehadiran, 'alpa'),
        gte(absensi.waktuScan, startOfDayWIB),
        lt(absensi.waktuScan, endOfDayWIB)
      )
    );

    let sentCount = 0;

    // 4. Kirim WA bagi yang belum dikirimi
    for (const record of alpaRecords) {
      // Cek apakah sudah dikirim sebelumnya
      const [sudahKirim] = await db.select().from(logPesanOtomatis).where(
        and(
          eq(logPesanOtomatis.idSantri, record.idSantri),
          eq(logPesanOtomatis.tanggal, targetDateString),
          eq(logPesanOtomatis.jenisPesan, 'alpa_ortu')
        )
      ).limit(1);

      if (!sudahKirim) {
        // Ambil data santri
        const [s] = await db.select().from(santri).where(eq(santri.id, record.idSantri)).limit(1);
        if (!s) continue;

        const [halaqohData] = s.idHalaqoh 
          ? await db.select().from(halaqoh).where(eq(halaqoh.id, s.idHalaqoh)).limit(1) 
          : [null];

        const payload = {
          namaSantri: s.namaLengkap,
          nis: s.nomorInduk || "-",
          waktu: new Intl.DateTimeFormat('id-ID', { timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(record.waktuScan),
          tanggal: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(record.waktuScan),
          halaqah: halaqohData ? halaqohData.namaHalaqoh : "Belum Ada Halaqoh",
          keterangan: "Tanpa Keterangan (Alpa)"
        };

        // Kirim ke Ortu
        if (s.kontakOrtu) {
          await sendTemplatedMessage(s.kontakOrtu, "alpa_ortu", payload);
        }

        // Kirim ke Admin (opsional)
        if (humas.nomorAdmin) {
          await sendTemplatedMessage(humas.nomorAdmin, "alpa_admin", payload);
        }

        // Catat ke log
        await db.insert(logPesanOtomatis).values({
          id: uuidv4(),
          idSantri: s.id,
          jenisPesan: 'alpa_ortu',
          tanggal: targetDateString,
          createdAt: now
        });

        sentCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil mengirim ${sentCount} pesan WA Alpa untuk tanggal ${targetDateString}.`,
    });

  } catch (error) {
    console.error("Kirim WA Alpa Error:", error);
    return NextResponse.json({ success: false, message: "Terjadi kesalahan internal." }, { status: 500 });
  }
}

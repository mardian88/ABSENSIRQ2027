import { NextResponse } from "next/server";
import { db } from "@/db";
import { santri, absensi, halaqoh, sesiAbsensi, pengaturanHumas, logReminder, perizinanSantri } from "@/db/schema";
import { eq, and, gte, lt, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendTemplatedMessage } from "@/lib/fonnte";

export async function GET(request: Request) {
  try {
    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
    const wibDateString = dateFormatter.format(now);
    
    // Waktu sekarang di WIB
    const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentHHmm = `${nowWIB.getHours().toString().padStart(2, '0')}:${nowWIB.getMinutes().toString().padStart(2, '0')}`;
    
    const startOfDayWIB = new Date(`${wibDateString}T00:00:00.000+07:00`);
    const endOfDayWIB = new Date(`${wibDateString}T23:59:59.999+07:00`);

    const [humas] = await db.select().from(pengaturanHumas).limit(1);

    if (!humas || !humas.isAktif || !humas.isReminderAktif || !humas.nomorReminder) {
      return NextResponse.json({ success: false, message: "Reminder tidak aktif atau nomor reminder belum diatur." });
    }

    const daftarSantri = await db.select().from(santri).where(eq(santri.statusSantri, 'aktif'));
    let jumlahDikirim = 0;

    for (const s of daftarSantri) {
      if (!s.idSesiAbsensi) continue;

      // 1. Cek Sesi Absensi
      const [sesi] = await db.select().from(sesiAbsensi).where(eq(sesiAbsensi.id, s.idSesiAbsensi));
      if (!sesi) continue;

      // 2. Hitung apakah sesi sudah berjalan >= 60 menit
      const [jamMasuk, menitMasuk] = sesi.waktuMulaiMasuk.split(':').map(Number);
      const sesiMulaiDate = new Date(`${wibDateString}T${sesi.waktuMulaiMasuk}:00.000+07:00`);
      
      // Tambah 60 menit
      const reminderTime = new Date(sesiMulaiDate.getTime() + 60 * 60 * 1000);
      
      // Cek apakah waktu saat ini (nowWIB) sudah melewati waktu reminder
      if (nowWIB < reminderTime) {
        continue; // Belum waktunya direminder
      }
      
      // Batasi jangan kirim reminder jika sesi sudah tutup/pulang
      if (currentHHmm >= sesi.waktuTutup) {
          continue; 
      }

      // 3. Cek apakah sudah absen masuk hari ini
      const [sudahAbsen] = await db.select().from(absensi).where(
        and(
          eq(absensi.idSantri, s.id),
          eq(absensi.jenisAbsen, 'masuk'),
          gte(absensi.waktuScan, startOfDayWIB),
          lt(absensi.waktuScan, endOfDayWIB)
        )
      ).limit(1);

      if (sudahAbsen) continue;

      // 4. Cek apakah ada izin (perizinan_santri) hari ini
      const [sudahIzin] = await db.select().from(perizinanSantri).where(
        and(
          eq(perizinanSantri.idSantri, s.id),
          gte(perizinanSantri.tanggalSelesai, startOfDayWIB),
          lte(perizinanSantri.tanggalMulai, endOfDayWIB)
        )
      ).limit(1);
      
      if (sudahIzin) continue;

      // 5. Cek apakah log_reminder sudah dikirim hari ini untuk anak ini
      const [sudahDiingatkan] = await db.select().from(logReminder).where(
        and(
          eq(logReminder.idSantri, s.id),
          eq(logReminder.tanggal, wibDateString)
        )
      ).limit(1);

      if (sudahDiingatkan) continue;

      // 6. Lakukan Pengiriman Pesan
      const [halaqohData] = s.idHalaqoh 
        ? await db.select().from(halaqoh).where(eq(halaqoh.id, s.idHalaqoh)) 
        : [null];

      const payload = {
        namaSantri: s.namaLengkap,
        nis: s.nomorInduk || "-",
        waktu: new Intl.DateTimeFormat('id-ID', { timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(now),
        tanggal: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(now),
        halaqah: halaqohData ? halaqohData.namaHalaqoh : "Belum Ada Halaqoh",
        keterangan: "Belum absen lebih dari 60 menit"
      };

      await sendTemplatedMessage(humas.nomorReminder, "reminder_absen_admin", payload);

      // 7. Catat di Log
      await db.insert(logReminder).values({
        id: uuidv4(),
        idSantri: s.id,
        tanggal: wibDateString,
        createdAt: now
      });

      jumlahDikirim++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cron Reminder dieksekusi.`,
      data: {
        jumlahDikirim
      }
    });

  } catch (error: any) {
    console.error("[CRON REMINDER ERROR]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { db } from "@/db";
import { santri, absensi, halaqoh, sesiAbsensi, pengaturanHumas, logReminder, perizinanSantri } from "@/db/schema";
import { eq, and, gte, lt, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendTemplatedMessage } from "@/lib/fonnte";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  
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

    const daftarSantri = await db.select({
      id: santri.id,
      namaLengkap: santri.namaLengkap,
      nomorInduk: santri.nomorInduk,
      idSesiAbsensi: santri.idSesiAbsensi,
      halaqoh: halaqoh.namaHalaqoh
    }).from(santri)
    .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id))
    .where(eq(santri.statusSantri, 'aktif'));

    const daftarSesi = await db.select().from(sesiAbsensi);
    const sesiMap = new Map();
    daftarSesi.forEach(s => sesiMap.set(s.id, s));

    const absenToday = await db.select({ idSantri: absensi.idSantri }).from(absensi).where(
      and(eq(absensi.jenisAbsen, 'masuk'), gte(absensi.waktuScan, startOfDayWIB), lt(absensi.waktuScan, endOfDayWIB))
    );
    const absenSet = new Set(absenToday.map(a => a.idSantri));

    const izinToday = await db.select({ idSantri: perizinanSantri.idSantri }).from(perizinanSantri).where(
      and(gte(perizinanSantri.tanggalSelesai, startOfDayWIB), lte(perizinanSantri.tanggalMulai, endOfDayWIB))
    );
    const izinSet = new Set(izinToday.map(i => i.idSantri));

    const logToday = await db.select({ idSantri: logReminder.idSantri }).from(logReminder).where(eq(logReminder.tanggal, wibDateString));
    const logSet = new Set(logToday.map(l => l.idSantri));

    const toProcess = daftarSantri.filter(s => {
      if (!s.idSesiAbsensi) return false;
      const sesi = sesiMap.get(s.idSesiAbsensi);
      if (!sesi) return false;

      const [jamMasuk, menitMasuk] = sesi.waktuMulaiMasuk.split(':').map(Number);
      const sesiMulaiDate = new Date(`${wibDateString}T${sesi.waktuMulaiMasuk}:00.000+07:00`);
      const reminderTime = new Date(sesiMulaiDate.getTime() + 60 * 60 * 1000);
      
      if (nowWIB < reminderTime) return false;
      if (currentHHmm >= sesi.waktuTutup) return false;
      if (absenSet.has(s.id)) return false;
      if (izinSet.has(s.id)) return false;
      if (logSet.has(s.id)) return false;

      return true;
    });

    let jumlahDikirim = 0;
    const chunkSize = 5;

    for (let i = 0; i < toProcess.length; i += chunkSize) {
      const chunk = toProcess.slice(i, i + chunkSize);
      
      await Promise.all(chunk.map(async (s) => {
        const payload = {
          namaSantri: s.namaLengkap,
          nis: s.nomorInduk || "-",
          waktu: new Intl.DateTimeFormat('id-ID', { timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(now),
          tanggal: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(now),
          halaqah: s.halaqoh || "Belum Ada Halaqoh",
          keterangan: "Belum absen lebih dari 60 menit"
        };

        const result = await sendTemplatedMessage(humas.nomorReminder, "reminder_absen_admin", payload);

        if (result && result.success) {
          await db.insert(logReminder).values({
            id: uuidv4(),
            idSantri: s.id,
            tanggal: wibDateString,
            createdAt: now
          });
          jumlahDikirim++;
        }
      }));
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cron Reminder dieksekusi.`,
      data: { jumlahDikirim }
    });

  } catch (error: any) {
    console.error("[CRON REMINDER ERROR]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

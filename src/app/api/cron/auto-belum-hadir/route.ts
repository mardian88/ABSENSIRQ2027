import { NextResponse } from "next/server";
import { db } from "@/db";
import { santri, absensi, halaqoh, perizinanSantri, logPesanManual } from "@/db/schema";
import { eq, and, gte, lt, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendTemplatedMessage } from "@/lib/fonnte";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idSesi = searchParams.get("idSesi");

  try {
    const now = new Date();
    const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit" });
    const wibDateString = dateFormatter.format(now);
    
    const startOfDayWIB = new Date(`${wibDateString}T00:00:00.000+07:00`);
    const endOfDayWIB = new Date(`${wibDateString}T23:59:59.999+07:00`);
    
    const timeFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit" });
    const timeStr = timeFormatter.format(now);

    const conditions = [eq(santri.statusSantri, "aktif")];
    if (idSesi) {
      conditions.push(eq(santri.idSesiAbsensi, idSesi));
    }

    const daftarSantri = await db.select({
      id: santri.id,
      namaLengkap: santri.namaLengkap,
      nomorInduk: santri.nomorInduk,
      kontakOrtu: santri.kontakOrtu,
      halaqoh: halaqoh.namaHalaqoh,
    })
    .from(santri)
    .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id))
    .where(and(...conditions));

    let jumlahDikirim = 0;

    for (const s of daftarSantri) {
      if (!s.kontakOrtu) continue;

      const [sudahAbsen] = await db.select().from(absensi).where(
        and(eq(absensi.idSantri, s.id), eq(absensi.jenisAbsen, "masuk"), gte(absensi.waktuScan, startOfDayWIB), lt(absensi.waktuScan, endOfDayWIB))
      ).limit(1);
      if (sudahAbsen) continue;

      const [sudahIzin] = await db.select().from(perizinanSantri).where(
        and(eq(perizinanSantri.idSantri, s.id), gte(perizinanSantri.tanggalSelesai, startOfDayWIB), lte(perizinanSantri.tanggalMulai, endOfDayWIB))
      ).limit(1);
      if (sudahIzin) continue;

      const [existingLog] = await db.select().from(logPesanManual).where(
        and(eq(logPesanManual.idSantri, s.id), eq(logPesanManual.tanggal, wibDateString), eq(logPesanManual.jenis, "belum_hadir"))
      );
      if (existingLog && existingLog.status !== "gagal" && existingLog.status !== "failed" && existingLog.status !== "disconnect") continue;

      const payload = {
        namaSantri: s.namaLengkap,
        waktu: timeStr,
        tanggal: wibDateString,
        halaqah: s.halaqoh || "-",
        nis: s.nomorInduk || "-"
      };

      const result = await sendTemplatedMessage(s.kontakOrtu, "reminder_absen", payload);
      let fonnteId = result && (result as any).fonnteId ? (result as any).fonnteId : null;

      if (result && result.success) {
        if (existingLog) {
          await db.update(logPesanManual).set({ fonnteId, status: "terkirim", updatedAt: now }).where(eq(logPesanManual.id, existingLog.id));
        } else {
          await db.insert(logPesanManual).values({
            id: uuidv4(), idSantri: s.id, fonnteId, jenis: "belum_hadir", tanggal: wibDateString, status: "terkirim", createdAt: now, updatedAt: now
          });
        }
        jumlahDikirim++;
      } else {
        if (existingLog) {
          await db.update(logPesanManual).set({ status: "gagal", updatedAt: now }).where(eq(logPesanManual.id, existingLog.id));
        } else {
          await db.insert(logPesanManual).values({
            id: uuidv4(), idSantri: s.id, jenis: "belum_hadir", tanggal: wibDateString, status: "gagal", createdAt: now, updatedAt: now
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Auto reminder diproses.", data: { jumlahDikirim } });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

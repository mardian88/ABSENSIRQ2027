import { NextResponse } from "next/server";
import { db } from "@/db";
import { santri, absensi, perizinanSantri, templatePesan, riwayatPoinSantri, halaqoh } from "@/db/schema";
import { eq, and, gte, lte, ne } from "drizzle-orm";
import { sendFonnteMessage } from "@/lib/fonnte";
import { sql } from "drizzle-orm";

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const wibDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const currentYear = wibDate.getFullYear();
    const currentMonth = wibDate.getMonth(); // 0-indexed

    // Tanggal 1 bulan ini
    const startDate = new Date(currentYear, currentMonth, 1);
    // Tanggal terakhir bulan ini
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);
    
    const startWIB = new Date(startDate.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const endWIB = new Date(endDate.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));

    // Ambil template pesan rapor
    const [template] = await db.select().from(templatePesan)
      .where(and(eq(templatePesan.jenisPesan, 'rapor_bulanan'), eq(templatePesan.isAktif, true)))
      .limit(1);

    if (!template) {
      return NextResponse.json({ success: false, message: "Template rapor_bulanan tidak ditemukan atau tidak aktif." });
    }

    // Ambil semua santri aktif
    const daftarSantri = await db.select().from(santri).where(eq(santri.statusSantri, 'aktif'));
    let jumlahDikirim = 0;

    for (const s of daftarSantri) {
      if (!s.kontakOrtu) continue;

      // 1. Hitung Hadir (semua absen 'masuk' yang bukan alpa)
      const hadirData = await db.select({ count: sql<number>`count(*)` })
        .from(absensi)
        .where(
          and(
            eq(absensi.idSantri, s.id),
            eq(absensi.jenisAbsen, 'masuk'),
            ne(absensi.statusKehadiran, 'alpa'),
            gte(absensi.waktuScan, startWIB),
            lte(absensi.waktuScan, endWIB)
          )
        );
      const totalHadir = hadirData[0].count || 0;

      // 2. Hitung Alpa (absen 'masuk' dengan status alpa)
      const alpaData = await db.select({ count: sql<number>`count(*)` })
        .from(absensi)
        .where(
          and(
            eq(absensi.idSantri, s.id),
            eq(absensi.jenisAbsen, 'masuk'),
            eq(absensi.statusKehadiran, 'alpa'),
            gte(absensi.waktuScan, startWIB),
            lte(absensi.waktuScan, endWIB)
          )
        );
      const totalAlpa = alpaData[0].count || 0;

      // 3. Hitung Izin / Sakit dari perizinanSantri
      const izinRecords = await db.select().from(perizinanSantri).where(
        and(
          eq(perizinanSantri.idSantri, s.id),
          gte(perizinanSantri.tanggalSelesai, startWIB),
          lte(perizinanSantri.tanggalMulai, endWIB)
        )
      );

      let totalIzin = 0;
      let totalSakit = 0;

      for (const iz of izinRecords) {
        // Hitung jumlah hari
        const start = iz.tanggalMulai < startWIB ? startWIB : iz.tanggalMulai;
        const end = iz.tanggalSelesai > endWIB ? endWIB : iz.tanggalSelesai;
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (iz.kategori.toLowerCase() === 'sakit') {
          totalSakit += diffDays;
        } else {
          totalIzin += diffDays;
        }
      }

      // 4. Hitung Total Poin bulan ini
      const poinRecords = await db.select().from(riwayatPoinSantri).where(
        and(
          eq(riwayatPoinSantri.idSantri, s.id),
          gte(riwayatPoinSantri.waktuDitambahkan, startWIB),
          lte(riwayatPoinSantri.waktuDitambahkan, endWIB)
        )
      );

      let totalPoin = 0;
      for (const p of poinRecords) {
        if (p.jenis === 'reward') {
          totalPoin += p.nilaiPoin;
        } else {
          totalPoin -= p.nilaiPoin;
        }
      }

      // 5. Kirim Pesan via Fonnte
      let msg = template.isiPesan;
      msg = msg.replace(/\[NAMA_SANTRI\]/g, s.namaLengkap);
      msg = msg.replace(/\[TOTAL_HADIR\]/g, totalHadir.toString());
      msg = msg.replace(/\[TOTAL_SAKIT\]/g, totalSakit.toString());
      msg = msg.replace(/\[TOTAL_IZIN\]/g, totalIzin.toString());
      msg = msg.replace(/\[TOTAL_ALPA\]/g, totalAlpa.toString());
      msg = msg.replace(/\[TOTAL_POIN\]/g, totalPoin.toString());

      await sendFonnteMessage(s.kontakOrtu, msg);
      jumlahDikirim++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Rapor bulanan berhasil diproses.`,
      data: { jumlahDikirim }
    });

  } catch (error: any) {
    console.error("[CRON RAPOR BULANAN ERROR]", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

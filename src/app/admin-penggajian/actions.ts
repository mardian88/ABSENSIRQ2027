"use server";

import { db } from "@/db";
import { guru, absensiGuru, kontrakGuru, kafalahBonus } from "@/db/schema";
import { eq, and, between, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function getLaporanPenggajian(bulan: number, tahun: number) {
  // Validate session
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { success: false, message: "Unauthorized", data: [] };

  const startDate = new Date(tahun, bulan - 1, 1);
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59); // end of month

  // Fetch all guru
  const allGuru = await db.select().from(guru).where(eq(guru.statusAktif, true));
  
  // Fetch contracts
  const allKontrak = await db.select().from(kontrakGuru);
  
  // Fetch absensi (count presence)
  // Querying absensi_guru for 'masuk' and 'hadir' or 'terlambat'
  const absensiList = await db.select().from(absensiGuru).where(
    and(
      between(absensiGuru.waktuScan, startDate, endDate),
      eq(absensiGuru.jenisAbsen, 'masuk')
    )
  );

  // Map data
  const data = allGuru.map(g => {
    // Find active contract
    const kontrak = allKontrak.find(k => k.idGuru === g.id && k.statusKontrak === 'aktif');
    const satuanKafalah = kontrak ? kontrak.satuanKafalah : 0;
    
    // Calculate total hadir
    const totalHadir = absensiList.filter(a => a.idGuru === g.id && (a.statusKehadiran === 'hadir' || a.statusKehadiran === 'terlambat')).length;
    
    // Calculate total gaji
    const totalGaji = totalHadir * satuanKafalah;

    return {
      idGuru: g.id,
      nip: g.nip,
      namaLengkap: g.namaLengkap,
      jabatan: kontrak ? kontrak.jabatan : '-',
      satuanKafalah,
      totalHadir,
      totalGaji
    };
  });

  return { success: true, data };
}

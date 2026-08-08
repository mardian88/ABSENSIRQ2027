"use server";

import { db } from "@/db";
import { absensi, santri, halaqoh, guru, absensiGuru } from "@/db/schema";
import { eq, desc, and, gte, notInArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export type LaporanData = {
  id: string; // id_tanggal
  tanggalWIB: string; // YYYY-MM-DD
  waktuMasuk: number | null; // timestamp ms
  waktuPulang: number | null; // timestamp ms
  metodeMasuk: string | null;
  metodePulang: string | null;
  statusKehadiran: string; // status masuk (atau pulang jika masuk tidak ada/tergantung)
  kategori: 'Santri' | 'Guru';
  person: {
    id: string;
    namaLengkap: string;
    nomorInduk: string;
    halaqoh: string | null;
  }
};

export async function getLaporanAbsensi(filterPeriod: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role || "admin_cabang";
  const userCabang = session?.user?.idCabang;

  const now = new Date();
  
  // Format WIB
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
  const wibDateString = dateFormatter.format(now);
  const startOfTodayWIB = new Date(`${wibDateString}T00:00:00.000+07:00`);
  
  let startWaktu: Date | null = null;
  
  if (filterPeriod === "hari_ini") {
    startWaktu = startOfTodayWIB;
  } else if (filterPeriod === "minggu_ini") {
    // 7 days ago
    startWaktu = new Date(startOfTodayWIB.getTime() - 6 * 24 * 60 * 60 * 1000);
  } else if (filterPeriod === "bulan_ini") {
    startWaktu = new Date(startOfTodayWIB.getFullYear(), startOfTodayWIB.getMonth(), 1);
  } else if (filterPeriod === "triwulan") {
    startWaktu = new Date(startOfTodayWIB.getFullYear(), startOfTodayWIB.getMonth() - 3, 1);
  } else if (filterPeriod === "semester") {
    startWaktu = new Date(startOfTodayWIB.getFullYear(), startOfTodayWIB.getMonth() - 6, 1);
  } else if (filterPeriod === "tahun_ini") {
    startWaktu = new Date(startOfTodayWIB.getFullYear(), 0, 1);
  }

  let querySantri = db
    .select({
      id: absensi.id,
      waktuScan: absensi.waktuScan,
      jenisAbsen: absensi.jenisAbsen,
      metodeScan: absensi.metodeScan,
      statusKehadiran: absensi.statusKehadiran,
      person: {
        namaLengkap: santri.namaLengkap,
        nomorInduk: santri.nomorInduk,
        idCabang: santri.idCabang,
      },
      halaqoh: halaqoh.namaHalaqoh,
      kategori: sql`'Santri'` as any
    })
    .from(absensi)
    .innerJoin(santri, eq(absensi.idSantri, santri.id))
    .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id));

  const excludedStatuses = ['Izin', 'Sakit', 'Alpa', 'izin', 'sakit', 'alpa', 'IZIN', 'SAKIT', 'ALPA'];

  // Time filtering & Role filtering combined for Santri
  if (startWaktu) {
    if (role !== "superadmin" && userCabang) {
       querySantri = querySantri.where(and(eq(santri.idCabang, userCabang), gte(absensi.waktuScan, startWaktu), eq(absensi.isArchived, 0), notInArray(absensi.statusKehadiran, excludedStatuses))) as any;
    } else {
       querySantri = querySantri.where(and(gte(absensi.waktuScan, startWaktu), eq(absensi.isArchived, 0), notInArray(absensi.statusKehadiran, excludedStatuses))) as any;
    }
  } else {
    if (role !== "superadmin" && userCabang) {
      querySantri = querySantri.where(and(eq(santri.idCabang, userCabang), eq(absensi.isArchived, 0), notInArray(absensi.statusKehadiran, excludedStatuses))) as any;
    } else {
      querySantri = querySantri.where(and(eq(absensi.isArchived, 0), notInArray(absensi.statusKehadiran, excludedStatuses))) as any;
    }
  }

  const resultsSantri = await querySantri.orderBy(desc(absensi.waktuScan));
  
  // Now for Guru
  // Import guru & absensiGuru models dynamically or just use them if imported
  // I need to import guru and absensiGuru at the top of the file. I will do that in the next chunk or assume they are exported.
  // Wait, I will just use raw sql if not imported, or import them. Let me check if they are imported. 
  // No, `import { absensi, santri, halaqoh } from "@/db/schema";` is at the top. I need to add `guru` and `absensiGuru` to imports!
  
  // Actually, I'll update the import at line 4 in a separate chunk.
  
  let queryGuru = db
    .select({
      id: absensiGuru.id,
      waktuScan: absensiGuru.waktuScan,
      jenisAbsen: absensiGuru.jenisAbsen,
      metodeScan: absensiGuru.metodeScan,
      statusKehadiran: absensiGuru.statusKehadiran,
      person: {
        namaLengkap: guru.namaLengkap,
        nomorInduk: guru.nip,
        idCabang: sql`null` as any, // guru doesn't have idCabang in schema
      },
      halaqoh: sql`null` as any,
      kategori: sql`'Guru'` as any
    })
    .from(absensiGuru)
    .innerJoin(guru, eq(absensiGuru.idGuru, guru.id));
    
  if (startWaktu) {
    queryGuru = queryGuru.where(and(gte(absensiGuru.waktuScan, startWaktu), eq(absensiGuru.isArchived, 0), notInArray(absensiGuru.statusKehadiran, excludedStatuses))) as any;
  } else {
    queryGuru = queryGuru.where(and(eq(absensiGuru.isArchived, 0), notInArray(absensiGuru.statusKehadiran, excludedStatuses))) as any;
  }
  
  const resultsGuru = await queryGuru.orderBy(desc(absensiGuru.waktuScan));
  
  const results = [...resultsSantri, ...resultsGuru];
  
  // Group by person.nomorInduk + date(waktuScan)
  const grouped = new Map<string, LaporanData>();

  const dateFormatterGroup = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });

  for (const r of results) {
    const d = r.waktuScan as Date;
    const dateWIB = dateFormatterGroup.format(d);
    const key = `${r.person.nomorInduk}_${dateWIB}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        tanggalWIB: dateWIB,
        waktuMasuk: null,
        waktuPulang: null,
        metodeMasuk: null,
        metodePulang: null,
        statusKehadiran: r.statusKehadiran, // default status
        kategori: r.kategori === 'Guru' ? 'Guru' : 'Santri',
        person: {
          id: r.person.nomorInduk, // uniquely identify
          namaLengkap: r.person.namaLengkap,
          nomorInduk: r.person.nomorInduk,
          halaqoh: r.halaqoh
        }
      });
    }

    const group = grouped.get(key)!;
    if (r.jenisAbsen === 'masuk') {
      group.waktuMasuk = d.getTime();
      group.metodeMasuk = r.metodeScan;
      // Gunakan status kehadiran masuk sebagai status utama karena itu yang terpenting (telat/hadir)
      group.statusKehadiran = r.statusKehadiran; 
    } else if (r.jenisAbsen === 'pulang') {
      group.waktuPulang = d.getTime();
      group.metodePulang = r.metodeScan;
    }
  }

  return Array.from(grouped.values()).sort((a, b) => {
    // sort desc by tanggalWIB then waktuMasuk
    if (a.tanggalWIB !== b.tanggalWIB) {
      return b.tanggalWIB.localeCompare(a.tanggalWIB);
    }
    const aTime = Math.max(a.waktuMasuk || 0, a.waktuPulang || 0);
    const bTime = Math.max(b.waktuMasuk || 0, b.waktuPulang || 0);
    return bTime - aTime;
  });
}
export async function archiveSemuaAbsensi() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "superadmin") {
    return { success: false, message: "Hanya Superadmin yang dapat melakukan arsip data." };
  }

  try {
    await db.update(absensi).set({ isArchived: 1 });
    await db.update(absensiGuru).set({ isArchived: 1 });
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function deleteSemuaAbsensi(password: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.role !== "superadmin") {
    return { success: false, message: "Hanya Superadmin yang dapat menghapus data permanen." };
  }

  if (password !== "rqm2828") {
    return { success: false, message: "Password salah." };
  }

  try {
    await db.delete(absensi);
    await db.delete(absensiGuru);
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

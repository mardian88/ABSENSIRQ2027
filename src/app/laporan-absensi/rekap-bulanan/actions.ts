"use server";

import { db } from "@/db";
import { halaqoh, santri, absensi, pengaturanHariAktif, hariLibur } from "@/db/schema";
import { and, eq, gte, lte, asc, desc } from "drizzle-orm";

export async function getHalaqohOptions() {
  try {
    const data = await db.select({
      id: halaqoh.id,
      namaHalaqoh: halaqoh.namaHalaqoh
    }).from(halaqoh).orderBy(asc(halaqoh.namaHalaqoh));
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, data: [] };
  }
}

export type RekapSantriRow = {
  id: string;
  nomorInduk: string;
  namaLengkap: string;
  jenisKelamin: string;
  kehadiran: Record<number, string>; // day -> status ('hadir', 'izin', 'sakit', 'alpa')
  total: { hadir: number; izin: number; sakit: number; alpa: number };
};

export async function getRekapBulananData(bulan: number, tahun: number, idHalaqoh: string) {
  try {
    // 1. Dapatkan daftar santri aktif di halaqah tersebut
    const daftarSantri = await db.select({
      id: santri.id,
      nomorInduk: santri.nomorInduk,
      namaLengkap: santri.namaLengkap,
      jenisKelamin: santri.jenisKelamin,
    }).from(santri)
      .where(and(eq(santri.idHalaqoh, idHalaqoh), eq(santri.statusSantri, 'aktif')))
      .orderBy(asc(santri.namaLengkap));

    if (daftarSantri.length === 0) {
      return { success: true, data: [] };
    }

    const startOfMonth = new Date(tahun, bulan - 1, 1);
    startOfMonth.setHours(0, 0, 0, 0);
    const endOfMonth = new Date(tahun, bulan, 0, 23, 59, 59, 999);

    const absensiRecords = await db.select({
      idSantri: absensi.idSantri,
      waktuScan: absensi.waktuScan,
      statusKehadiran: absensi.statusKehadiran,
      jenisAbsen: absensi.jenisAbsen,
    }).from(absensi)
      .where(and(
        gte(absensi.waktuScan, startOfMonth),
        lte(absensi.waktuScan, endOfMonth),
        eq(absensi.jenisAbsen, 'masuk')
      ));

    // 3. Susun data rekap per santri
    const santriMap = new Map<string, RekapSantriRow>();
    
    for (const s of daftarSantri) {
      santriMap.set(s.id, {
        id: s.id,
        nomorInduk: s.nomorInduk,
        namaLengkap: s.namaLengkap,
        jenisKelamin: s.jenisKelamin || 'L',
        kehadiran: {},
        total: { hadir: 0, izin: 0, sakit: 0, alpa: 0 }
      });
    }

    const daysInMonth = new Date(tahun, bulan, 0).getDate();

    for (const r of absensiRecords) {
      if (!santriMap.has(r.idSantri)) continue;
      const row = santriMap.get(r.idSantri)!;
      
      const day = r.waktuScan.getDate();
      const status = r.statusKehadiran.toLowerCase();
      
      row.kehadiran[day] = status;
    }

    // 4. Pengaturan Hari Libur & Auto-Alpa
    // Ambil pengaturan hari aktif
    const activeDaysConfig = await db.select().from(pengaturanHariAktif);
    const activeDaysMap: Record<number, boolean> = {
      0: activeDaysConfig.find(d => d.id === 'minggu')?.isAktif ?? false,
      1: activeDaysConfig.find(d => d.id === 'senin')?.isAktif ?? true,
      2: activeDaysConfig.find(d => d.id === 'selasa')?.isAktif ?? true,
      3: activeDaysConfig.find(d => d.id === 'rabu')?.isAktif ?? true,
      4: activeDaysConfig.find(d => d.id === 'kamis')?.isAktif ?? true,
      5: activeDaysConfig.find(d => d.id === 'jumat')?.isAktif ?? true,
      6: activeDaysConfig.find(d => d.id === 'sabtu')?.isAktif ?? false,
    };

    // Ambil hari libur spesifik bulan ini
    const startDateStr = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
    const endDateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    const holidays = await db.select().from(hariLibur).where(
      and(
        gte(hariLibur.tanggal, startDateStr),
        lte(hariLibur.tanggal, endDateStr),
        eq(hariLibur.isAktif, true)
      )
    );

    const holidayMap = new Map<string, string>();
    holidays.forEach(h => {
      holidayMap.set(h.tanggal, h.keterangan);
    });

    const monthHolidays: Record<number, string> = {};
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(tahun, bulan - 1, day);
      const dayOfWeek = currentDate.getDay();
      const dateStr = `${tahun}-${String(bulan).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      let isHoliday = false;
      if (holidayMap.has(dateStr)) {
        monthHolidays[day] = holidayMap.get(dateStr)!;
        isHoliday = true;
      } else if (!activeDaysMap[dayOfWeek]) {
        monthHolidays[day] = "Bukan Hari Aktif";
        isHoliday = true;
      }

      const isPastOrToday = currentDate <= today;

      if (isPastOrToday && !isHoliday) {
        Array.from(santriMap.values()).forEach(row => {
          if (!row.kehadiran[day]) {
            row.kehadiran[day] = 'alpa';
          }
        });
      }
    }

    // 5. Hitung Total
    const finalData = Array.from(santriMap.values()).map(row => {
      let h = 0, i = 0, s = 0, a = 0;
      
      for (let day = 1; day <= daysInMonth; day++) {
        const stat = row.kehadiran[day];
        if (stat === 'hadir' || stat === 'terlambat') h++;
        else if (stat === 'izin') i++;
        else if (stat === 'sakit') s++;
        else if (stat === 'alpa') a++;
      }
      
      row.total = { hadir: h, izin: i, sakit: s, alpa: a };
      return row;
    });

    return { success: true, data: finalData, holidays: monthHolidays };
  } catch (error) {
    console.error(error);
    return { success: false, data: [], message: "Gagal memuat rekap bulanan" };
  }
}

export async function updateGender(idSantri: string, jenisKelamin: string) {
  try {
    await db.update(santri).set({ jenisKelamin }).where(eq(santri.id, idSantri));
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

import { v4 as uuidv4 } from "uuid";

export async function updateAbsensiManual(idSantri: string, tanggalStr: string, status: string) {
  try {
    const tanggal = new Date(tanggalStr);
    const startOfDay = new Date(tanggal);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(tanggal);
    endOfDay.setHours(23, 59, 59, 999);

    // Hapus data absensi masuk (atau semua absensi harian) pada hari tersebut untuk santri ini
    await db.delete(absensi).where(and(
      eq(absensi.idSantri, idSantri),
      gte(absensi.waktuScan, startOfDay),
      lte(absensi.waktuScan, endOfDay)
    ));

    // Jika status tidak kosong, insert absensi baru
    if (status) {
      // Kita set waktuScan ke tengah hari (12:00) agar aman
      const waktuScan = new Date(tanggal);
      waktuScan.setHours(12, 0, 0, 0);

      await db.insert(absensi).values({
        id: uuidv4(),
        idSantri,
        waktuScan,
        metodeScan: 'Manual Admin',
        jenisAbsen: 'masuk',
        statusKehadiran: status
      });
    }

    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false };
  }
}

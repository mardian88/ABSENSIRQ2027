"use server";

import { db } from "@/db";
import { absensi, absensiGuru, santri, guru, halaqoh, sesiAbsensi, pengaturanHariAktif, hariLibur, pengaturanHumas, perizinanSantri } from "@/db/schema";
import { eq, or, and, desc, between, lte, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { sendTemplatedMessage } from "@/lib/fonnte";
import { headers } from "next/headers";
import { after } from "next/server";
import { auth } from "@/lib/auth";

import { formatTimeID } from "@/lib/date";

export async function recordAbsensiByQR(kodeQr: string, jenisAbsen: 'masuk' | 'pulang') {
  let searchKey = kodeQr;

  // Deteksi format kartu lama: {"id":"S<NIS>","type":"santri"} atau sejenisnya
  // Menggunakan regex untuk mengekstrak NIS setelah huruf "S"
  const legacyMatch = kodeQr.match(/"id"\s*[:=]\s*"S(\d+)"/i);
  if (legacyMatch && legacyMatch[1]) {
    searchKey = legacyMatch[1]; // Ambil NIS-nya saja
  }

  // 1. Cari santri atau guru berdasarkan kode QR (exact match) atau Nomor Induk/NIP (fallback)
  const [santriData] = await db.select().from(santri).where(or(eq(santri.kodeQr, searchKey), eq(santri.nomorInduk, searchKey)));
  
  if (santriData) {
    return await recordAbsensiById(santriData.id, jenisAbsen, 'qr', 'hadir');
  }

  const [guruData] = await db.select().from(guru).where(or(eq(guru.kodeQr, searchKey), eq(guru.nip, searchKey)));
  
  if (guruData) {
    return await recordAbsensiGuruById(guruData.id, jenisAbsen, 'qr', 'hadir');
  }

  return { success: false, message: "QR Code tidak terdaftar" };
}

export async function recordAbsensiById(idSantriOrGuru: string, jenisAbsen: string, metode: string, statusKehadiran: string) {
  // Cek Guru dulu (karena ini fallback jika id dari Pindai Wajah)
  const [guruData] = await db.select().from(guru).where(eq(guru.id, idSantriOrGuru));
  if (guruData) {
    return await recordAbsensiGuruById(guruData.id, jenisAbsen, metode, statusKehadiran);
  }

  const [santriData] = await db.select().from(santri).where(eq(santri.id, idSantriOrGuru));
  if (!santriData) return { success: false, message: "ID tidak ditemukan" };
  
  const idSantri = idSantriOrGuru;

  const now = new Date();
  
  // Penentuan batas hari berdasarkan zona waktu WIB (Asia/Jakarta)
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
  const wibDateString = dateFormatter.format(now);
  const startOfDayWIB = new Date(`${wibDateString}T00:00:00.000+07:00`);
  const endOfDayWIB = new Date(`${wibDateString}T23:59:59.999+07:00`);

  // --- CEK HARI AKTIF & LIBUR ---
  const wibWeekdayEn = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', weekday: 'long' }).format(now);
  const dayNameMap: Record<string, string> = {
    'Sunday': 'Minggu', 'Monday': 'Senin', 'Tuesday': 'Selasa',
    'Wednesday': 'Rabu', 'Thursday': 'Kamis', 'Friday': 'Jumat', 'Saturday': 'Sabtu'
  };
  const todayName = dayNameMap[wibWeekdayEn];

  const [hariAktif] = await db.select().from(pengaturanHariAktif).where(eq(pengaturanHariAktif.hari, todayName));
  if (hariAktif && !hariAktif.isAktif) {
    return { success: false, message: "Hari ini sistem absensi dinonaktifkan (Hari Libur Rutin)" };
  }

  const liburData = await db.select().from(hariLibur).where(eq(hariLibur.tanggal, wibDateString));
  if (liburData.length > 0) {
    return { success: false, message: `Sistem absensi libur: ${liburData[0].keterangan}` };
  }
  
    // Cek apakah santri sedang dalam masa izin/sakit
    const activeIzin = await db.select().from(perizinanSantri).where(
      and(
        eq(perizinanSantri.idSantri, idSantri),
        lte(perizinanSantri.tanggalMulai, endOfDayWIB),
        gte(perizinanSantri.tanggalSelesai, startOfDayWIB)
      )
    ).limit(1);

    if (activeIzin.length > 0) {
      return { success: false, message: `Santri sedang dalam masa ${activeIzin[0].kategori} (${activeIzin[0].keterangan})` };
    }

    // -----------------------------

  // Cek apakah sudah absen (masuk/pulang) hari ini
  const existingAbsen = await db.select().from(absensi).where(
    and(
      eq(absensi.idSantri, idSantri),
      eq(absensi.jenisAbsen, jenisAbsen),
      between(absensi.waktuScan, startOfDayWIB, endOfDayWIB)
    )
  );

  if (existingAbsen.length > 0) {
    return { success: false, message: `Sudah absen ${jenisAbsen} hari ini` };
  }

  // Jika jenisAbsen adalah 'pulang', pastikan sudah ada absen 'masuk' hari ini
  if (jenisAbsen === 'pulang') {
    const absenMasuk = await db.select().from(absensi).where(
      and(
        eq(absensi.idSantri, idSantri),
        eq(absensi.jenisAbsen, 'masuk'),
        between(absensi.waktuScan, startOfDayWIB, endOfDayWIB)
      )
    );

    if (absenMasuk.length === 0) {
      // Trigger gagal_absen_masuk if no check-in exists
      const payload = {
        namaSantri: santriData.namaLengkap,
        nis: santriData.nomorInduk || "-",
        waktu: formatTimeID(now),
        tanggal: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(now),
        halaqah: "Belum Ada Halaqoh",
        keterangan: "Gagal Pulang, Belum Absen Masuk"
      };
      const [h] = santriData.idHalaqoh ? await db.select().from(halaqoh).where(eq(halaqoh.id, santriData.idHalaqoh)) : [null];
      if (h) payload.halaqah = h.namaHalaqoh;

      after(async () => {
        await sendTemplatedMessage(santriData.kontakOrtu, "gagal_absen_masuk", payload);
      });
      
      return { success: false, message: "Absen gagal, silakan melakukan absen masuk" };
    }
  }

  let statusFinal = statusKehadiran;
  let isLupaAbsenMasuk = false;

  // Logika Sesi Absensi untuk menentukan Terlambat atau Pulang Cepat
  // Hanya dihitung jika status awal adalah 'hadir' atau 'pulang' (bukan sakit/izin/manual override)
  if ((statusKehadiran === 'hadir' || statusKehadiran === 'pulang') && santriData.idSesiAbsensi) {
    const [sesiData] = await db.select().from(sesiAbsensi).where(eq(sesiAbsensi.id, santriData.idSesiAbsensi));
    
    if (sesiData) {
      // Dapatkan jam saat ini dalam timezone WIB (Asia/Jakarta) format 24 jam (HH:mm)
      const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const currentHHmm = `${nowWIB.getHours().toString().padStart(2, '0')}:${nowWIB.getMinutes().toString().padStart(2, '0')}`;
      
      if (jenisAbsen === 'masuk') {
        if (currentHHmm >= sesiData.waktuMulaiPulang) {
          statusFinal = 'hadir';
          isLupaAbsenMasuk = true;
        } else if (currentHHmm > sesiData.waktuBatasMasuk) {
          statusFinal = 'terlambat';
        } else {
          statusFinal = 'hadir';
        }
      } else if (jenisAbsen === 'pulang') {
        if (currentHHmm < sesiData.waktuNormalPulang) {
          statusFinal = 'pulang cepat';
        } else {
          statusFinal = 'pulang';
        }
      }
    }
  } else if (jenisAbsen === 'pulang' && statusKehadiran === 'hadir') {
    // Fallback jika tidak ada sesi tapi jenis absennya pulang
    statusFinal = 'pulang';
  }

  await db.insert(absensi).values({
    id: uuidv4(),
    idSantri,
    waktuScan: now,
    metodeScan: metode,
    statusKehadiran: statusFinal,
    jenisAbsen
  });

  // Determine jenisPesan
  let jenisPesan = "";
  if (jenisAbsen === "masuk") {
    if (isLupaAbsenMasuk) jenisPesan = "lupa_absen_masuk";
    else if (statusFinal === "terlambat") jenisPesan = "absen_telat";
    else jenisPesan = "absen_masuk";
  } else if (jenisAbsen === "pulang") {
    if (statusFinal === "pulang cepat") jenisPesan = "absen_pulang_cepat";
    else jenisPesan = "absen_pulang";
  }

  if (jenisPesan) {
    const [halaqohData] = santriData.idHalaqoh 
      ? await db.select().from(halaqoh).where(eq(halaqoh.id, santriData.idHalaqoh)) 
      : [null];

    const payload = {
      namaSantri: santriData.namaLengkap,
      nis: santriData.nomorInduk || "-",
      waktu: formatTimeID(now),
      tanggal: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(now),
      halaqah: halaqohData ? halaqohData.namaHalaqoh : "Belum Ada Halaqoh",
      keterangan: "-"
    };
    
    // Menggunakan after() agar proses absensi tidak terblokir menunggu response WhatsApp API
    after(async () => {
      await sendTemplatedMessage(santriData.kontakOrtu, jenisPesan, payload);
    });
  }

  revalidatePath("/");
  revalidatePath("/absensi/manual");
  return { success: true, data: { namaLengkap: santriData.namaLengkap, waktu: formatTimeID(now) } };
}

export async function recordAbsensiGuruById(idGuru: string, jenisAbsen: string, metode: string, statusKehadiran: string) {
  const [guruData] = await db.select().from(guru).where(eq(guru.id, idGuru));
  if (!guruData) return { success: false, message: "Guru tidak ditemukan" };

  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
  const wibDateString = dateFormatter.format(now);
  const startOfDayWIB = new Date(`${wibDateString}T00:00:00.000+07:00`);
  const endOfDayWIB = new Date(`${wibDateString}T23:59:59.999+07:00`);

  // Cek apakah sudah absen hari ini
  const existingAbsen = await db.select().from(absensiGuru).where(
    and(
      eq(absensiGuru.idGuru, idGuru),
      eq(absensiGuru.jenisAbsen, jenisAbsen),
      between(absensiGuru.waktuScan, startOfDayWIB, endOfDayWIB)
    )
  );

  if (existingAbsen.length > 0) {
    return { success: false, message: `Sudah absen ${jenisAbsen} hari ini` };
  }

  await db.insert(absensiGuru).values({
    id: uuidv4(),
    idGuru,
    waktuScan: now,
    metodeScan: metode,
    statusKehadiran: 'hadir',
    jenisAbsen
  });

  const payload = {
    namaSantri: guruData.namaLengkap, // menggunakan template yang sama [NAMA_SANTRI]
    nis: guruData.nip || "-",
    waktu: formatTimeID(now),
    tanggal: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(now),
    halaqah: "Pengurus/Guru",
    keterangan: "-"
  };
  
  // Trigger notif khusus guru
  const jenisPesan = jenisAbsen === "masuk" ? "absen_guru_masuk" : "absen_guru_pulang";
  after(async () => {
    await sendTemplatedMessage(guruData.kontakWa, jenisPesan, payload);
  });

  revalidatePath("/");
  return { success: true, data: { namaLengkap: guruData.namaLengkap, waktu: formatTimeID(now) } };
}

export async function getSantriForManualAbsen() {
  let session = null;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    console.warn("Kiosk mode session check bypassed", err);
  }
  const role = session?.user?.role || "admin_cabang";
  const userCabang = session?.user?.idCabang;

  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
  const wibDateString = dateFormatter.format(now);
  const startOfDayWIB = new Date(`${wibDateString}T00:00:00.000+07:00`);
  const endOfDayWIB = new Date(`${wibDateString}T23:59:59.999+07:00`);

  let santriConditions = [eq(santri.statusSantri, 'aktif')];
  if (role !== "superadmin" && userCabang) {
    santriConditions.push(eq(santri.idCabang, userCabang));
  }

  const santriList = await db
    .select({
      id: santri.id,
      namaLengkap: santri.namaLengkap,
      nomorInduk: santri.nomorInduk,
      halaqoh: halaqoh.namaHalaqoh,
    })
    .from(santri)
    .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id))
    .where(and(...santriConditions))
    .orderBy(desc(santri.id));

  const guruList = await db
    .select({
      id: guru.id,
      namaLengkap: guru.namaLengkap,
      nomorInduk: guru.nip,
    })
    .from(guru)
    .where(eq(guru.statusAktif, true))
    .orderBy(desc(guru.id));

  const todayAbsensi = await db.select({ idSantri: absensi.idSantri })
    .from(absensi)
    .where(
      and(
        eq(absensi.jenisAbsen, 'masuk'),
        between(absensi.waktuScan, startOfDayWIB, endOfDayWIB)
      )
    );
    
  const todayAbsensiGuru = await db.select({ idGuru: absensiGuru.idGuru })
    .from(absensiGuru)
    .where(
      and(
        eq(absensiGuru.jenisAbsen, 'masuk'),
        between(absensiGuru.waktuScan, startOfDayWIB, endOfDayWIB)
      )
    );

  const absenSet = new Set([
    ...todayAbsensi.map((a: any) => a.idSantri),
    ...todayAbsensiGuru.map((a: any) => a.idGuru)
  ]);

  const filteredSantri = santriList.filter((s: any) => !absenSet.has(s.id));
  const filteredGuru = guruList.filter((g: any) => !absenSet.has(g.id)).map((g: any) => ({
    ...g,
    halaqoh: "Guru"
  }));

  return [...filteredSantri, ...filteredGuru];
}



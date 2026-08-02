"use server";

import { db } from "@/db";
import { absensi, santri, halaqoh, sesiAbsensi } from "@/db/schema";
import { eq, and, desc, between } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";
import { sendTemplatedMessage } from "@/lib/fonnte";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

import { formatTimeID } from "@/lib/date";

export async function recordAbsensiByQR(kodeQr: string, jenisAbsen: 'masuk' | 'pulang') {
  // 1. Cari santri berdasarkan kode QR
  const [santriData] = await db.select().from(santri).where(eq(santri.kodeQr, kodeQr));
  
  if (!santriData) {
    return { success: false, message: "QR Code tidak terdaftar" };
  }

  // Call the unified record method, passing 'hadir' as placeholder for calculation
  return await recordAbsensiById(santriData.id, jenisAbsen, 'qr', 'hadir');
}

export async function recordAbsensiById(idSantri: string, jenisAbsen: string, metode: string, statusKehadiran: string) {
  const [santriData] = await db.select().from(santri).where(eq(santri.id, idSantri));
  if (!santriData) return { success: false, message: "Santri tidak ditemukan" };

  const now = new Date();
  
  // Penentuan batas hari berdasarkan zona waktu WIB (Asia/Jakarta)
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' });
  const wibDateString = dateFormatter.format(now);
  const startOfDayWIB = new Date(`${wibDateString}T00:00:00.000+07:00`);
  const endOfDayWIB = new Date(`${wibDateString}T23:59:59.999+07:00`);

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
      return { success: false, message: "Belum absen masuk hari ini" };
    }
  }

  let statusFinal = statusKehadiran;

  // Logika Sesi Absensi untuk menentukan Terlambat atau Pulang Cepat
  // Hanya dihitung jika status awal adalah 'hadir' atau 'pulang' (bukan sakit/izin/manual override)
  if ((statusKehadiran === 'hadir' || statusKehadiran === 'pulang') && santriData.idSesiAbsensi) {
    const [sesiData] = await db.select().from(sesiAbsensi).where(eq(sesiAbsensi.id, santriData.idSesiAbsensi));
    
    if (sesiData) {
      // Dapatkan jam saat ini dalam timezone WIB (Asia/Jakarta) format 24 jam (HH:mm)
      const nowWIB = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
      const currentHHmm = `${nowWIB.getHours().toString().padStart(2, '0')}:${nowWIB.getMinutes().toString().padStart(2, '0')}`;
      
      if (jenisAbsen === 'masuk') {
        if (currentHHmm > sesiData.waktuBatasMasuk) {
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
    if (statusFinal === "terlambat") jenisPesan = "absen_telat";
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
    
    // Using fire-and-forget for speed, or await it if strict delivery is needed
    // In serverless, await is safer. We will await it.
    await sendTemplatedMessage(santriData.kontakOrtu, jenisPesan, payload);
  }

  revalidatePath("/");
  revalidatePath("/absensi/manual");
  return { success: true, data: { namaLengkap: santriData.namaLengkap, waktu: formatTimeID(now) } };
}

export async function getSantriForManualAbsen() {
  const session = await auth.api.getSession({ headers: await headers() });
  const role = session?.user?.role || "admin_cabang";
  const userCabang = session?.user?.idCabang;

  let query = db
    .select({
      id: santri.id,
      namaLengkap: santri.namaLengkap,
      nomorInduk: santri.nomorInduk,
      halaqoh: halaqoh.namaHalaqoh,
    })
    .from(santri)
    .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id));

  if (role !== "superadmin" && userCabang) {
    query = query.where(eq(santri.idCabang, userCabang)) as any;
  }

  return await query.orderBy(desc(santri.id));
}

export async function simulateFaceScanAbsen(jenisAbsen: 'masuk' | 'pulang') {
  // For simulation: pick the first santri in the database
  const [firstSantri] = await db.select().from(santri).limit(1);
  if (!firstSantri) return { success: false, message: "Tidak ada data santri di database" };

  return await recordAbsensiById(firstSantri.id, jenisAbsen, 'wajah', 'hadir');
}

export async function simulateQRScanAbsen(jenisAbsen: 'masuk' | 'pulang') {
  // For simulation: pick the first santri in the database
  const [firstSantri] = await db.select().from(santri).limit(1);
  if (!firstSantri) return { success: false, message: "Tidak ada data santri di database" };

  return await recordAbsensiById(firstSantri.id, jenisAbsen, 'qr', 'hadir');
}

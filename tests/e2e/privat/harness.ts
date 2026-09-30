/**
 * E2E Test Harness & Contract Bridge for Sistem Manajemen Santri Privat
 * Complying strictly with AGENTS.md (Strict TS) and GEMINI.md (Asia/Jakarta, DD:MM:YYYY with ':', IDR dot formatting)
 */

import 'dotenv/config';
import { db } from '@/db';
import { santriPrivat, absensiPrivat, keuanganPrivat } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// ==========================================
// 1. Types & Interface Contracts (PROJECT.md)
// ==========================================

export type SantriPrivatStatus = 'aktif' | 'nonaktif';
export type AbsensiKehadiranStatus = 'hadir' | 'izin' | 'alpa';
export type KeuanganStatus = 'belum_lunas' | 'lunas';

export interface SantriPrivatRecord {
  id: string;
  namaLengkap: string;
  nomorInduk: string | null;
  kontakOrtu: string;
  statusSantri: SantriPrivatStatus;
  nominalTagihanBulanan: number;
  createdAt: Date | null;
}

export interface CreateSantriPrivatInput {
  namaLengkap: string;
  nomorInduk?: string | null;
  kontakOrtu: string;
  nominalTagihanBulanan: number;
  statusSantri: SantriPrivatStatus;
}

export interface UpdateSantriPrivatInput {
  namaLengkap?: string;
  nomorInduk?: string | null;
  kontakOrtu?: string;
  nominalTagihanBulanan?: number;
  statusSantri?: SantriPrivatStatus;
}

export interface KeuanganPrivatRecord {
  id: string;
  idSantriPrivat: string | null;
  bulan: number;
  tahun: number;
  nominalTagihan: number;
  status: KeuanganStatus;
  tanggalLunas: Date | null;
}

export interface KeuanganPrivatWithSantri extends KeuanganPrivatRecord {
  namaLengkap?: string;
  nomorInduk?: string | null;
  kontakOrtu?: string;
}

export interface KeuanganSummary {
  totalTagihan: number;
  totalLunas: number;
  totalBelumLunas: number;
  persentaseLunas: number;
}

export interface AbsensiPrivatRecord {
  id: string;
  idSantriPrivat: string | null;
  idGuru: string | null;
  waktuSesi: Date;
  statusKehadiran: AbsensiKehadiranStatus;
  capaianHafalan: string | null;
  createdAt: Date | null;
}

export interface AbsensiPrivatWithDetails extends AbsensiPrivatRecord {
  namaSantri?: string;
  nomorInduk?: string | null;
  namaGuru?: string;
}

export interface SimpanAbsensiPrivatInput {
  idSantriPrivat: string;
  idGuru?: string | null;
  waktuSesi: Date | string;
  statusKehadiran: AbsensiKehadiranStatus;
  capaianHafalan?: string | null;
}

// ==========================================
// 2. GEMINI.md Formatting & Localization
// ==========================================

export const TIMEZONE_WIB = 'Asia/Jakarta';

/**
 * Format Date to DD:MM:YYYY using colon separator (GEMINI.md strictly requires ':')
 */
export function formatPrivatDateColon(date: Date | string | number): string {
  if (!date) return '-';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE_WIB,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).formatToParts(d);

  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';

  return `${day}:${month}:${year}`;
}

/**
 * Format Time to 24-hour HH:mm in Asia/Jakarta timezone
 */
export function formatPrivatTime(date: Date | string | number): string {
  if (!date) return '-';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: TIMEZONE_WIB,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(d);
}

/**
 * Format Currency as Indonesian Rupiah with dot separator for thousands (GEMINI.md)
 */
export function formatRupiahDot(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  const rounded = Math.round(amount);
  return `Rp ${new Intl.NumberFormat('id-ID').format(rounded)}`;
}

/**
 * Parse currency formatted input into integer (strips Rp, dots, spaces)
 */
export function parseRupiahInput(input: string | number): number {
  if (typeof input === 'number') {
    return Math.max(0, Math.floor(input));
  }
  if (!input) return 0;
  const cleaned = input.replace(/[^0-9]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// ==========================================
// 3. Test Fixture & Cleanup Registry
// ==========================================

export class TestRegistry {
  private static createdSantriIds: Set<string> = new Set();
  private static createdKeuanganIds: Set<string> = new Set();
  private static createdAbsensiIds: Set<string> = new Set();

  public static trackSantri(id: string) {
    this.createdSantriIds.add(id);
  }

  public static trackKeuangan(id: string) {
    this.createdKeuanganIds.add(id);
  }

  public static trackAbsensi(id: string) {
    this.createdAbsensiIds.add(id);
  }

  public static async initDatabaseSchema() {
    try {
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS santri_privat (
          id text PRIMARY KEY NOT NULL,
          nama_lengkap text NOT NULL,
          nomor_induk text,
          kontak_ortu text NOT NULL,
          status_santri text DEFAULT 'aktif' NOT NULL,
          nominal_tagihan_bulanan integer DEFAULT 0 NOT NULL,
          created_at integer
        );
      `);
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS absensi_privat (
          id text PRIMARY KEY NOT NULL,
          id_santri_privat text,
          id_guru text,
          waktu_sesi integer NOT NULL,
          status_kehadiran text NOT NULL,
          capaian_hafalan text,
          created_at integer
        );
      `);
      await db.run(sql`
        CREATE TABLE IF NOT EXISTS keuangan_privat (
          id text PRIMARY KEY NOT NULL,
          id_santri_privat text,
          bulan integer NOT NULL,
          tahun integer NOT NULL,
          nominal_tagihan integer NOT NULL,
          status text DEFAULT 'belum_lunas' NOT NULL,
          tanggal_lunas integer
        );
      `);
    } catch {
      // Table might already exist or DDL handled by external database
    }
  }

  public static async cleanupAll() {
    try {
      // 1. Delete created absensi
      for (const id of this.createdAbsensiIds) {
        await db.delete(absensiPrivat).where(eq(absensiPrivat.id, id)).catch(() => {});
      }
      this.createdAbsensiIds.clear();

      // 2. Delete created keuangan
      for (const id of this.createdKeuanganIds) {
        await db.delete(keuanganPrivat).where(eq(keuanganPrivat.id, id)).catch(() => {});
      }
      this.createdKeuanganIds.clear();

      // 3. Delete created santri
      for (const id of this.createdSantriIds) {
        // Also ensure any cascaded or remaining foreign keys are cleared
        await db.delete(absensiPrivat).where(eq(absensiPrivat.idSantriPrivat, id)).catch(() => {});
        await db.delete(keuanganPrivat).where(eq(keuanganPrivat.idSantriPrivat, id)).catch(() => {});
        await db.delete(santriPrivat).where(eq(santriPrivat.id, id)).catch(() => {});
      }
      this.createdSantriIds.clear();
    } catch {
      // Ignore cleanup error during test tear-down
    }
  }
}

// ==========================================
// 4. Contract Implementation & Service Bridge
// ==========================================

export const PrivatContract = {
  // --- Feature 1: CRUD Santri Privat ---
  async getSantriPrivatList(): Promise<SantriPrivatRecord[]> {
    const rows = await db.select().from(santriPrivat);
    return rows.map((r) => ({
      id: r.id,
      namaLengkap: r.namaLengkap,
      nomorInduk: r.nomorInduk,
      kontakOrtu: r.kontakOrtu,
      statusSantri: r.statusSantri as SantriPrivatStatus,
      nominalTagihanBulanan: r.nominalTagihanBulanan,
      createdAt: r.createdAt
    }));
  },

  async createSantriPrivat(data: CreateSantriPrivatInput): Promise<{ success: boolean; id?: string; error?: string }> {
    // Validation: namaLengkap and kontakOrtu are required
    if (!data.namaLengkap || data.namaLengkap.trim().length === 0) {
      return { success: false, error: 'Nama lengkap wajib diisi' };
    }
    if (!data.kontakOrtu || data.kontakOrtu.trim().length === 0) {
      return { success: false, error: 'Kontak orang tua wajib diisi' };
    }
    if (data.nominalTagihanBulanan < 0) {
      return { success: false, error: 'Nominal tagihan bulanan tidak boleh bernilai negatif' };
    }
    if (data.statusSantri !== 'aktif' && data.statusSantri !== 'nonaktif') {
      return { success: false, error: 'Status santri harus aktif atau nonaktif' };
    }

    const id = `privat_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date();

    await db.insert(santriPrivat).values({
      id,
      namaLengkap: data.namaLengkap.trim(),
      nomorInduk: data.nomorInduk && data.nomorInduk.trim().length > 0 ? data.nomorInduk.trim() : null,
      kontakOrtu: data.kontakOrtu.trim(),
      statusSantri: data.statusSantri,
      nominalTagihanBulanan: Math.floor(data.nominalTagihanBulanan),
      createdAt: now
    });

    TestRegistry.trackSantri(id);
    return { success: true, id };
  },

  async updateSantriPrivat(id: string, data: UpdateSantriPrivatInput): Promise<{ success: boolean; error?: string }> {
    const existing = await db.select().from(santriPrivat).where(eq(santriPrivat.id, id)).limit(1);
    if (existing.length === 0) {
      return { success: false, error: 'Santri privat tidak ditemukan' };
    }

    if (data.namaLengkap !== undefined && data.namaLengkap.trim().length === 0) {
      return { success: false, error: 'Nama lengkap tidak boleh kosong' };
    }
    if (data.kontakOrtu !== undefined && data.kontakOrtu.trim().length === 0) {
      return { success: false, error: 'Kontak orang tua tidak boleh kosong' };
    }
    if (data.nominalTagihanBulanan !== undefined && data.nominalTagihanBulanan < 0) {
      return { success: false, error: 'Nominal tagihan tidak boleh bernilai negatif' };
    }
    if (data.statusSantri !== undefined && data.statusSantri !== 'aktif' && data.statusSantri !== 'nonaktif') {
      return { success: false, error: 'Status santri tidak valid' };
    }

    const updatePayload: {
      namaLengkap?: string;
      nomorInduk?: string | null;
      kontakOrtu?: string;
      nominalTagihanBulanan?: number;
      statusSantri?: string;
    } = {};

    if (data.namaLengkap !== undefined) updatePayload.namaLengkap = data.namaLengkap.trim();
    if (data.nomorInduk !== undefined) updatePayload.nomorInduk = data.nomorInduk && data.nomorInduk.trim().length > 0 ? data.nomorInduk.trim() : null;
    if (data.kontakOrtu !== undefined) updatePayload.kontakOrtu = data.kontakOrtu.trim();
    if (data.nominalTagihanBulanan !== undefined) updatePayload.nominalTagihanBulanan = Math.floor(data.nominalTagihanBulanan);
    if (data.statusSantri !== undefined) updatePayload.statusSantri = data.statusSantri;

    await db.update(santriPrivat).set(updatePayload).where(eq(santriPrivat.id, id));
    return { success: true };
  },

  async deleteSantriPrivat(id: string): Promise<{ success: boolean; error?: string }> {
    const existing = await db.select().from(santriPrivat).where(eq(santriPrivat.id, id)).limit(1);
    if (existing.length === 0) {
      return { success: false, error: 'Santri privat tidak ditemukan' };
    }

    // Delete associated records first for clean referential integrity
    await db.delete(absensiPrivat).where(eq(absensiPrivat.idSantriPrivat, id));
    await db.delete(keuanganPrivat).where(eq(keuanganPrivat.idSantriPrivat, id));
    await db.delete(santriPrivat).where(eq(santriPrivat.id, id));

    return { success: true };
  },

  // --- Feature 2: Flat-Rate Monthly Billing Generator ---
  async generateTagihanBulananPrivat(bulan: number, tahun: number): Promise<{ success: boolean; generated: number; skipped: number; message?: string }> {
    if (bulan < 1 || bulan > 12) {
      return { success: false, generated: 0, skipped: 0, message: 'Bulan harus bernilai antara 1 sampai 12' };
    }
    if (tahun < 2000 || tahun > 2100) {
      return { success: false, generated: 0, skipped: 0, message: 'Tahun tidak valid' };
    }

    // Only active students receive new monthly bills
    const activeStudents = await db.select().from(santriPrivat).where(eq(santriPrivat.statusSantri, 'aktif'));

    if (activeStudents.length === 0) {
      return { success: true, generated: 0, skipped: 0, message: 'Tidak ada santri privat aktif' };
    }

    let generatedCount = 0;
    let skippedCount = 0;

    for (const student of activeStudents) {
      // Check duplicate prevention: already billed for this month/year?
      const existingBill = await db
        .select()
        .from(keuanganPrivat)
        .where(
          and(
            eq(keuanganPrivat.idSantriPrivat, student.id),
            eq(keuanganPrivat.bulan, bulan),
            eq(keuanganPrivat.tahun, tahun)
          )
        )
        .limit(1);

      if (existingBill.length > 0) {
        skippedCount++;
        continue;
      }

      const billId = `bill_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
      await db.insert(keuanganPrivat).values({
        id: billId,
        idSantriPrivat: student.id,
        bulan,
        tahun,
        nominalTagihan: student.nominalTagihanBulanan,
        status: 'belum_lunas',
        tanggalLunas: null
      });

      TestRegistry.trackKeuangan(billId);
      generatedCount++;
    }

    return {
      success: true,
      generated: generatedCount,
      skipped: skippedCount,
      message: `Berhasil generate ${generatedCount} tagihan, ${skippedCount} dilewati.`
    };
  },

  async getKeuanganPrivatList(
    bulan?: number,
    tahun?: number,
    status?: string
  ): Promise<{ data: KeuanganPrivatWithSantri[]; summary: KeuanganSummary }> {
    const allBills = await db.select().from(keuanganPrivat);
    const allStudents = await db.select().from(santriPrivat);
    const studentMap = new Map<string, (typeof allStudents)[0]>(allStudents.map((s) => [s.id, s]));

    let filtered = allBills;
    if (bulan !== undefined) {
      filtered = filtered.filter((b) => b.bulan === bulan);
    }
    if (tahun !== undefined) {
      filtered = filtered.filter((b) => b.tahun === tahun);
    }
    if (status && status !== 'semua') {
      filtered = filtered.filter((b) => b.status === status);
    }

    const data: KeuanganPrivatWithSantri[] = filtered.map((b) => {
      const s = b.idSantriPrivat ? studentMap.get(b.idSantriPrivat) : undefined;
      return {
        id: b.id,
        idSantriPrivat: b.idSantriPrivat,
        bulan: b.bulan,
        tahun: b.tahun,
        nominalTagihan: b.nominalTagihan,
        status: b.status as KeuanganStatus,
        tanggalLunas: b.tanggalLunas,
        namaLengkap: s?.namaLengkap,
        nomorInduk: s?.nomorInduk,
        kontakOrtu: s?.kontakOrtu
      };
    });

    const totalTagihan = data.reduce((acc, curr) => acc + curr.nominalTagihan, 0);
    const totalLunas = data.filter((d) => d.status === 'lunas').reduce((acc, curr) => acc + curr.nominalTagihan, 0);
    const totalBelumLunas = totalTagihan - totalLunas;
    const persentaseLunas = totalTagihan > 0 ? Math.round((totalLunas / totalTagihan) * 100) : 0;

    return {
      data,
      summary: {
        totalTagihan,
        totalLunas,
        totalBelumLunas,
        persentaseLunas
      }
    };
  },

  // --- Feature 3: Payment Recording & History ---
  async catatPembayaranPrivat(idKeuanganPrivat: string, tanggalLunas?: Date): Promise<{ success: boolean; error?: string }> {
    const existing = await db.select().from(keuanganPrivat).where(eq(keuanganPrivat.id, idKeuanganPrivat)).limit(1);
    if (existing.length === 0) {
      return { success: false, error: 'Tagihan tidak ditemukan' };
    }

    const paymentDate = tanggalLunas ?? new Date();

    await db
      .update(keuanganPrivat)
      .set({
        status: 'lunas',
        tanggalLunas: paymentDate
      })
      .where(eq(keuanganPrivat.id, idKeuanganPrivat));

    return { success: true };
  },

  async batalkanPembayaranPrivat(idKeuanganPrivat: string): Promise<{ success: boolean; error?: string }> {
    const existing = await db.select().from(keuanganPrivat).where(eq(keuanganPrivat.id, idKeuanganPrivat)).limit(1);
    if (existing.length === 0) {
      return { success: false, error: 'Tagihan tidak ditemukan' };
    }

    await db
      .update(keuanganPrivat)
      .set({
        status: 'belum_lunas',
        tanggalLunas: null
      })
      .where(eq(keuanganPrivat.id, idKeuanganPrivat));

    return { success: true };
  },

  // --- Feature 4: Attendance & Memorization Progress Logging ---
  async simpanAbsensiPrivat(data: SimpanAbsensiPrivatInput): Promise<{ success: boolean; error?: string }> {
    if (!data.idSantriPrivat) {
      return { success: false, error: 'ID Santri privat wajib dipilih' };
    }

    const studentExists = await db.select().from(santriPrivat).where(eq(santriPrivat.id, data.idSantriPrivat)).limit(1);
    if (studentExists.length === 0) {
      return { success: false, error: 'Santri privat tidak ditemukan di database' };
    }

    if (!['hadir', 'izin', 'alpa'].includes(data.statusKehadiran)) {
      return { success: false, error: 'Status kehadiran harus berupa hadir, izin, atau alpa' };
    }

    const waktu = typeof data.waktuSesi === 'string' ? new Date(data.waktuSesi) : data.waktuSesi;
    if (isNaN(waktu.getTime())) {
      return { success: false, error: 'Waktu sesi tidak valid' };
    }

    const id = `absen_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const now = new Date();

    await db.insert(absensiPrivat).values({
      id,
      idSantriPrivat: data.idSantriPrivat,
      idGuru: data.idGuru ?? null,
      waktuSesi: waktu,
      statusKehadiran: data.statusKehadiran,
      capaianHafalan: data.capaianHafalan && data.capaianHafalan.trim().length > 0 ? data.capaianHafalan.trim() : null,
      createdAt: now
    });

    TestRegistry.trackAbsensi(id);
    return { success: true };
  },

  async getRiwayatAbsensiPrivat(filters?: {
    idSantriPrivat?: string;
    idGuru?: string;
    limit?: number;
  }): Promise<AbsensiPrivatWithDetails[]> {
    let rows = await db.select().from(absensiPrivat);
    if (filters?.idSantriPrivat) {
      rows = rows.filter((r) => r.idSantriPrivat === filters.idSantriPrivat);
    }
    if (filters?.idGuru) {
      rows = rows.filter((r) => r.idGuru === filters.idGuru);
    }

    // Sort by waktuSesi descending
    rows.sort((a, b) => b.waktuSesi.getTime() - a.waktuSesi.getTime());

    if (filters?.limit) {
      rows = rows.slice(0, filters.limit);
    }

    const allStudents = await db.select().from(santriPrivat);
    const studentMap = new Map(allStudents.map((s) => [s.id, s]));

    return rows.map((r) => {
      const s = r.idSantriPrivat ? studentMap.get(r.idSantriPrivat) : undefined;
      return {
        id: r.id,
        idSantriPrivat: r.idSantriPrivat,
        idGuru: r.idGuru,
        waktuSesi: r.waktuSesi,
        statusKehadiran: r.statusKehadiran as AbsensiKehadiranStatus,
        capaianHafalan: r.capaianHafalan,
        createdAt: r.createdAt,
        namaSantri: s?.namaLengkap,
        nomorInduk: s?.nomorInduk
      };
    });
  },

  async hapusAbsensiPrivat(id: string): Promise<{ success: boolean; error?: string }> {
    const existing = await db.select().from(absensiPrivat).where(eq(absensiPrivat.id, id)).limit(1);
    if (existing.length === 0) {
      return { success: false, error: 'Data absensi tidak ditemukan' };
    }

    await db.delete(absensiPrivat).where(eq(absensiPrivat.id, id));
    return { success: true };
  }
};

import 'dotenv/config';
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '@/db';
import { santriPrivat, absensiPrivat, keuanganPrivat } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  getSantriPrivatList,
  getSantriPrivatById,
  createSantriPrivat,
  updateSantriPrivat,
  deleteSantriPrivat,
} from '@/app/admin/santri-privat/actions';

describe('Milestone 1 Challenger 2: Adversarial & Boundary Stress Tests', () => {
  const trackedSantriIds: string[] = [];
  const trackedAbsensiIds: string[] = [];
  const trackedKeuanganIds: string[] = [];

  before(async () => {
    // Initial cleanup of any stale test records
  });

  after(async () => {
    // Teardown tracked test records
    for (const id of trackedAbsensiIds) {
      await db.delete(absensiPrivat).where(eq(absensiPrivat.id, id)).catch(() => {});
    }
    for (const id of trackedKeuanganIds) {
      await db.delete(keuanganPrivat).where(eq(keuanganPrivat.id, id)).catch(() => {});
    }
    for (const id of trackedSantriIds) {
      await db.delete(santriPrivat).where(eq(santriPrivat.id, id)).catch(() => {});
    }
  });

  // ---------------------------------------------------------------------------
  // 1. Status Toggling (aktif <-> nonaktif) & State Transitions
  // ---------------------------------------------------------------------------
  describe('Status Toggling & State Transitions', () => {
    test('ST1: Successfully toggles santri status from aktif to nonaktif and back to aktif', async () => {
      const createRes = await createSantriPrivat({
        namaLengkap: 'Santri Toggle Test',
        kontakOrtu: '081234567890',
        nominalTagihanBulanan: 250000,
        statusSantri: 'aktif',
      });

      console.log('CREATE RES RESULT:', createRes);
      assert.equal(createRes.success, true);
      assert.ok(createRes.id);
      trackedSantriIds.push(createRes.id);

      // Verify initial state
      let current = await getSantriPrivatById(createRes.id);
      assert.equal(current?.statusSantri, 'aktif');

      // Toggle to nonaktif
      const toggleToNonaktif = await updateSantriPrivat(createRes.id, {
        statusSantri: 'nonaktif',
      });
      assert.equal(toggleToNonaktif.success, true);

      current = await getSantriPrivatById(createRes.id);
      assert.equal(current?.statusSantri, 'nonaktif');

      // Toggle back to aktif
      const toggleBackToAktif = await updateSantriPrivat(createRes.id, {
        statusSantri: 'aktif',
      });
      assert.equal(toggleBackToAktif.success, true);

      current = await getSantriPrivatById(createRes.id);
      assert.equal(current?.statusSantri, 'aktif');
    });

    test('ST2: Rejects invalid status transitions at schema parse time', async () => {
      const createRes = await createSantriPrivat({
        namaLengkap: 'Santri Invalid Status Target',
        kontakOrtu: '081234567891',
        nominalTagihanBulanan: 150000,
        statusSantri: 'aktif',
      });
      assert.ok(createRes.id);
      trackedSantriIds.push(createRes.id);

      // Cast invalid status string to test validation barrier
      const resInvalid = await updateSantriPrivat(createRes.id, {
        statusSantri: 'alumni' as unknown as 'aktif',
      });
      assert.equal(resInvalid.success, false);
      assert.ok(resInvalid.error);

      // State must remain unchanged
      const current = await getSantriPrivatById(createRes.id);
      assert.equal(current?.statusSantri, 'aktif');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Optional NIS Normalization (Empty String vs Spaces vs Null vs Undefined)
  // ---------------------------------------------------------------------------
  describe('Optional NIS Normalization', () => {
    test('NIS1: Empty string and whitespace-only NIS normalize to null in DB', async () => {
      const resEmpty = await createSantriPrivat({
        namaLengkap: 'Santri Empty NIS String',
        nomorInduk: '',
        kontakOrtu: '081299990001',
        nominalTagihanBulanan: 200000,
        statusSantri: 'aktif',
      });
      assert.equal(resEmpty.success, true);
      assert.ok(resEmpty.id);
      trackedSantriIds.push(resEmpty.id);

      const dbRecord1 = await getSantriPrivatById(resEmpty.id);
      assert.equal(dbRecord1?.nomorInduk, null, 'Empty string must be transformed to null');

      const resSpaces = await createSantriPrivat({
        namaLengkap: 'Santri Whitespace NIS',
        nomorInduk: '     ',
        kontakOrtu: '081299990002',
        nominalTagihanBulanan: 200000,
        statusSantri: 'aktif',
      });
      assert.equal(resSpaces.success, true);
      assert.ok(resSpaces.id);
      trackedSantriIds.push(resSpaces.id);

      const dbRecord2 = await getSantriPrivatById(resSpaces.id);
      assert.equal(dbRecord2?.nomorInduk, null, 'Whitespace-only NIS must be transformed to null');
    });

    test('NIS2: Null and undefined NIS cleanly persist as null', async () => {
      const resNull = await createSantriPrivat({
        namaLengkap: 'Santri Null NIS',
        nomorInduk: null,
        kontakOrtu: '081299990003',
        nominalTagihanBulanan: 200000,
        statusSantri: 'aktif',
      });
      assert.equal(resNull.success, true);
      assert.ok(resNull.id);
      trackedSantriIds.push(resNull.id);

      const dbRecordNull = await getSantriPrivatById(resNull.id);
      assert.equal(dbRecordNull?.nomorInduk, null);

      const resUndefined = await createSantriPrivat({
        namaLengkap: 'Santri Undefined NIS',
        kontakOrtu: '081299990004',
        nominalTagihanBulanan: 200000,
        statusSantri: 'aktif',
      });
      assert.equal(resUndefined.success, true);
      assert.ok(resUndefined.id);
      trackedSantriIds.push(resUndefined.id);

      const dbRecordUndef = await getSantriPrivatById(resUndefined.id);
      assert.equal(dbRecordUndef?.nomorInduk, null);
    });

    test('NIS3: Valid NIS preserves formatted string, update to empty resets to null', async () => {
      const resValid = await createSantriPrivat({
        namaLengkap: 'Santri With NIS',
        nomorInduk: 'NIS-PRV-999',
        kontakOrtu: '081299990005',
        nominalTagihanBulanan: 200000,
        statusSantri: 'aktif',
      });
      assert.equal(resValid.success, true);
      assert.ok(resValid.id);
      trackedSantriIds.push(resValid.id);

      let record = await getSantriPrivatById(resValid.id);
      assert.equal(record?.nomorInduk, 'NIS-PRV-999');

      // Update to empty string resets it to null
      const updateRes = await updateSantriPrivat(resValid.id, { nomorInduk: '   ' });
      assert.equal(updateRes.success, true);

      record = await getSantriPrivatById(resValid.id);
      assert.equal(record?.nomorInduk, null, 'Updating NIS to spaces must reset to null');
    });

    test('NIS4: Oversized NIS (> 50 chars) rejected by validator', async () => {
      const oversizedNIS = 'A'.repeat(51);
      const res = await createSantriPrivat({
        namaLengkap: 'Santri Oversized NIS',
        nomorInduk: oversizedNIS,
        kontakOrtu: '081299990006',
        nominalTagihanBulanan: 200000,
        statusSantri: 'aktif',
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('maksimal 50 karakter'));
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Referential Integrity Protection on Deletion
  // ---------------------------------------------------------------------------
  describe('Referential Integrity Protection on Deletion', () => {
    test('RI1: Deleting santri with linked absensi_privat is BLOCKED with human-readable error', async () => {
      const student = await createSantriPrivat({
        namaLengkap: 'Santri Linked Absensi',
        kontakOrtu: '081112223331',
        nominalTagihanBulanan: 300000,
        statusSantri: 'aktif',
      });
      assert.ok(student.id);
      trackedSantriIds.push(student.id);

      // Create linked attendance record
      const absensiId = uuidv4();
      await db.insert(absensiPrivat).values({
        id: absensiId,
        idSantriPrivat: student.id,
        waktuSesi: new Date(),
        statusKehadiran: 'hadir',
        capaianHafalan: 'Surah An-Naba 1-10',
        createdAt: new Date(),
      });
      trackedAbsensiIds.push(absensiId);

      // Attempt to delete santri
      const deleteRes = await deleteSantriPrivat(student.id);
      assert.equal(deleteRes.success, false, 'Delete must fail due to foreign relation');
      assert.ok(
        deleteRes.error?.includes('absensi') || deleteRes.error?.includes('riwayat'),
        'Error must state attendance history constraint'
      );

      // Confirm santri record still safely exists in database
      const verifyStillExists = await getSantriPrivatById(student.id);
      assert.ok(verifyStillExists, 'Santri must not be deleted when foreign relations exist');
    });

    test('RI2: Deleting santri with linked keuangan_privat is BLOCKED with human-readable error', async () => {
      const student = await createSantriPrivat({
        namaLengkap: 'Santri Linked Billing',
        kontakOrtu: '081112223332',
        nominalTagihanBulanan: 350000,
        statusSantri: 'aktif',
      });
      assert.ok(student.id);
      trackedSantriIds.push(student.id);

      // Create linked financial billing record
      const billId = uuidv4();
      await db.insert(keuanganPrivat).values({
        id: billId,
        idSantriPrivat: student.id,
        bulan: 10,
        tahun: 2026,
        nominalTagihan: 350000,
        status: 'belum_lunas',
      });
      trackedKeuanganIds.push(billId);

      // Attempt to delete santri
      const deleteRes = await deleteSantriPrivat(student.id);
      assert.equal(deleteRes.success, false, 'Delete must fail due to billing foreign relation');
      assert.ok(
        deleteRes.error?.includes('tagihan') || deleteRes.error?.includes('keuangan'),
        'Error must state financial billing history constraint'
      );

      // Confirm santri record still safely exists in database
      const verifyStillExists = await getSantriPrivatById(student.id);
      assert.ok(verifyStillExists, 'Santri must not be deleted when billing records exist');
    });

    test('RI3: Deleting santri with NO linked records SUCCEEDS cleanly', async () => {
      const student = await createSantriPrivat({
        namaLengkap: 'Santri Standalone Deletable',
        kontakOrtu: '081112223333',
        nominalTagihanBulanan: 400000,
        statusSantri: 'aktif',
      });
      assert.ok(student.id);

      // Delete should succeed immediately
      const deleteRes = await deleteSantriPrivat(student.id);
      assert.equal(deleteRes.success, true);

      // Confirm record is gone
      const verifyGone = await getSantriPrivatById(student.id);
      assert.equal(verifyGone, null);
    });

    test('RI4: Deleting non-existent santri ID returns appropriate error without throwing', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const deleteRes = await deleteSantriPrivat(nonExistentId);
      assert.equal(deleteRes.success, false);
      assert.ok(deleteRes.error?.includes('tidak ditemukan'));
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Input Sanitization & Value Preprocessing
  // ---------------------------------------------------------------------------
  describe('Input Sanitization & Preprocessing', () => {
    test('IS1: String formatted currency input (e.g. "Rp 450.000") preprocessed cleanly to integer', async () => {
      const res = await createSantriPrivat({
        namaLengkap: 'Santri Formatted Tuition',
        kontakOrtu: '081255556666',
        nominalTagihanBulanan: 'Rp 450.000' as unknown as number,
        statusSantri: 'aktif',
      });

      assert.equal(res.success, true);
      assert.ok(res.id);
      trackedSantriIds.push(res.id);

      const record = await getSantriPrivatById(res.id);
      assert.equal(record?.nominalTagihanBulanan, 450000);
    });

    test('IS2: Negative nominal is rejected with descriptive error', async () => {
      const res = await createSantriPrivat({
        namaLengkap: 'Santri Negative Input',
        kontakOrtu: '081255557777',
        nominalTagihanBulanan: -1000,
        statusSantri: 'aktif',
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('negatif'));
    });

    test('IS3: Whitespace-only student name rejected', async () => {
      const res = await createSantriPrivat({
        namaLengkap: '    \t   ',
        kontakOrtu: '081255558888',
        nominalTagihanBulanan: 100000,
        statusSantri: 'aktif',
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('wajib diisi'));
    });

    test('IS4: Oversized contact number (> 30 chars) rejected', async () => {
      const res = await createSantriPrivat({
        namaLengkap: 'Santri Long Phone',
        kontakOrtu: '+6281234567890123456789012345678901',
        nominalTagihanBulanan: 100000,
        statusSantri: 'aktif',
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('maksimal 30 karakter'));
    });
  });
});

/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Minimum 5 test cases per feature boundary:
 *  - Boundary 1: Nominal & Financial Edge Cases (5 tests)
 *  - Boundary 2: Student Identification & Contact Boundaries (5 tests)
 *  - Boundary 3: Monthly Billing Generation & Date Boundaries (5 tests)
 *  - Boundary 4: Attendance & Progress Text Boundaries (5 tests)
 * Total: 20 Test Cases
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  PrivatContract,
  TestRegistry,
  parseRupiahInput,
  formatRupiahDot
} from './harness';

describe('Tier 2: Boundary & Corner Cases', () => {
  before(async () => {
    await TestRegistry.initDatabaseSchema();
    await TestRegistry.cleanupAll();
  });

  after(async () => {
    await TestRegistry.cleanupAll();
  });

  // =========================================================================
  // Boundary 1: Nominal & Financial Edge Cases
  // =========================================================================
  describe('Boundary 1: Nominal & Financial Edge Cases', () => {
    test('TC2.1: Rejection of negative nominal tuition in registration', async () => {
      const res = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Santri Negative Fee',
        kontakOrtu: '081200000001',
        nominalTagihanBulanan: -50000,
        statusSantri: 'aktif'
      });

      assert.equal(res.success, false, 'Should reject negative nominal tuition');
      assert.ok(res.error?.includes('negatif'), 'Error message should mention negative value');
    });

    test('TC2.2: Rejection of negative nominal tuition in update', async () => {
      const created = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Santri Valid Fee',
        kontakOrtu: '081200000002',
        nominalTagihanBulanan: 200000,
        statusSantri: 'aktif'
      });
      assert.ok(created.id);

      const updateRes = await PrivatContract.updateSantriPrivat(created.id, {
        nominalTagihanBulanan: -100000
      });
      assert.equal(updateRes.success, false);
      assert.ok(updateRes.error?.includes('negatif'));
    });

    test('TC2.3: Zero nominal fee handled cleanly (e.g. beasiswa / scholarship)', async () => {
      const res = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Santri Beasiswa Tahfiz',
        kontakOrtu: '081200000003',
        nominalTagihanBulanan: 0,
        statusSantri: 'aktif'
      });

      assert.equal(res.success, true);
      assert.ok(res.id);

      const list = await PrivatContract.getSantriPrivatList();
      const student = list.find((s) => s.id === res.id);
      assert.equal(student?.nominalTagihanBulanan, 0);
      assert.equal(formatRupiahDot(student?.nominalTagihanBulanan ?? 0), 'Rp 0');
    });

    test('TC2.4: Decimal/float nominal tuition handled as floored integer IDR', async () => {
      const res = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Santri Decimal Fee',
        kontakOrtu: '081200000004',
        nominalTagihanBulanan: 250000.75,
        statusSantri: 'aktif'
      });

      assert.equal(res.success, true);
      const list = await PrivatContract.getSantriPrivatList();
      const student = list.find((s) => s.id === res.id);
      assert.equal(student?.nominalTagihanBulanan, 250000, 'Must store as integer without decimals');
    });

    test('TC2.5: Large integer nominal values (e.g. Rp 100.000.000) and parseRupiahInput checks', async () => {
      const largeAmount = 100000000;
      const res = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Santri Corporate Sponsor',
        kontakOrtu: '081200000005',
        nominalTagihanBulanan: largeAmount,
        statusSantri: 'aktif'
      });

      assert.equal(res.success, true);
      const list = await PrivatContract.getSantriPrivatList();
      const student = list.find((s) => s.id === res.id);
      assert.equal(student?.nominalTagihanBulanan, 100000000);

      // Verify formatting and parsing
      const formatted = formatRupiahDot(student?.nominalTagihanBulanan ?? 0);
      assert.ok(formatted.includes('100.000.000'));
      assert.equal(parseRupiahInput(formatted), 100000000);
      assert.equal(parseRupiahInput('Rp 2.500.000'), 2500000);
      assert.equal(parseRupiahInput(''), 0);
    });
  });

  // =========================================================================
  // Boundary 2: Student Identification & Contact Boundaries
  // =========================================================================
  describe('Boundary 2: Student Identification & Contact Boundaries', () => {
    test('TC2.6: Optional NIS handling (empty string vs null vs undefined stored as null)', async () => {
      // Empty string NIS
      const resEmpty = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Santri Empty NIS',
        nomorInduk: '   ',
        kontakOrtu: '081200000006',
        nominalTagihanBulanan: 200000,
        statusSantri: 'aktif'
      });
      assert.equal(resEmpty.success, true);

      const list = await PrivatContract.getSantriPrivatList();
      const student = list.find((s) => s.id === resEmpty.id);
      assert.equal(student?.nomorInduk, null, 'Empty string or spaces NIS must normalize to null');
    });

    test('TC2.7: Whitespace-only student name rejected', async () => {
      const res = await PrivatContract.createSantriPrivat({
        namaLengkap: '    ',
        kontakOrtu: '081200000007',
        nominalTagihanBulanan: 200000,
        statusSantri: 'aktif'
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('Nama lengkap'));
    });

    test('TC2.8: Empty or whitespace-only parent contact rejected', async () => {
      const res = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Santri No Contact',
        kontakOrtu: '   ',
        nominalTagihanBulanan: 200000,
        statusSantri: 'aktif'
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('Kontak'));
    });

    test('TC2.9: Contact number formatting and Indonesian mobile formats supported', async () => {
      const variations = [
        '+62 812-3456-7890',
        '0821-1234-5678',
        '6281311112222'
      ];

      for (const contact of variations) {
        const res = await PrivatContract.createSantriPrivat({
          namaLengkap: `Santri Contact ${contact}`,
          kontakOrtu: contact,
          nominalTagihanBulanan: 250000,
          statusSantri: 'aktif'
        });
        assert.equal(res.success, true);
      }
    });

    test('TC2.10: Extremely long student names and Unicode / Arabic script handling', async () => {
      const longArabicName = 'Muhammad Abdullah Al-Muqaddasi Al-Andalusi بن عبد الرحمن (مُحَمَّد عَبْد الرَّحْمَن)';
      const res = await PrivatContract.createSantriPrivat({
        namaLengkap: longArabicName,
        kontakOrtu: '081299991111',
        nominalTagihanBulanan: 300000,
        statusSantri: 'aktif'
      });

      assert.equal(res.success, true);
      const list = await PrivatContract.getSantriPrivatList();
      const student = list.find((s) => s.id === res.id);
      assert.equal(student?.namaLengkap, longArabicName);
    });
  });

  // =========================================================================
  // Boundary 3: Monthly Billing Generation & Date Boundaries
  // =========================================================================
  describe('Boundary 3: Monthly Billing Generation & Date Boundaries', () => {
    let studentId: string;

    before(async () => {
      const s = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Santri Boundary Billing',
        nomorInduk: 'BND-BILL-01',
        kontakOrtu: '081399990000',
        nominalTagihanBulanan: 320000,
        statusSantri: 'aktif'
      });
      studentId = s.id!;
    });

    test('TC2.11: Duplicate billing prevention: second generation for same month/year skips existing students', async () => {
      const month = 12;
      const year = 2026;

      // First run generates
      const run1 = await PrivatContract.generateTagihanBulananPrivat(month, year);
      assert.equal(run1.success, true);
      assert.ok(run1.generated >= 1);

      // Second run must skip
      const run2 = await PrivatContract.generateTagihanBulananPrivat(month, year);
      assert.equal(run2.success, true);
      assert.equal(run2.generated, 0, 'Second run must generate 0 new bills');
      assert.ok(run2.skipped >= 1, 'Second run must skip already billed students');

      // Verify no duplicate records in database
      const { data } = await PrivatContract.getKeuanganPrivatList(month, year);
      const studentBills = data.filter((b) => b.idSantriPrivat === studentId);
      assert.equal(studentBills.length, 1, 'Only exactly 1 bill must exist for student in month 12/2026');
    });

    test('TC2.12: Month boundary validation: bulan < 1 rejected', async () => {
      const res = await PrivatContract.generateTagihanBulananPrivat(0, 2026);
      assert.equal(res.success, false);
      assert.equal(res.generated, 0);
      assert.ok(res.message?.includes('1 sampai 12'));
    });

    test('TC2.13: Month boundary validation: bulan > 12 rejected', async () => {
      const res = await PrivatContract.generateTagihanBulananPrivat(13, 2026);
      assert.equal(res.success, false);
      assert.equal(res.generated, 0);
      assert.ok(res.message?.includes('1 sampai 12'));
    });

    test('TC2.14: Year boundary validation: invalid years rejected', async () => {
      const resLow = await PrivatContract.generateTagihanBulananPrivat(5, 1999);
      assert.equal(resLow.success, false);
      assert.ok(resLow.message?.includes('Tahun tidak valid'));

      const resHigh = await PrivatContract.generateTagihanBulananPrivat(5, 2150);
      assert.equal(resHigh.success, false);
      assert.ok(resHigh.message?.includes('Tahun tidak valid'));
    });

    test('TC2.15: Partial billing generation: adding new student and generating adds only the new student', async () => {
      const month = 12;
      const year = 2026;

      // Add one new active student
      const newStudent = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Santri Late Joiner',
        kontakOrtu: '081277778888',
        nominalTagihanBulanan: 280000,
        statusSantri: 'aktif'
      });
      assert.ok(newStudent.id);

      // Run generation again for month 12/2026
      const run3 = await PrivatContract.generateTagihanBulananPrivat(month, year);
      assert.equal(run3.success, true);
      assert.equal(run3.generated, 1, 'Only late joiner should be generated');

      const { data } = await PrivatContract.getKeuanganPrivatList(month, year);
      const lateBill = data.find((b) => b.idSantriPrivat === newStudent.id);
      assert.ok(lateBill);
      assert.equal(lateBill.nominalTagihan, 280000);
    });
  });

  // =========================================================================
  // Boundary 4: Attendance & Progress Text Boundaries
  // =========================================================================
  describe('Boundary 4: Attendance & Progress Text Boundaries', () => {
    let studentId: string;

    before(async () => {
      const s = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Santri Attendance Boundary',
        kontakOrtu: '081233334444',
        nominalTagihanBulanan: 300000,
        statusSantri: 'aktif'
      });
      studentId = s.id!;
    });

    test('TC2.16: Invalid attendance status rejected (only hadir, izin, alpa allowed)', async () => {
      // Cast invalid status to test runtime validation
      const invalidInput = {
        idSantriPrivat: studentId,
        waktuSesi: new Date(),
        statusKehadiran: 'bolos' as unknown as 'hadir',
        capaianHafalan: 'Tidak ada keterangan'
      };

      const res = await PrivatContract.simpanAbsensiPrivat(invalidInput);
      assert.equal(res.success, false);
      assert.ok(res.error?.includes('hadir, izin, atau alpa'));
    });

    test('TC2.17: Extremely long capaianHafalan text (2000+ characters) handled cleanly', async () => {
      const longNote = 'Juz 29: Surah Al-Mulk ayat 1-30 dilanjutkan Surah Al-Qalam. '.repeat(40);
      assert.ok(longNote.length > 2000);

      const res = await PrivatContract.simpanAbsensiPrivat({
        idSantriPrivat: studentId,
        waktuSesi: new Date('2026-10-10T14:00:00Z'),
        statusKehadiran: 'hadir',
        capaianHafalan: longNote
      });

      assert.equal(res.success, true);
      const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
      const record = history.find((h) => h.waktuSesi.getTime() === new Date('2026-10-10T14:00:00Z').getTime());
      assert.ok(record);
      assert.equal(record.capaianHafalan?.length, longNote.trim().length);
    });

    test('TC2.18: Empty or whitespace-only capaianHafalan normalized to null', async () => {
      const res = await PrivatContract.simpanAbsensiPrivat({
        idSantriPrivat: studentId,
        waktuSesi: new Date('2026-10-11T14:00:00Z'),
        statusKehadiran: 'izin',
        capaianHafalan: '    '
      });

      assert.equal(res.success, true);
      const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
      const record = history.find((h) => h.waktuSesi.getTime() === new Date('2026-10-11T14:00:00Z').getTime());
      assert.ok(record);
      assert.equal(record.capaianHafalan, null);
    });

    test('TC2.19: Invalid session timestamp boundary rejected', async () => {
      const res = await PrivatContract.simpanAbsensiPrivat({
        idSantriPrivat: studentId,
        waktuSesi: 'invalid-date-string',
        statusKehadiran: 'hadir',
        capaianHafalan: 'Test Invalid Date'
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('Waktu sesi tidak valid'));
    });

    test('TC2.20: Logging attendance for non-existent student ID rejected', async () => {
      const res = await PrivatContract.simpanAbsensiPrivat({
        idSantriPrivat: 'non-existent-student-uuid',
        waktuSesi: new Date(),
        statusKehadiran: 'hadir',
        capaianHafalan: 'Ghost record'
      });

      assert.equal(res.success, false);
      assert.ok(res.error?.includes('tidak ditemukan'));
    });
  });
});

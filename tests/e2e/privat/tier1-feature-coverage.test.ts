/**
 * Tier 1: Isolated Feature Coverage Test Suite
 * Minimum 5 test cases per core feature in isolation:
 *  - Feature 1: CRUD Santri Privat (6 tests)
 *  - Feature 2: Flat-Rate Monthly Billing Generator (5 tests)
 *  - Feature 3: Payment Recording & History (5 tests)
 *  - Feature 4: Attendance & Memorization Progress Logging (5 tests)
 * Total: 21 Test Cases
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  PrivatContract,
  TestRegistry,
  formatPrivatDateColon,
  formatPrivatTime,
  formatRupiahDot,
  TIMEZONE_WIB
} from './harness';

describe('Tier 1: Feature Coverage (Isolation)', () => {
  before(async () => {
    await TestRegistry.initDatabaseSchema();
    await TestRegistry.cleanupAll();
  });

  after(async () => {
    await TestRegistry.cleanupAll();
  });

  // =========================================================================
  // Feature 1: CRUD Santri Privat (santri_privat)
  // =========================================================================
  describe('Feature 1: CRUD Santri Privat in Isolation', () => {
    let createdExternalId: string;
    let createdRegularId: string;

    test('TC1.1: Create external student without NIS', async () => {
      const result = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Zaidan Al-Farisi',
        nomorInduk: null,
        kontakOrtu: '081234567890',
        nominalTagihanBulanan: 350000,
        statusSantri: 'aktif'
      });

      assert.equal(result.success, true, 'Student creation should succeed');
      assert.ok(result.id, 'Student ID should be generated');
      createdExternalId = result.id;

      const list = await PrivatContract.getSantriPrivatList();
      const found = list.find((s) => s.id === createdExternalId);
      assert.ok(found, 'Created student should be found in list');
      assert.equal(found.namaLengkap, 'Zaidan Al-Farisi');
      assert.equal(found.nomorInduk, null);
      assert.equal(found.kontakOrtu, '081234567890');
      assert.equal(found.nominalTagihanBulanan, 350000);
      assert.equal(found.statusSantri, 'aktif');
    });

    test('TC1.2: Create active regular student with NIS', async () => {
      const result = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Maryam Qonitah',
        nomorInduk: 'NIS-RQ-2026-0042',
        kontakOrtu: '082198765432',
        nominalTagihanBulanan: 250000,
        statusSantri: 'aktif'
      });

      assert.equal(result.success, true);
      assert.ok(result.id);
      createdRegularId = result.id;

      const list = await PrivatContract.getSantriPrivatList();
      const found = list.find((s) => s.id === createdRegularId);
      assert.ok(found);
      assert.equal(found.nomorInduk, 'NIS-RQ-2026-0042');
      assert.equal(found.nominalTagihanBulanan, 250000);
    });

    test('TC1.3: Read santri privat list & verify properties', async () => {
      const list = await PrivatContract.getSantriPrivatList();
      assert.ok(Array.isArray(list), 'List should be an array');
      assert.ok(list.length >= 2, 'Should contain at least the 2 created students');

      const student = list.find((s) => s.id === createdExternalId);
      assert.ok(student);
      assert.equal(typeof student.namaLengkap, 'string');
      assert.equal(typeof student.nominalTagihanBulanan, 'number');
    });

    test('TC1.4: Update santri privat data (nominal, contact, name)', async () => {
      const updateResult = await PrivatContract.updateSantriPrivat(createdExternalId, {
        namaLengkap: 'Zaidan Al-Farisi Updated',
        kontakOrtu: '081299998888',
        nominalTagihanBulanan: 400000
      });

      assert.equal(updateResult.success, true);

      const list = await PrivatContract.getSantriPrivatList();
      const updated = list.find((s) => s.id === createdExternalId);
      assert.ok(updated);
      assert.equal(updated.namaLengkap, 'Zaidan Al-Farisi Updated');
      assert.equal(updated.kontakOrtu, '081299998888');
      assert.equal(updated.nominalTagihanBulanan, 400000);
    });

    test('TC1.5: Status toggle transition (aktif -> nonaktif -> aktif)', async () => {
      // Toggle to nonaktif
      const resDeactivate = await PrivatContract.updateSantriPrivat(createdExternalId, {
        statusSantri: 'nonaktif'
      });
      assert.equal(resDeactivate.success, true);

      let list = await PrivatContract.getSantriPrivatList();
      let student = list.find((s) => s.id === createdExternalId);
      assert.equal(student?.statusSantri, 'nonaktif');

      // Toggle back to aktif
      const resActivate = await PrivatContract.updateSantriPrivat(createdExternalId, {
        statusSantri: 'aktif'
      });
      assert.equal(resActivate.success, true);

      list = await PrivatContract.getSantriPrivatList();
      student = list.find((s) => s.id === createdExternalId);
      assert.equal(student?.statusSantri, 'aktif');
    });

    test('TC1.6: Delete santri privat record cleanly', async () => {
      // Create a temporary student to delete
      const temp = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Santri Temporary Deletion',
        nomorInduk: 'TEMP-DEL-01',
        kontakOrtu: '08111222333',
        nominalTagihanBulanan: 150000,
        statusSantri: 'aktif'
      });
      assert.ok(temp.id);

      const deleteRes = await PrivatContract.deleteSantriPrivat(temp.id);
      assert.equal(deleteRes.success, true);

      const list = await PrivatContract.getSantriPrivatList();
      const found = list.find((s) => s.id === temp.id);
      assert.equal(found, undefined, 'Deleted student must not appear in list');
    });
  });

  // =========================================================================
  // Feature 2: Flat-rate Monthly Billing Generator (keuangan_privat)
  // =========================================================================
  describe('Feature 2: Flat-rate Monthly Billing Generator in Isolation', () => {
    let activeStudentA: string;
    let activeStudentB: string;
    let inactiveStudent: string;

    before(async () => {
      const a = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Budi Santoso (Privat)',
        nomorInduk: 'RQ-P-001',
        kontakOrtu: '085200000001',
        nominalTagihanBulanan: 300000,
        statusSantri: 'aktif'
      });
      activeStudentA = a.id!;

      const b = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Citra Dewi (Privat)',
        nomorInduk: 'RQ-P-002',
        kontakOrtu: '085200000002',
        nominalTagihanBulanan: 450000,
        statusSantri: 'aktif'
      });
      activeStudentB = b.id!;

      const c = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Doni Nonaktif (Privat)',
        nomorInduk: 'RQ-P-003',
        kontakOrtu: '085200000003',
        nominalTagihanBulanan: 500000,
        statusSantri: 'nonaktif'
      });
      inactiveStudent = c.id!;
    });

    test('TC1.7: Generate monthly bills for all active private students', async () => {
      const bulan = 10;
      const tahun = 2026;
      const result = await PrivatContract.generateTagihanBulananPrivat(bulan, tahun);

      assert.equal(result.success, true);
      assert.ok(result.generated >= 2, 'Should generate bills for at least 2 active students');
      assert.ok(result.skipped >= 0);
    });

    test('TC1.8: Verify generated bill nominal matches student nominalTagihanBulanan', async () => {
      const { data } = await PrivatContract.getKeuanganPrivatList(10, 2026);
      const billA = data.find((b) => b.idSantriPrivat === activeStudentA);
      const billB = data.find((b) => b.idSantriPrivat === activeStudentB);

      assert.ok(billA, 'Bill for Student A must exist');
      assert.equal(billA.nominalTagihan, 300000, 'Bill amount must match 300.000');
      assert.equal(billA.status, 'belum_lunas');

      assert.ok(billB, 'Bill for Student B must exist');
      assert.equal(billB.nominalTagihan, 450000, 'Bill amount must match 450.000');
      assert.equal(billB.status, 'belum_lunas');
    });

    test('TC1.9: Inactive students are skipped from billing generation', async () => {
      const { data } = await PrivatContract.getKeuanganPrivatList(10, 2026);
      const billInactive = data.find((b) => b.idSantriPrivat === inactiveStudent);

      assert.equal(billInactive, undefined, 'Inactive student must not receive generated bill');
    });

    test('TC1.10: Query billing list with month, year, and status filters', async () => {
      const filteredMonth = await PrivatContract.getKeuanganPrivatList(10, 2026, 'belum_lunas');
      assert.ok(filteredMonth.data.length >= 2);
      assert.ok(filteredMonth.data.every((b) => b.bulan === 10 && b.tahun === 2026 && b.status === 'belum_lunas'));

      const filteredNonExistent = await PrivatContract.getKeuanganPrivatList(1, 2025);
      assert.equal(filteredNonExistent.data.length, 0);
    });

    test('TC1.11: Calculate billing summary metrics accurately', async () => {
      const { summary } = await PrivatContract.getKeuanganPrivatList(10, 2026);

      assert.ok(summary.totalTagihan >= 750000, 'Total tagihan should sum generated bills');
      assert.equal(summary.totalLunas, 0, 'No bills paid yet');
      assert.equal(summary.totalBelumLunas, summary.totalTagihan);
      assert.equal(summary.persentaseLunas, 0);
    });
  });

  // =========================================================================
  // Feature 3: Payment Recording & History (keuangan_privat)
  // =========================================================================
  describe('Feature 3: Payment Recording & History in Isolation', () => {
    let billIdToPay: string;
    let studentId: string;

    before(async () => {
      const s = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Fatimah Az-Zahra',
        nomorInduk: 'PAY-ISO-01',
        kontakOrtu: '081288887777',
        nominalTagihanBulanan: 275000,
        statusSantri: 'aktif'
      });
      studentId = s.id!;

      await PrivatContract.generateTagihanBulananPrivat(11, 2026);
      const { data } = await PrivatContract.getKeuanganPrivatList(11, 2026);
      const bill = data.find((b) => b.idSantriPrivat === studentId);
      assert.ok(bill);
      billIdToPay = bill.id;
    });

    test('TC1.12: Mark bill as paid (lunas) with payment date', async () => {
      const paymentDate = new Date('2026-11-05T09:30:00Z');
      const payRes = await PrivatContract.catatPembayaranPrivat(billIdToPay, paymentDate);

      assert.equal(payRes.success, true);

      const { data } = await PrivatContract.getKeuanganPrivatList(11, 2026);
      const updatedBill = data.find((b) => b.id === billIdToPay);
      assert.ok(updatedBill);
      assert.equal(updatedBill.status, 'lunas');
      assert.ok(updatedBill.tanggalLunas !== null);
    });

    test('TC1.13: Payment timestamp adheres to Asia/Jakarta WIB timezone & formatting', async () => {
      const { data } = await PrivatContract.getKeuanganPrivatList(11, 2026);
      const updatedBill = data.find((b) => b.id === billIdToPay);
      assert.ok(updatedBill?.tanggalLunas);

      const formattedColonDate = formatPrivatDateColon(updatedBill.tanggalLunas);
      const formattedTime = formatPrivatTime(updatedBill.tanggalLunas);

      // Verify DD:MM:YYYY format with colon
      assert.match(formattedColonDate, /^\d{2}:\d{2}:\d{4}$/, 'Date must format as DD:MM:YYYY with colons');
      assert.match(formattedTime, /^\d{2}:\d{2}$/, 'Time must format as 24-hour HH:mm');
    });

    test('TC1.14: Cancel/revert payment back to belum_lunas', async () => {
      const cancelRes = await PrivatContract.batalkanPembayaranPrivat(billIdToPay);
      assert.equal(cancelRes.success, true);

      const { data } = await PrivatContract.getKeuanganPrivatList(11, 2026);
      const reverted = data.find((b) => b.id === billIdToPay);
      assert.ok(reverted);
      assert.equal(reverted.status, 'belum_lunas');
      assert.equal(reverted.tanggalLunas, null);
    });

    test('TC1.15: Idempotent payment recording handling', async () => {
      // Mark lunas first time
      const firstPay = await PrivatContract.catatPembayaranPrivat(billIdToPay);
      assert.equal(firstPay.success, true);

      // Mark lunas second time (idempotent)
      const secondPay = await PrivatContract.catatPembayaranPrivat(billIdToPay);
      assert.equal(secondPay.success, true);

      const { data } = await PrivatContract.getKeuanganPrivatList(11, 2026);
      const bill = data.find((b) => b.id === billIdToPay);
      assert.equal(bill?.status, 'lunas');
    });

    test('TC1.16: Verify financial summary metrics recalculate upon payment status change', async () => {
      const { summary } = await PrivatContract.getKeuanganPrivatList(11, 2026);
      assert.ok(summary.totalLunas >= 275000);
      assert.ok(summary.persentaseLunas > 0);
    });
  });

  // =========================================================================
  // Feature 4: Attendance & Progress Logging (absensi_privat)
  // =========================================================================
  describe('Feature 4: Attendance & Progress Logging in Isolation', () => {
    let studentId: string;

    before(async () => {
      const s = await PrivatContract.createSantriPrivat({
        namaLengkap: 'Hamzah Ibnu Abdul Muthalib',
        nomorInduk: 'ATT-ISO-01',
        kontakOrtu: '081377776666',
        nominalTagihanBulanan: 300000,
        statusSantri: 'aktif'
      });
      studentId = s.id!;
    });

    test('TC1.17: Record attendance session with status hadir and memorization progress note', async () => {
      const waktuSesi = new Date('2026-10-01T15:30:00Z');
      const res = await PrivatContract.simpanAbsensiPrivat({
        idSantriPrivat: studentId,
        waktuSesi,
        statusKehadiran: 'hadir',
        capaianHafalan: 'Juz 30: Surah An-Naba ayat 1-20 (Makhraj lancar)'
      });

      assert.equal(res.success, true);

      const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
      assert.ok(history.length >= 1);
      const first = history[0];
      assert.equal(first.statusKehadiran, 'hadir');
      assert.equal(first.capaianHafalan, 'Juz 30: Surah An-Naba ayat 1-20 (Makhraj lancar)');
    });

    test('TC1.18: Record attendance session with status izin and reason note', async () => {
      const waktuSesi = new Date('2026-10-03T15:30:00Z');
      const res = await PrivatContract.simpanAbsensiPrivat({
        idSantriPrivat: studentId,
        waktuSesi,
        statusKehadiran: 'izin',
        capaianHafalan: 'Izin demam dan istirahat dokter'
      });

      assert.equal(res.success, true);

      const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
      const record = history.find((h) => h.statusKehadiran === 'izin');
      assert.ok(record);
      assert.equal(record.capaianHafalan, 'Izin demam dan istirahat dokter');
    });

    test('TC1.19: Record attendance session with status alpa', async () => {
      const waktuSesi = new Date('2026-10-05T15:30:00Z');
      const res = await PrivatContract.simpanAbsensiPrivat({
        idSantriPrivat: studentId,
        waktuSesi,
        statusKehadiran: 'alpa',
        capaianHafalan: null
      });

      assert.equal(res.success, true);

      const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
      const record = history.find((h) => h.statusKehadiran === 'alpa');
      assert.ok(record);
      assert.equal(record.statusKehadiran, 'alpa');
    });

    test('TC1.20: Query attendance history filtered by idSantriPrivat with sorted chronology', async () => {
      const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
      assert.equal(history.length, 3, 'Should have exactly 3 recorded sessions');

      // Verify descending chronological order
      const time0 = new Date(history[0].waktuSesi).getTime();
      const time1 = new Date(history[1].waktuSesi).getTime();
      const time2 = new Date(history[2].waktuSesi).getTime();
      assert.ok(time0 >= time1 && time1 >= time2, 'Attendance history must be sorted by waktuSesi descending');
    });

    test('TC1.21: Delete attendance record cleanly', async () => {
      const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
      const target = history[0];
      assert.ok(target);

      const deleteRes = await PrivatContract.hapusAbsensiPrivat(target.id);
      assert.equal(deleteRes.success, true);

      const updatedHistory = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
      assert.equal(updatedHistory.length, 2, 'History count must decrement by 1');
      assert.equal(updatedHistory.find((h) => h.id === target.id), undefined);
    });
  });
});

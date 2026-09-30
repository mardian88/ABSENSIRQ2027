/**
 * Tier 3: Cross-Feature Interactions & Pairwise Combinations Test Suite
 * Pairwise coverage and multi-feature state transitions:
 *  - TC3.1: Active Regular Santri Lifecycle
 *  - TC3.2: External Santri Lifecycle
 *  - TC3.3: Status Deactivation Cascade & Historical Data Preservation
 *  - TC3.4: Fee Update Cascade Mid-Cycle
 *  - TC3.5: Multi-Month Staggered Payments & Summary Audit
 *  - TC3.6: Attendance Frequency vs Billing Reconciliation
 *  - TC3.7: Referential Integrity & Deletion Protections
 * Total: 7 Test Cases
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  PrivatContract,
  TestRegistry,
  formatPrivatDateColon,
  formatRupiahDot
} from './harness';

describe('Tier 3: Cross-Feature Interactions', () => {
  before(async () => {
    await TestRegistry.initDatabaseSchema();
    await TestRegistry.cleanupAll();
  });

  after(async () => {
    await TestRegistry.cleanupAll();
  });

  test('TC3.1: Active Regular Santri Pairwise Lifecycle (Register -> Bill -> Pay -> Attend -> Verify Consistency)', async () => {
    // 1. Register active regular santri with NIS
    const reg = await PrivatContract.createSantriPrivat({
      namaLengkap: 'Farhan Maulana',
      nomorInduk: 'NIS-REG-2026-099',
      kontakOrtu: '081211112222',
      nominalTagihanBulanan: 250000,
      statusSantri: 'aktif'
    });
    assert.equal(reg.success, true);
    const studentId = reg.id!;

    // 2. Generate monthly billing for Month 10 Year 2026
    const gen = await PrivatContract.generateTagihanBulananPrivat(10, 2026);
    assert.equal(gen.success, true);

    const { data: billsBeforePay, summary: summaryBefore } = await PrivatContract.getKeuanganPrivatList(10, 2026);
    const bill = billsBeforePay.find((b) => b.idSantriPrivat === studentId);
    assert.ok(bill, 'Generated bill must exist for student');
    assert.equal(bill.nominalTagihan, 250000);
    assert.equal(bill.status, 'belum_lunas');

    // 3. Pay bill
    const payRes = await PrivatContract.catatPembayaranPrivat(bill.id, new Date('2026-10-02T10:00:00Z'));
    assert.equal(payRes.success, true);

    const { data: billsAfterPay, summary: summaryAfter } = await PrivatContract.getKeuanganPrivatList(10, 2026);
    const paidBill = billsAfterPay.find((b) => b.id === bill.id);
    assert.equal(paidBill?.status, 'lunas');
    assert.ok(paidBill?.tanggalLunas !== null);
    assert.ok(summaryAfter.totalLunas >= 250000);

    // 4. Log 2 attendance sessions for this student
    const att1 = await PrivatContract.simpanAbsensiPrivat({
      idSantriPrivat: studentId,
      waktuSesi: new Date('2026-10-05T16:00:00Z'),
      statusKehadiran: 'hadir',
      capaianHafalan: 'Juz 30: Surah An-Nazi\'at 1-20'
    });
    assert.equal(att1.success, true);

    const att2 = await PrivatContract.simpanAbsensiPrivat({
      idSantriPrivat: studentId,
      waktuSesi: new Date('2026-10-12T16:00:00Z'),
      statusKehadiran: 'hadir',
      capaianHafalan: 'Juz 30: Surah An-Nazi\'at 21-46 (Khatam surah)'
    });
    assert.equal(att2.success, true);

    // 5. Verify academic & financial consistency
    const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
    assert.equal(history.length, 2, 'Must have 2 attendance records');
    assert.equal(history.every((h) => h.statusKehadiran === 'hadir'), true);
    assert.equal(paidBill?.namaLengkap, 'Farhan Maulana');
    assert.equal(paidBill?.nomorInduk, 'NIS-REG-2026-099');
  });

  test('TC3.2: External Santri Pairwise Lifecycle (No NIS, Flat-Rate Rp 350.000, Multi-Session)', async () => {
    // 1. Register external santri without NIS
    const reg = await PrivatContract.createSantriPrivat({
      namaLengkap: 'Najwa Syahira',
      nomorInduk: null,
      kontakOrtu: '085733334444',
      nominalTagihanBulanan: 350000,
      statusSantri: 'aktif'
    });
    assert.equal(reg.success, true);
    const studentId = reg.id!;

    // 2. Generate billing for Month 10 Year 2026
    await PrivatContract.generateTagihanBulananPrivat(10, 2026);
    const { data: bills } = await PrivatContract.getKeuanganPrivatList(10, 2026);
    const bill = bills.find((b) => b.idSantriPrivat === studentId);
    assert.ok(bill);
    assert.equal(bill.nominalTagihan, 350000);
    assert.equal(bill.nomorInduk, null);

    // 3. Pay bill
    await PrivatContract.catatPembayaranPrivat(bill.id);

    // 4. Log 3 sessions with diverse statuses (hadir, izin, hadir)
    await PrivatContract.simpanAbsensiPrivat({
      idSantriPrivat: studentId,
      waktuSesi: new Date('2026-10-06T14:00:00Z'),
      statusKehadiran: 'hadir',
      capaianHafalan: 'Iqro Jilid 4 Halaman 1-5'
    });
    await PrivatContract.simpanAbsensiPrivat({
      idSantriPrivat: studentId,
      waktuSesi: new Date('2026-10-13T14:00:00Z'),
      statusKehadiran: 'izin',
      capaianHafalan: 'Acara keluarga'
    });
    await PrivatContract.simpanAbsensiPrivat({
      idSantriPrivat: studentId,
      waktuSesi: new Date('2026-10-20T14:00:00Z'),
      statusKehadiran: 'hadir',
      capaianHafalan: 'Iqro Jilid 4 Halaman 6-12'
    });

    const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
    assert.equal(history.length, 3);
    const hadirCount = history.filter((h) => h.statusKehadiran === 'hadir').length;
    const izinCount = history.filter((h) => h.statusKehadiran === 'izin').length;
    assert.equal(hadirCount, 2);
    assert.equal(izinCount, 1);
  });

  test('TC3.3: Status Deactivation Cascade & Historical Data Preservation', async () => {
    // 1. Create active student and generate month 9 bill
    const reg = await PrivatContract.createSantriPrivat({
      namaLengkap: 'Santri Graduating Soon',
      kontakOrtu: '081299990001',
      nominalTagihanBulanan: 200000,
      statusSantri: 'aktif'
    });
    const studentId = reg.id!;

    await PrivatContract.generateTagihanBulananPrivat(9, 2026);
    await PrivatContract.simpanAbsensiPrivat({
      idSantriPrivat: studentId,
      waktuSesi: new Date('2026-09-15T15:00:00Z'),
      statusKehadiran: 'hadir',
      capaianHafalan: 'Selesai Juz Amma'
    });

    // 2. Deactivate student
    await PrivatContract.updateSantriPrivat(studentId, { statusSantri: 'nonaktif' });

    // 3. Generate month 10 bill (should NOT include this student)
    await PrivatContract.generateTagihanBulananPrivat(10, 2026);
    const { data: billsMonth10 } = await PrivatContract.getKeuanganPrivatList(10, 2026);
    assert.equal(billsMonth10.find((b) => b.idSantriPrivat === studentId), undefined, 'Deactivated student must not get month 10 bill');

    // 4. Verify month 9 bill and attendance history are perfectly preserved
    const { data: billsMonth9 } = await PrivatContract.getKeuanganPrivatList(9, 2026);
    assert.ok(billsMonth9.find((b) => b.idSantriPrivat === studentId), 'Historical month 9 bill must still exist');

    const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
    assert.equal(history.length, 1, 'Historical attendance must still exist');
  });

  test('TC3.4: Tuition Fee Modification Mid-Cycle (Existing bills unchanged, future bills use new rate)', async () => {
    const reg = await PrivatContract.createSantriPrivat({
      namaLengkap: 'Santri Tuition Increase',
      kontakOrtu: '081299990002',
      nominalTagihanBulanan: 300000,
      statusSantri: 'aktif'
    });
    const studentId = reg.id!;

    // Month 7 bill generated at 300.000
    await PrivatContract.generateTagihanBulananPrivat(7, 2026);
    const { data: billsMonth7 } = await PrivatContract.getKeuanganPrivatList(7, 2026);
    const billM7 = billsMonth7.find((b) => b.idSantriPrivat === studentId);
    assert.equal(billM7?.nominalTagihan, 300000);

    // Update student's fee to 400.000
    await PrivatContract.updateSantriPrivat(studentId, { nominalTagihanBulanan: 400000 });

    // Month 8 bill generated
    await PrivatContract.generateTagihanBulananPrivat(8, 2026);
    const { data: billsMonth8 } = await PrivatContract.getKeuanganPrivatList(8, 2026);
    const billM8 = billsMonth8.find((b) => b.idSantriPrivat === studentId);
    assert.equal(billM8?.nominalTagihan, 400000, 'Subsequent month bill must use new rate 400.000');

    // Month 7 bill must remain untouched at 300.000
    const { data: billsMonth7Check } = await PrivatContract.getKeuanganPrivatList(7, 2026);
    const billM7Check = billsMonth7Check.find((b) => b.idSantriPrivat === studentId);
    assert.equal(billM7Check?.nominalTagihan, 300000, 'Historical bill must retain original rate');
  });

  test('TC3.5: Multi-Month Staggered Payments & Summary Audit', async () => {
    const reg = await PrivatContract.createSantriPrivat({
      namaLengkap: 'Santri Multi Month Stagger',
      kontakOrtu: '081299990003',
      nominalTagihanBulanan: 150000,
      statusSantri: 'aktif'
    });
    const studentId = reg.id!;

    // Generate Month 1, 2, 3
    await PrivatContract.generateTagihanBulananPrivat(1, 2027);
    await PrivatContract.generateTagihanBulananPrivat(2, 2027);
    await PrivatContract.generateTagihanBulananPrivat(3, 2027);

    const { data: b1 } = await PrivatContract.getKeuanganPrivatList(1, 2027);
    const { data: b2 } = await PrivatContract.getKeuanganPrivatList(2, 2027);
    const { data: b3 } = await PrivatContract.getKeuanganPrivatList(3, 2027);

    const bill1 = b1.find((b) => b.idSantriPrivat === studentId)!;
    const bill2 = b2.find((b) => b.idSantriPrivat === studentId)!;
    const bill3 = b3.find((b) => b.idSantriPrivat === studentId)!;

    // Pay Month 1
    await PrivatContract.catatPembayaranPrivat(bill1.id);

    // Pay Month 2, then cancel Month 2
    await PrivatContract.catatPembayaranPrivat(bill2.id);
    await PrivatContract.batalkanPembayaranPrivat(bill2.id);

    // Month 3 remains unpaid

    const check1 = (await PrivatContract.getKeuanganPrivatList(1, 2027)).data.find((b) => b.id === bill1.id);
    const check2 = (await PrivatContract.getKeuanganPrivatList(2, 2027)).data.find((b) => b.id === bill2.id);
    const check3 = (await PrivatContract.getKeuanganPrivatList(3, 2027)).data.find((b) => b.id === bill3.id);

    assert.equal(check1?.status, 'lunas');
    assert.equal(check2?.status, 'belum_lunas');
    assert.equal(check3?.status, 'belum_lunas');
  });

  test('TC3.6: Attendance Frequency vs Billing Reconciliation', async () => {
    const reg = await PrivatContract.createSantriPrivat({
      namaLengkap: 'Santri Audit Attendance',
      kontakOrtu: '081299990004',
      nominalTagihanBulanan: 300000,
      statusSantri: 'aktif'
    });
    const studentId = reg.id!;

    // Generate bill for Month 4 Year 2027
    await PrivatContract.generateTagihanBulananPrivat(4, 2027);

    // Record 4 weekly sessions in month 4
    for (let day = 1; day <= 4; day++) {
      const dayNum = day * 7;
      const dayStr = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
      await PrivatContract.simpanAbsensiPrivat({
        idSantriPrivat: studentId,
        waktuSesi: new Date(`2027-04-${dayStr}T15:00:00Z`),
        statusKehadiran: 'hadir',
        capaianHafalan: `Sesi Mingguan ke-${day}`
      });
    }

    const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
    const { data: bills } = await PrivatContract.getKeuanganPrivatList(4, 2027);
    const studentBill = bills.find((b) => b.idSantriPrivat === studentId);

    assert.equal(history.length, 4, '4 sessions recorded');
    assert.ok(studentBill, 'Monthly bill exists for April 2027');
    assert.equal(studentBill.nominalTagihan, 300000);
  });

  test('TC3.7: Referential Integrity & Deletion Protections', async () => {
    const reg = await PrivatContract.createSantriPrivat({
      namaLengkap: 'Santri Deletion Cascade Check',
      kontakOrtu: '081299990005',
      nominalTagihanBulanan: 200000,
      statusSantri: 'aktif'
    });
    const studentId = reg.id!;

    // Create a bill and attendance
    await PrivatContract.generateTagihanBulananPrivat(5, 2027);
    await PrivatContract.simpanAbsensiPrivat({
      idSantriPrivat: studentId,
      waktuSesi: new Date('2027-05-10T15:00:00Z'),
      statusKehadiran: 'hadir',
      capaianHafalan: 'Test deletion'
    });

    // Delete student
    const delRes = await PrivatContract.deleteSantriPrivat(studentId);
    assert.equal(delRes.success, true);

    // Verify student is gone
    const list = await PrivatContract.getSantriPrivatList();
    assert.equal(list.find((s) => s.id === studentId), undefined);

    // Verify associated records are cleaned up without orphan data
    const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
    assert.equal(history.length, 0);

    const { data: bills } = await PrivatContract.getKeuanganPrivatList(5, 2027);
    assert.equal(bills.find((b) => b.idSantriPrivat === studentId), undefined);
  });
});

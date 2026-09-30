/**
 * Tier 4: Real-World Scenarios & Strict GEMINI.md Compliance Test Suite
 * Validates realistic end-to-end user journeys and formatting constraints:
 *  - TC4.1: External Student Ahmad Fauzi (Tahfiz Privat, Flat-Rate Rp 350.000)
 *  - TC4.2: Active Regular Santri Siti Aisyah (Mengaji Privat, NIS RQ-2026-088)
 *  - TC4.3: Bulk Semester Cycle with Multi-Student Financial Reconciliation
 *  - TC4.4: Strict GEMINI.md Formatting & Localization Compliance
 * Total: 4 Scenarios
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import {
  PrivatContract,
  TestRegistry,
  formatPrivatDateColon,
  formatPrivatTime,
  formatRupiahDot,
  parseRupiahInput,
  TIMEZONE_WIB
} from './harness';

describe('Tier 4: Real-World Scenarios & Strict Compliance', () => {
  before(async () => {
    await TestRegistry.initDatabaseSchema();
    await TestRegistry.cleanupAll();
  });

  after(async () => {
    await TestRegistry.cleanupAll();
  });

  test('TC4.1: External Santri Ahmad Fauzi Full Journey (Tahfiz Privat Rp 350.000, 2 Months Billed, 1 Month Paid, 4 Sessions)', async () => {
    // 1. External student registration (without regular NIS)
    const reg = await PrivatContract.createSantriPrivat({
      namaLengkap: 'Ahmad Fauzi',
      nomorInduk: null,
      kontakOrtu: '081234567890',
      nominalTagihanBulanan: 350000,
      statusSantri: 'aktif'
    });
    assert.equal(reg.success, true);
    const studentId = reg.id!;

    // 2. Generate bills for October (Month 10) and November (Month 11) 2026
    await PrivatContract.generateTagihanBulananPrivat(10, 2026);
    await PrivatContract.generateTagihanBulananPrivat(11, 2026);

    const { data: billsOct } = await PrivatContract.getKeuanganPrivatList(10, 2026);
    const billOct = billsOct.find((b) => b.idSantriPrivat === studentId);
    assert.ok(billOct, 'October bill must exist');
    assert.equal(billOct.nominalTagihan, 350000);
    assert.equal(billOct.status, 'belum_lunas');

    const { data: billsNov } = await PrivatContract.getKeuanganPrivatList(11, 2026);
    const billNov = billsNov.find((b) => b.idSantriPrivat === studentId);
    assert.ok(billNov, 'November bill must exist');
    assert.equal(billNov.nominalTagihan, 350000);
    assert.equal(billNov.status, 'belum_lunas');

    // 3. Pay October bill on 01:10:2026 (WIB)
    const paymentTimestamp = new Date('2026-10-01T08:30:00+07:00');
    const payRes = await PrivatContract.catatPembayaranPrivat(billOct.id, paymentTimestamp);
    assert.equal(payRes.success, true);

    const { data: billsOctAfter } = await PrivatContract.getKeuanganPrivatList(10, 2026);
    const paidOct = billsOctAfter.find((b) => b.id === billOct.id);
    assert.equal(paidOct?.status, 'lunas');
    assert.ok(paidOct?.tanggalLunas);
    assert.equal(formatPrivatDateColon(paidOct.tanggalLunas), '01:10:2026');

    // 4. Record 4 progressive attendance sessions in October
    const sessions = [
      {
        waktuSesi: new Date('2026-10-02T15:30:00+07:00'),
        statusKehadiran: 'hadir' as const,
        capaianHafalan: 'Surah An-Naba ayat 1-15 (Lancar)'
      },
      {
        waktuSesi: new Date('2026-10-09T15:30:00+07:00'),
        statusKehadiran: 'hadir' as const,
        capaianHafalan: 'Surah An-Naba ayat 16-30 (Perlu perbaikan makhraj huruf ' + 'Ain)'
      },
      {
        waktuSesi: new Date('2026-10-16T15:30:00+07:00'),
        statusKehadiran: 'hadir' as const,
        capaianHafalan: 'Surah An-Naba ayat 31-40 & Mutabaah Juz 30'
      },
      {
        waktuSesi: new Date('2026-10-23T15:30:00+07:00'),
        statusKehadiran: 'izin' as const,
        capaianHafalan: 'Izin (Sakit demam)'
      }
    ];

    for (const session of sessions) {
      const attRes = await PrivatContract.simpanAbsensiPrivat({
        idSantriPrivat: studentId,
        waktuSesi: session.waktuSesi,
        statusKehadiran: session.statusKehadiran,
        capaianHafalan: session.capaianHafalan
      });
      assert.equal(attRes.success, true);
    }

    // 5. Verification of complete history
    const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
    assert.equal(history.length, 4, 'Must have 4 attendance sessions recorded');
    assert.equal(history.filter((h) => h.statusKehadiran === 'hadir').length, 3);
    assert.equal(history.filter((h) => h.statusKehadiran === 'izin').length, 1);
  });

  test('TC4.2: Regular Active Santri Siti Aisyah Full Journey (NIS RQ-2026-088, Mengaji Privat Rp 200.000, 8 Sessions)', async () => {
    // 1. Regular student registration with existing NIS
    const reg = await PrivatContract.createSantriPrivat({
      namaLengkap: 'Siti Aisyah',
      nomorInduk: 'RQ-2026-088',
      kontakOrtu: '082155556666',
      nominalTagihanBulanan: 200000,
      statusSantri: 'aktif'
    });
    assert.equal(reg.success, true);
    const studentId = reg.id!;

    // 2. Billing generation and payment on 05:10:2026
    await PrivatContract.generateTagihanBulananPrivat(10, 2026);
    const { data: bills } = await PrivatContract.getKeuanganPrivatList(10, 2026);
    const bill = bills.find((b) => b.idSantriPrivat === studentId);
    assert.ok(bill);
    assert.equal(bill.nomorInduk, 'RQ-2026-088');

    const paymentDate = new Date('2026-10-05T14:15:00+07:00');
    await PrivatContract.catatPembayaranPrivat(bill.id, paymentDate);

    // 3. Log 8 sessions across October (twice a week)
    for (let i = 1; i <= 8; i++) {
      const day = i <= 4 ? i * 2 : 10 + i * 2;
      const dayStr = day < 10 ? `0${day}` : `${day}`;
      await PrivatContract.simpanAbsensiPrivat({
        idSantriPrivat: studentId,
        waktuSesi: new Date(`2026-10-${dayStr}T16:00:00+07:00`),
        statusKehadiran: 'hadir',
        capaianHafalan: `Iqro Jilid 5 Halaman ${i * 3}`
      });
    }

    const history = await PrivatContract.getRiwayatAbsensiPrivat({ idSantriPrivat: studentId });
    assert.equal(history.length, 8, '8 sessions successfully recorded');
    assert.equal(history.every((h) => h.statusKehadiran === 'hadir'), true);

    const paidBillCheck = (await PrivatContract.getKeuanganPrivatList(10, 2026)).data.find((b) => b.id === bill.id);
    assert.equal(paidBillCheck?.status, 'lunas');
    assert.equal(formatPrivatDateColon(paidBillCheck?.tanggalLunas ?? new Date()), '05:10:2026');
  });

  test('TC4.3: Bulk Semester Cycle with 5 Students, Diverse Tiers, and Financial Reconciliation', async () => {
    const studentProfiles = [
      { nama: 'Santri Tier A', nominal: 150000 },
      { nama: 'Santri Tier B', nominal: 250000 },
      { nama: 'Santri Tier C', nominal: 350000 },
      { nama: 'Santri Tier D', nominal: 450000 },
      { nama: 'Santri Tier E', nominal: 500000 }
    ];

    const studentIds: string[] = [];
    for (const p of studentProfiles) {
      const res = await PrivatContract.createSantriPrivat({
        namaLengkap: p.nama,
        kontakOrtu: '081299990000',
        nominalTagihanBulanan: p.nominal,
        statusSantri: 'aktif'
      });
      studentIds.push(res.id!);
    }

    const targetMonth = 1;
    const targetYear = 2028;

    // Generate bills for January 2028
    const genRes = await PrivatContract.generateTagihanBulananPrivat(targetMonth, targetYear);
    assert.equal(genRes.success, true);
    assert.ok(genRes.generated >= 5);

    const { data: bills, summary } = await PrivatContract.getKeuanganPrivatList(targetMonth, targetYear);

    // Filter to our 5 test students
    const cohortBills = bills.filter((b) => studentIds.includes(b.idSantriPrivat ?? ''));
    assert.equal(cohortBills.length, 5);

    const expectedCohortTotal = 150000 + 250000 + 350000 + 450000 + 500000; // 1.700.000
    const cohortTotal = cohortBills.reduce((acc, b) => acc + b.nominalTagihan, 0);
    assert.equal(cohortTotal, expectedCohortTotal);

    // Pay 3 of the 5 students
    await PrivatContract.catatPembayaranPrivat(cohortBills[0].id); // 150.000
    await PrivatContract.catatPembayaranPrivat(cohortBills[1].id); // 250.000
    await PrivatContract.catatPembayaranPrivat(cohortBills[2].id); // 350.000
    // cohortBills[3] and [4] remain belum_lunas (450.000 + 500.000 = 950.000)

    const { data: updatedBills, summary: updatedSummary } = await PrivatContract.getKeuanganPrivatList(targetMonth, targetYear);
    const updatedCohort = updatedBills.filter((b) => studentIds.includes(b.idSantriPrivat ?? ''));
    const cohortPaid = updatedCohort.filter((b) => b.status === 'lunas').reduce((acc, b) => acc + b.nominalTagihan, 0);
    const cohortUnpaid = updatedCohort.filter((b) => b.status === 'belum_lunas').reduce((acc, b) => acc + b.nominalTagihan, 0);

    assert.equal(cohortPaid, 750000); // 150k + 250k + 350k
    assert.equal(cohortUnpaid, 950000); // 450k + 500k
    assert.equal(cohortPaid + cohortUnpaid, expectedCohortTotal);
  });

  test('TC4.4: Strict GEMINI.md Formatting & Localization Compliance Verification', async () => {
    // 1. Verify Date Format: MUST use colon separator 'DD:MM:YYYY', NO '/' or '-'
    const sampleDate = new Date('2026-03-28T14:30:00+07:00');
    const formattedDate = formatPrivatDateColon(sampleDate);

    assert.equal(formattedDate, '28:03:2026', 'Date must be DD:MM:YYYY with colon separator per GEMINI.md');
    assert.equal(formattedDate.includes('/'), false, 'Date must NOT contain slash');
    assert.equal(formattedDate.includes('-'), false, 'Date must NOT contain dash');

    // 2. Verify Time Format: MUST use 24-hour HH:mm
    const formattedTime = formatPrivatTime(sampleDate);
    assert.equal(formattedTime, '14:30', 'Time must be 24-hour HH:mm format');

    // 3. Verify Currency Format: Display MUST use dot separator for thousands
    assert.equal(formatRupiahDot(1000), 'Rp 1.000');
    assert.equal(formatRupiahDot(350000), 'Rp 350.000');
    assert.equal(formatRupiahDot(1500000), 'Rp 1.500.000');

    // 4. Verify Form Input Parser: Strips dots and punctuation, returns pure integer for DB
    assert.equal(parseRupiahInput('1.000'), 1000);
    assert.equal(parseRupiahInput('Rp 350.000'), 350000);
    assert.equal(parseRupiahInput('Rp 1.500.000,00'), 150000000); // without cents convention
    assert.equal(parseRupiahInput('350000'), 350000);

    // 5. Verify Timezone is Asia/Jakarta
    assert.equal(TIMEZONE_WIB, 'Asia/Jakarta');
  });
});

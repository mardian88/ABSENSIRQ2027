import assert from 'node:assert/strict';
import { formatDateWIB, formatTimeWIB, formatDateTimeWIB } from '../../../src/lib/date-utils';
import { santriPrivatInputSchema, updateSantriPrivatSchema } from '../../../src/app/admin/santri-privat/actions';

console.log('--- ADVERSARIAL VERIFICATION START ---');

// 1. Test Date Utilities
console.log('1. Testing Date Utilities');
// Null / Undefined / Invalid
assert.equal(formatDateWIB(null), '-');
assert.equal(formatDateWIB(undefined), '-');
assert.equal(formatDateWIB('invalid-date'), '-');
assert.equal(formatTimeWIB(null), '-');
assert.equal(formatTimeWIB('invalid'), '-');

// Specific UTC date: 2026-03-27T18:30:00Z -> In WIB (UTC+7) it is 2026-03-28 01:30
const utcDate = new Date('2026-03-27T18:30:00Z');
const formattedDate = formatDateWIB(utcDate);
assert.equal(formattedDate, '28:03:2026', `Expected 28:03:2026 but got ${formattedDate}`);
const formattedTime = formatTimeWIB(utcDate);
assert.equal(formattedTime, '01:30', `Expected 01:30 but got ${formattedTime}`);
const formattedDateTime = formatDateTimeWIB(utcDate);
assert.equal(formattedDateTime, '28:03:2026 01:30 WIB');

// Leap year: 2024-02-29
const leapDate = new Date('2024-02-29T05:00:00Z');
assert.equal(formatDateWIB(leapDate), '29:02:2024');

// Colon check: verify no slash or dash
assert.ok(!formattedDate.includes('/'), 'Should not contain /');
assert.ok(!formattedDate.includes('-'), 'Should not contain -');
assert.ok(formattedDate.split(':').length === 3, 'Must have 3 parts separated by colon');

console.log('✅ Date utilities passed all edge cases!');

// 2. Test Input Schema & Preprocessing
console.log('2. Testing santriPrivatInputSchema');
// Valid input
const valid1 = santriPrivatInputSchema.safeParse({
  namaLengkap: '  Ahmad Dahlan  ',
  nomorInduk: '  NIS-001  ',
  kontakOrtu: ' 08123456789 ',
  nominalTagihanBulanan: 'Rp 350.000',
  statusSantri: 'aktif'
});
assert.ok(valid1.success, 'Valid input parsing should succeed');
if (valid1.success) {
  assert.equal(valid1.data.namaLengkap, 'Ahmad Dahlan');
  assert.equal(valid1.data.nomorInduk, 'NIS-001');
  assert.equal(valid1.data.nominalTagihanBulanan, 350000);
}

// Float nominal should be floored
const valid2 = santriPrivatInputSchema.safeParse({
  namaLengkap: 'Siti Sarah',
  kontakOrtu: '0812345',
  nominalTagihanBulanan: 250000.75,
});
assert.ok(valid2.success);
if (valid2.success) {
  assert.equal(valid2.data.nominalTagihanBulanan, 250000);
  assert.equal(valid2.data.statusSantri, 'aktif'); // default value
  assert.equal(valid2.data.nomorInduk, null); // optional/nullable transformed
}

// Negative nominal rejected
const invalidNominal = santriPrivatInputSchema.safeParse({
  namaLengkap: 'Test',
  kontakOrtu: '123',
  nominalTagihanBulanan: -50000
});
assert.ok(!invalidNominal.success, 'Negative nominal should fail validation');

// Empty name rejected
const invalidName = santriPrivatInputSchema.safeParse({
  namaLengkap: '   ',
  kontakOrtu: '123',
  nominalTagihanBulanan: 0
});
assert.ok(!invalidName.success, 'Empty name should fail validation');

// Empty contact rejected
const invalidContact = santriPrivatInputSchema.safeParse({
  namaLengkap: 'Test',
  kontakOrtu: '   ',
  nominalTagihanBulanan: 0
});
assert.ok(!invalidContact.success, 'Empty contact should fail validation');

// Update schema with partial fields
const updateValid = updateSantriPrivatSchema.safeParse({
  nominalTagihanBulanan: '500.000'
});
assert.ok(updateValid.success);
if (updateValid.success) {
  assert.equal(updateValid.data.nominalTagihanBulanan, 500000);
}

console.log('✅ Input schema passed all validation tests!');
console.log('--- ADVERSARIAL VERIFICATION COMPLETE ---');

import { sendTemplatedMessage } from './src/lib/fonnte.js';
import { db } from './src/db/index.js';

async function test() {
  const result = await sendTemplatedMessage('089530928002', 'belum_datang', {
    namaSantri: 'Abdurahman Al Ghifari',
    waktu: '10:00',
    tanggal: '2026-08-24',
    halaqah: 'Halaqah 4 Sore',
    nis: '02661806'
  });
  console.log('Result:', result);
  process.exit(0);
}
test();

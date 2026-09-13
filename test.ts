import { db } from './src/db/index.js';
import { sendPesanBelumHadir } from './src/app/laporan-absensi/belum-hadir/actions.js';

async function test() {
  const result = await sendPesanBelumHadir('bac1b4b1-73ff-4c08-8bff-7b5b36ba821b');
  console.log(result);
}
test();

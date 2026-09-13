import { getLaporanAbsensi } from "./src/app/laporan-absensi/actions";
async function test() {
  const data = await getLaporanAbsensi("hari_ini");
  console.log(JSON.stringify(data.slice(0, 2), null, 2));
}
test().catch(console.error);

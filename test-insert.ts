import { db } from "./src/db";
import { keuanganTabungan, pesananKebutuhan } from "./src/db/schema";

async function run() {
  try {
    const res = await db.insert(keuanganTabungan).values({
        id: 'test-123',
        idSantri: 'some-santri',
        jenis: 'belanja',
        nominal: 1000,
        keterangan: 'test',
        tanggal: new Date(),
        idAdmin: null
    });
    console.log("Success", res);
  } catch (err) {
    console.error("Error", err);
  }
}
run();

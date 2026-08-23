import { db } from "./src/db";
import { katalogKebutuhan } from "./src/db/schema";
async function run() {
  const res = await db.select().from(katalogKebutuhan);
  console.log(res.map(r => r.kategori));
}
run();

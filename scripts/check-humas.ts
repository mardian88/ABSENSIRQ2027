import "dotenv/config";
import { db } from "../src/db";
import { pengaturanHumas, templatePesan } from "../src/db/schema";

async function main() {
  const humas = await db.select().from(pengaturanHumas);
  console.log("Pengaturan Humas:", humas);

  const templates = await db.select().from(templatePesan);
  console.log("Template Pesan:", templates);
}
main();

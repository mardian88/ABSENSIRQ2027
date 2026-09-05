import { db } from "../src/db";
import { pengaturanSemester } from "../src/db/schema";
async function check() {
  const sems = await db.select().from(pengaturanSemester);
  console.log("Semesters:", sems);
}
check().catch(console.error);

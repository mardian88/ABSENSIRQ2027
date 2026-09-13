import 'dotenv/config';
import { db } from '../src/db';
import { santri } from '../src/db/schema';
import { sql } from 'drizzle-orm';

async function run() {
  const count = await db.select({ count: sql`count(*)` }).from(santri);
  console.log("Total Santri:", count);
}
run();

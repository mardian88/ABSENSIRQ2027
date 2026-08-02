import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
  await db.run(sql`DROP TABLE IF EXISTS pendaftar`);
  console.log('Table dropped');
}
main();

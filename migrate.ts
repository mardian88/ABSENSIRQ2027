import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    await db.run(sql`ALTER TABLE pelanggaran RENAME TO poin_santri`);
    await db.run(sql`ALTER TABLE poin_santri ADD COLUMN jenis_catatan text NOT NULL DEFAULT 'punishment'`);
    console.log('Success');
  } catch (e) {
    console.error(e);
  }
}
main();

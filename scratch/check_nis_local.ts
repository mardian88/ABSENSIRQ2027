import { db } from '../src/db';
import { santri } from '../src/db/schema';
import { sql } from 'drizzle-orm';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';

async function run() {
  const localClient = createClient({ url: 'file:./sqlite.db' });
  const localDb = drizzle(localClient);
  const count = await localDb.select({ count: sql`count(*)` }).from(santri);
  const data = await localDb.select().from(santri).limit(5);
  console.log("Local Total Santri:", count);
  console.log("Local Data sample:", data.map(d => ({ nis: d.nomorInduk, nama: d.namaLengkap })));
}
run();

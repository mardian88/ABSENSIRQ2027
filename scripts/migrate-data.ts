import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '../src/db/schema';
import { db as remoteDb } from '../src/db/index';

// Local DB Client
const localClient = createClient({
  url: 'file:./sqlite.db',
});
const localDb = drizzleLibsql(localClient, { schema });

async function main() {
  console.log("Starting data migration from local SQLite to Turso...");
  
  const tables = [
    'pengaturanHumas',
    'pengaturanHalamanSukses',
    'templatePesan',
    'pengaturanCabang',
    'adminCabang',
    'sesiAbsensi',
    'hariAktifLibur',
    'autoAlpa',
    'kategoriPoin',
    'halaqoh',
    'santri',
    'absensi',
    'poinSantri',
    'perizinanSantri',
    'user',
    'session',
    'account'
  ];

  for (const tableName of tables) {
    const table = (schema as any)[tableName];
    if (table) {
      console.log(`Migrating ${tableName}...`);
      const rows = await localDb.select().from(table);
      if (rows.length > 0) {
        try {
          await remoteDb.insert(table).values(rows).onConflictDoNothing();
          console.log(`Migrated ${rows.length} rows for ${tableName}.`);
        } catch (e: any) {
          console.error(`Error migrating ${tableName}: ${e.message}`);
        }
      } else {
        console.log(`${tableName} is empty.`);
      }
    }
  }
  console.log("Migration complete!");
}

main().catch(console.error);

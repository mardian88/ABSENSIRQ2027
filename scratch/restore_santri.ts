import 'dotenv/config';
import { createClient } from '@libsql/client';

async function run() {
  const localClient = createClient({ url: 'file:./sqlite.db' });
  const tursoClient = createClient({ 
    url: process.env.DATABASE_URL as string, 
    authToken: process.env.DATABASE_AUTH_TOKEN 
  });

  try {
    const res = await localClient.execute('SELECT * FROM santri');
    console.log(`Local santri count: ${res.rows.length}`);
    if (res.rows.length === 0) return;

    // Get all column names from local db
    const cols = res.columns;

    // Clear turso santri just in case
    await tursoClient.execute('DELETE FROM santri');
    console.log('Cleared remote santri table');

    let inserted = 0;
    for (const row of res.rows) {
      // Build insert query
      // Map local columns to values. The new schema has 3 extra columns but we can just insert the existing ones.
      const colNames = cols.join(', ');
      const placeholders = cols.map(() => '?').join(', ');
      const values = cols.map(c => row[c] ?? null);

      await tursoClient.execute({
        sql: `INSERT INTO santri (${colNames}) VALUES (${placeholders})`,
        args: values as any[]
      });
      inserted++;
    }
    
    console.log(`Successfully migrated ${inserted} records back to Turso.`);

  } catch (err) {
    console.error(err);
  }
}
run();

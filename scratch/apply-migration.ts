import 'dotenv/config';
import { createClient } from '@libsql/client';

async function run() {
  const tursoClient = createClient({ 
    url: process.env.DATABASE_URL as string, 
    authToken: process.env.DATABASE_AUTH_TOKEN 
  });

  const sql = `
  CREATE TABLE IF NOT EXISTS \`fonnte_tokens\` (
    \`id\` text PRIMARY KEY NOT NULL,
    \`name\` text NOT NULL,
    \`token\` text NOT NULL,
    \`is_active\` integer DEFAULT 0 NOT NULL,
    \`is_exhausted\` integer DEFAULT 0 NOT NULL,
    \`updated_at\` integer
  );
  `;
  try {
    await tursoClient.execute(sql);
    console.log("Successfully created fonnte_tokens table on Turso");
  } catch(e) {
    console.error(e);
  }
}
run();

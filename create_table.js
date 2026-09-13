require('dotenv').config();
const { createClient } = require('@libsql/client');

async function run() {
  const url = process.env.DATABASE_URL || 'file:./sqlite.db';
  console.log('Connecting to', url);
  const client = createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN
  });
  
  await client.execute(`
    CREATE TABLE IF NOT EXISTS id_card_templates (
      id TEXT PRIMARY KEY,
      tipe TEXT NOT NULL,
      nama TEXT NOT NULL,
      background_url TEXT NOT NULL,
      is_active INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );
  `);
  console.log('Table created successfully');
}
run().catch(console.error);

require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function run() {
  try {
    console.log('Connecting to Turso to reset orphaned id_keluarga...');
    // Because keluarga table was dropped and recreated, it is now empty.
    // Any id_keluarga in the santri table is now orphaned.
    const result = await client.execute(`
      UPDATE santri 
      SET id_keluarga = NULL 
      WHERE id_keluarga IS NOT NULL
    `);
    console.log(`Successfully reset id_keluarga for ${result.rowsAffected} santri.`);
  } catch (error) {
    console.error('Error:', error);
  }
}

run();

const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  try {
    await client.execute(`ALTER TABLE id_card_templates ADD COLUMN layout TEXT`);
    console.log("Added layout column to id_card_templates");
  } catch (e) {
    console.error(e);
  }
}

main();

require('dotenv').config();
const { createClient } = require('@libsql/client');

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN
  });

  try {
    const res = await client.execute("PRAGMA table_info(santri);");
    console.log("Columns in santri:");
    res.rows.forEach(r => console.log(r.name));
  } catch(e) {
    console.error("Error", e);
  }
}

main();

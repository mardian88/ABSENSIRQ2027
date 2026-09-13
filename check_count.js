require('dotenv').config();
const { createClient } = require('@libsql/client');

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.DATABASE_AUTH_TOKEN
  });

  try {
    const res = await client.execute("SELECT COUNT(*) as c FROM keuangan_topup;");
    console.log("Count:", res.rows[0].c);
  } catch(e) {
    console.error("Error", e);
  }
}

main();

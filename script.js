const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN
});

async function run() {
  const result = await client.execute("DELETE FROM log_pesan_manual WHERE status = 'gagal'");
  console.log(`Deleted ${result.rowsAffected} failed logs`);
  client.close();
}
run();

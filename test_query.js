const { createClient } = require('@libsql/client');

async function test() {
  const client = createClient({ url: 'file:sqlite.db' });
  try {
    const result = await client.execute('select "id", "id_santri", "nominal", "metode", "status", "bukti_url", "tanggal_ajuan", "id_admin" from "keuangan_topup"');
    console.log("Success:", result.rows.length);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
test();

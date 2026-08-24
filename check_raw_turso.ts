import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env" });

const client = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function checkRaw() {
  const result = await client.execute(`SELECT tanggal_mulai, waktu_pengajuan FROM perizinan_santri`);
  console.log(result.rows);
}

checkRaw();

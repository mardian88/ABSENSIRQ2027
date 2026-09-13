import { db } from "@/db";
import { pendaftar } from "@/db/schema";
import { desc, ne } from "drizzle-orm";
import { PsbAdminClient } from "./PsbAdminClient";

export const dynamic = "force-dynamic";

export default async function PsbAdminPage() {
  const pendaftarList = await db.select().from(pendaftar).where(ne(pendaftar.status, 'diterima')).orderBy(desc(pendaftar.tanggalDaftar));

  return <PsbAdminClient initialData={pendaftarList} />;
}

export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { halaqoh, semester } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SetoranClient } from "./SetoranClient";

export default async function SetoranPage() {
  const halaqahList = await db.select().from(halaqoh);
  const semesterList = await db.select().from(semester).where(eq(semester.isAktif, true));

  return (
    <div className="p-4 md:p-8 pt-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Input Setoran Tahfidz</h1>
          <p className="text-slate-500 mt-1">Penilaian <em>Khotam Baru</em> (KB) dan <em>Khotam Hafalan</em> (KH) per surah setiap santri.</p>
        </div>
      </div>
      
      <SetoranClient halaqahList={halaqahList} semesterList={semesterList} />
    </div>
  );
}

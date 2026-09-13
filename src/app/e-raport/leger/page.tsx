export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { halaqoh, semester } from "@/db/schema";
import { eq } from "drizzle-orm";
import { LegerClient } from "./LegerClient";

export default async function LegerPage() {
  const halaqahList = await db.select().from(halaqoh);
  const semesterList = await db.select().from(semester).where(eq(semester.isAktif, true));

  return (
    <div className="p-4 md:p-8 pt-6 space-y-6 max-w-7xl mx-auto print:p-0 print:m-0 print:max-w-none">
      <div className="flex items-center justify-between border-b pb-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leger & Print Raport</h1>
          <p className="text-slate-500 mt-1">Rekapitulasi nilai akhir dan cetak Raport Santri ke dalam format PDF/Kertas.</p>
        </div>
      </div>
      
      <LegerClient halaqahList={halaqahList} semesterList={semesterList} />
    </div>
  );
}

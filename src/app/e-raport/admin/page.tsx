export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminInputClient } from "./AdminInputClient";
import { db } from "@/db";
import { halaqoh, semester } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminInputPage() {
  const halaqahList = await db.select().from(halaqoh);
  const semesterList = await db.select().from(semester).where(eq(semester.isAktif, true));

  return (
    <div className="p-4 md:p-8 pt-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Input Nilai Admin</h1>
          <p className="text-slate-500 mt-1">Input nilai Akhlak, Kedisiplinan, Kognitif (Tahsin & UAS), dan Kehadiran.</p>
        </div>
      </div>
      
      <AdminInputClient halaqahList={halaqahList} semesterList={semesterList} />
    </div>
  );
}

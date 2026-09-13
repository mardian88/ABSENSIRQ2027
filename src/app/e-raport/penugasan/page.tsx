export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { halaqoh, guru } from "@/db/schema";
import { PenugasanGuruClient } from "./PenugasanGuruClient";

export default async function PenugasanGuruPage() {
  const halaqahList = await db.select().from(halaqoh);
  const guruList = await db.select().from(guru);

  return (
    <div className="p-4 md:p-8 pt-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tugas Guru</h1>
          <p className="text-slate-500 mt-1">Assign peran guru (Pengampu Utama/Pendamping) di Halaqah untuk penilaian.</p>
        </div>
      </div>
      
      <PenugasanGuruClient guruList={guruList} halaqahList={halaqahList} />
    </div>
  );
}

export const dynamic = 'force-dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { halaqoh } from "@/db/schema";
import { SurahSantriClient } from "./SurahSantriClient";
import { getAllSurah } from "./actions";

export default async function SurahSantriPage() {
  const halaqahList = await db.select().from(halaqoh);
  const surahList = await getAllSurah();

  return (
    <div className="p-4 md:p-8 pt-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Tugas Surah Santri</h1>
          <p className="text-slate-500 mt-1">Assign target hafalan surah untuk masing-masing santri.</p>
        </div>
      </div>
      
      <SurahSantriClient halaqahList={halaqahList} surahList={surahList} />
    </div>
  );
}

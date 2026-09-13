"use client";

import { useState } from "react";
import { BookOpen } from "lucide-react";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getMutabaahColumns } from "./columns";

export function MutabaahAdminClient({ data }: { data: any[] }) {
  const [search, setSearch] = useState("");

  const filtered = data.filter(d => 
    d.namaSantri.toLowerCase().includes(search.toLowerCase()) || 
    (d.namaHalaqoh && d.namaHalaqoh.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Mutabaah</h1>
          <p className="text-slate-500">Pantau rekapitulasi capaian hafalan dan mengaji seluruh santri.</p>
        </div>
      </div>

      <DataTable
        columns={getMutabaahColumns()}
        data={data}
        searchKey="namaSantri"
      />
    </div>
  );
}

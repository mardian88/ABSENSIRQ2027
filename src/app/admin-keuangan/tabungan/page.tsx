export const dynamic = "force-dynamic";
import { TabunganClient } from "./TabunganClient";

export default function TabunganPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Tabungan Santri</h1>
        <p className="text-slate-500 mt-1">Kelola data setor dan tarik tabungan santri secara terpusat.</p>
      </div>

      <TabunganClient />
    </div>
  );
}


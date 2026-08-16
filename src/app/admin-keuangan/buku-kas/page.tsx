import { BukuKasClient } from "./BukuKasClient";

export default function BukuKasPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Buku Kas (Ledger)</h1>
        <p className="text-slate-500 mt-1">Pencatatan terpusat untuk arus kas operasional masuk dan keluar.</p>
      </div>

      <BukuKasClient />
    </div>
  );
}

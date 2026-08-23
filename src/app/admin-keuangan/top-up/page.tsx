export const dynamic = "force-dynamic";
import { getTopupList } from "./actions";
import { TopupClient } from "./TopupClient";

export default async function TopupPage() {
  const initialData = await getTopupList();

  const pendingCount = initialData.filter(d => d.status === 'pending').length;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Verifikasi Top-Up</h1>
        <p className="text-slate-500 mt-1">Kelola permohonan pengisian saldo tabungan santri dari orang tua.</p>
      </div>

      <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-orange-800 font-semibold text-lg">Menunggu Verifikasi</h2>
          <p className="text-orange-600 text-sm">Ada {pendingCount} permohonan top-up yang membutuhkan persetujuan Anda.</p>
        </div>
      </div>

      <TopupClient initialData={initialData} />
    </div>
  );
}


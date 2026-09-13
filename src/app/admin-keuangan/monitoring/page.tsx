export const dynamic = "force-dynamic";
import { getMonitoringData } from "./actions";
import { MonitoringClient } from "./MonitoringClient";
import { BarChart3 } from "lucide-react";

export const metadata = {
  title: "Monitoring Keuangan | Admin",
};

export default async function MonitoringPage() {
  const { tagihan, dataSantri, totalKasBulanIni, totalInfaqBulanIni } = await getMonitoringData();

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-600" />
            Monitoring Pembayaran
          </h1>
          <p className="text-slate-500 mt-1">Pantau riwayat pembayaran KAS, Infaq, dan tagihan lainnya per santri</p>
        </div>
      </div>

      <MonitoringClient 
        tagihanList={tagihan} 
        santriList={dataSantri} 
        totalKasBulanIni={totalKasBulanIni} 
        totalInfaqBulanIni={totalInfaqBulanIni} 
      />
    </div>
  );
}


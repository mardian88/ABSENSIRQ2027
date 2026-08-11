import { getOrtuSession } from "@/app/portal-ortu/actions";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { infaqRecords, kasRecords, topupRequests, transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { formatRp, getMonthName } from "@/lib/utils";
import { TopupForm } from "./TopupForm";
import { Button } from "@/components/ui/button";
import { TopupHistoryClient } from "@/components/TopupHistoryClient";
// import { autoCancelExpiredTopups } from "@/actions/admin-actions"; // We will mock or skip this for now since it belongs to admin

export default async function ParentKeuanganPage() {
  const santri = await getOrtuSession();
  if (!santri) {
    redirect("/portal-ortu/login");
  }

  // Ambil record terakhir infaq dan kas
  const lastInfaq = await db.query.infaqRecords.findFirst({
    where: eq(infaqRecords.santriId, santri.id),
    orderBy: [desc(infaqRecords.year), desc(infaqRecords.month)]
  });

  const lastKas = await db.query.kasRecords.findFirst({
    where: eq(kasRecords.santriId, santri.id),
    orderBy: [desc(kasRecords.year), desc(kasRecords.month)]
  });

  // Ambil history top up
  const history = await db.query.topupRequests.findMany({
    where: eq(topupRequests.santriId, santri.id),
    orderBy: [desc(topupRequests.createdAt)],
    limit: 10
  });

  // Ambil mutasi transaksi (semua jenis pengeluaran/pemasukan santri)
  const mutasi = await db.query.transactions.findMany({
    where: eq(transactions.santriId, santri.id),
    orderBy: [desc(transactions.createdAt)],
    limit: 15
  });

  const infaqText = lastInfaq ? `Lunas s.d. ${getMonthName(lastInfaq.month)} ${lastInfaq.year}` : "Belum ada pembayaran";
  const kasText = lastKas ? `Lunas s.d. ${getMonthName(lastKas.month)} ${lastKas.year}` : "Belum ada pembayaran";

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* Header Apps */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/><path d="M12 14c-4.42 0-8 3.58-8 8h16c0-4.42-3.58-8-8-8z"/></svg>
            </div>
            <h1 className="font-bold text-slate-800">Keuangan Santri</h1>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-6 mt-4">
        {/* Profile Card */}
        <div className="sticky top-[72px] z-10 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/20">
          <div className="flex items-center gap-2 mb-1">
            <a href="/portal-ortu" className="bg-white/10 hover:bg-white/20 p-1 rounded-md transition-colors mr-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            </a>
            <p className="text-emerald-100 text-sm">Nama Santri</p>
          </div>
          <h2 className="text-2xl font-bold mb-6">{santri.namaLengkap}</h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/20">
              <p className="text-emerald-100 text-xs mb-1">Saldo Utama</p>
              <p className="text-xl font-extrabold tracking-tight">{formatRp(santri.walletBalance)}</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm border border-white/20">
              <p className="text-emerald-100 text-xs mb-1">Total Tabungan</p>
              <p className="text-xl font-extrabold tracking-tight">{formatRp(santri.savingsBalance)}</p>
            </div>
          </div>
        </div>

        {/* Status Pembayaran */}
        <div className="grid grid-cols-2 gap-4">
          <Card className={`border ${lastInfaq ? 'border-emerald-200 bg-emerald-50/50' : 'border-slate-200 bg-slate-50'} shadow-sm transition-all`}>
            <CardHeader className="pb-1 pt-4 px-4">
              <div className="flex items-center gap-2 mb-1">
                {lastInfaq ? (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                )}
                <CardDescription className={`text-xs font-bold ${lastInfaq ? 'text-emerald-700' : 'text-slate-500'} uppercase tracking-wider`}>Infaq</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={`text-sm font-bold ${lastInfaq ? 'text-emerald-950' : 'text-slate-600'}`}>{infaqText}</p>
            </CardContent>
          </Card>
          
          <Card className={`border ${lastKas ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200 bg-slate-50'} shadow-sm transition-all`}>
            <CardHeader className="pb-1 pt-4 px-4">
              <div className="flex items-center gap-2 mb-1">
                {lastKas ? (
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </div>
                )}
                <CardDescription className={`text-xs font-bold ${lastKas ? 'text-blue-700' : 'text-slate-500'} uppercase tracking-wider`}>Kas</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className={`text-sm font-bold ${lastKas ? 'text-blue-950' : 'text-slate-600'}`}>{kasText}</p>
            </CardContent>
          </Card>
        </div>

        {/* Top Up Form */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 p-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
              Pengisian Saldo (Top Up)
            </h3>
            <p className="text-xs text-slate-500 mt-1">Pengajuan pengisian saldo via WhatsApp</p>
          </div>
          <CardContent className="p-4">
            <TopupForm santriId={santri.id} santriName={santri.namaLengkap} santriNis={santri.nomorInduk} />
          </CardContent>
        </Card>

        {/* Mutasi Transaksi */}
        <div>
          <h3 className="font-bold text-slate-800 mb-4 px-1">Mutasi Transaksi</h3>
          <Card className="border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              {mutasi.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">Belum ada transaksi.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {mutasi.map((trx) => (
                    <div key={trx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          trx.amount > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {trx.amount > 0 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5"/><path d="m5 12 7-7 7 7"/></svg>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-800 capitalize">
                            {trx.type === 'topup' ? 'Isi Saldo Tabungan' : 
                             trx.type === 'wallet_topup' ? 'Isi Saldo Utama' :
                             trx.type === 'kas' ? 'Bayar Uang Kas' : 
                             trx.type === 'infaq' ? 'Bayar Infaq' : 
                             trx.type === 'saving' ? 'Setor/Tarik Tabungan' : 
                             trx.type}
                          </p>
                          <p className="text-xs text-slate-500">{new Date(trx.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                      </div>
                      <div className={`font-bold text-sm whitespace-nowrap ${trx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {trx.amount > 0 ? '+' : ''}{formatRp(trx.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Riwayat Top Up */}
        <div>
          <h3 className="font-bold text-slate-800 mb-4 px-1">Riwayat Pengajuan Top Up</h3>
          <TopupHistoryClient history={history} santriName={santri.namaLengkap} santriNis={santri.nomorInduk} />
        </div>
      </main>
    </div>
  );
}

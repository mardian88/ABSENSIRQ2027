import { db } from "@/db";
import { keuanganKas, keuanganTabungan, keuanganBukuKas, keuanganTopup, santri } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { Wallet, Coins, FileText, CheckCircle2, UserCheck, UserMinus, BookOpen, ClipboardList, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default async function AdminKeuanganPage() {
  // Aggregate data
  const totalKasBulanan = await db.select({
    total: sql<number>`COALESCE(SUM(${keuanganKas.nominal}), 0)`
  }).from(keuanganKas).where(eq(keuanganKas.status, 'lunas'));

  const totalTabungan = await db.select({
    total: sql<number>`COALESCE(SUM(${santri.saldoTabungan}), 0)`
  }).from(santri);

  const pendingTopup = await db.select({
    count: sql<number>`count(*)`
  }).from(keuanganTopup).where(eq(keuanganTopup.status, 'pending'));

  const totalMasuk = await db.select({
    total: sql<number>`COALESCE(SUM(${keuanganBukuKas.nominal}), 0)`
  }).from(keuanganBukuKas).where(eq(keuanganBukuKas.jenis, 'pemasukan'));

  const totalKeluar = await db.select({
    total: sql<number>`COALESCE(SUM(${keuanganBukuKas.nominal}), 0)`
  }).from(keuanganBukuKas).where(eq(keuanganBukuKas.jenis, 'pengeluaran'));

  const saldoKasUmum = (totalMasuk[0]?.total || 0) - (totalKeluar[0]?.total || 0);

  const stats = [
    { label: "Total Saldo Tabungan", value: `Rp ${new Intl.NumberFormat('id-ID').format(totalTabungan[0]?.total || 0)}`, icon: Wallet, color: "bg-emerald-500" },
    { label: "Pemasukan Kas (Iuran)", value: `Rp ${new Intl.NumberFormat('id-ID').format(totalKasBulanan[0]?.total || 0)}`, icon: Coins, color: "bg-teal-500" },
    { label: "Saldo Buku Kas Umum", value: `Rp ${new Intl.NumberFormat('id-ID').format(saldoKasUmum)}`, icon: FileText, color: "bg-cyan-600" },
    { label: "Top-Up Tertunda", value: `${pendingTopup[0]?.count || 0} Ajuan`, icon: CheckCircle2, color: "bg-orange-500" },
  ];

  const menus = [
    { name: "Pembayaran (Kas)", href: "/admin-keuangan/pembayaran", icon: Coins, desc: "Kelola iuran santri bulanan" },
    { name: "Buku Kas Umum", href: "/admin-keuangan/buku-kas", icon: FileText, desc: "Arus kas masuk & keluar" },
    { name: "Top-Up Saldo", href: "/admin-keuangan/top-up", icon: CheckCircle2, desc: "Verifikasi top-up orang tua" },
    { name: "Tabungan Santri", href: "/admin-keuangan/tabungan", icon: UserCheck, desc: "Kelola setor dan tarik saldo tabungan" },
    { name: "Kebutuhan Santri", href: "/admin-keuangan/katalog", icon: BookOpen, desc: "Katalog barang & pesanan" },
    { name: "Monitoring Infaq", href: "/admin-keuangan/infaq", icon: ClipboardList, desc: "Status lunas kalender infaq" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Keuangan</h1>
        <p className="text-slate-500 mt-1">Ringkasan transaksi dan navigasi cepat manajemen keuangan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className={`${s.color} p-4 rounded-xl text-white shadow-inner`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{s.label}</p>
                <p className="text-2xl font-bold text-slate-800">{s.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Navigasi Keuangan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {menus.map((m, i) => {
            const Icon = m.icon;
            return (
              <Link key={i} href={m.href} className="group block bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                </div>
                <h3 className="font-semibold text-slate-800">{m.name}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{m.desc}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

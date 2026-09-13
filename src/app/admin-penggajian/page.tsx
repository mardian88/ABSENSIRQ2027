import { redirect } from "next/navigation";
import { AdminPenggajianClient } from "./AdminPenggajianClient";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdminPenggajianPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-700 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-bold">Laporan Penggajian & Kafalah</h1>
          <p className="text-emerald-100 mt-1">Rekap perhitungan kafalah guru berdasarkan tingkat kehadiran.</p>
        </div>
      </div>

      <AdminPenggajianClient />
    </div>
  );
}

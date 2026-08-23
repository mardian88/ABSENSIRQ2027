export const dynamic = "force-dynamic";
import { getKatalogOrtu, getRiwayatPesananOrtu } from "./actions";
import KebutuhanOrtuClient from "./KebutuhanOrtuClient";
import { cookies } from "next/headers";
import { db } from "@/db";
import { santri } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata = {
  title: "Kebutuhan Santri | Portal Wali Santri",
};

export default async function KebutuhanOrtuPage() {
  const c = await cookies();
  const santriId = c.get("ortu_session")?.value || "";

  // Ambil saldo tabungan langsung dari tabel santri
  let totalSaldo = 0;
  if (santriId) {
    const santriData = await db.select({ saldo: santri.saldoTabungan }).from(santri).where(eq(santri.id, santriId));
    totalSaldo = santriData[0]?.saldo || 0;
  }

  const [katalogRes, riwayatRes] = await Promise.all([
    getKatalogOrtu(),
    getRiwayatPesananOrtu()
  ]);

  const katalog = katalogRes.success && Array.isArray(katalogRes.data) ? katalogRes.data : [];
  const riwayat = riwayatRes.success && Array.isArray(riwayatRes.data) ? riwayatRes.data : [];

  return <KebutuhanOrtuClient katalog={katalog} riwayatPesanan={riwayat} saldo={totalSaldo} />;
}


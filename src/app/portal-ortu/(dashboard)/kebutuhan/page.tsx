export const dynamic = "force-dynamic";
import { getKatalogOrtu, getRiwayatPesananOrtu } from "./actions";
import KebutuhanOrtuClient from "./KebutuhanOrtuClient";
import { getOrtuSession } from "../../actions";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { santri } from "@/db/schema";
import { eq } from "drizzle-orm";

export const metadata = {
  title: "Kebutuhan Santri | Portal Wali Santri",
};

export default async function KebutuhanOrtuPage() {
  const profil = await getOrtuSession();
  if (!profil) {
    redirect("/portal-ortu/login");
  }
  const santriId = profil.id;

  // Ambil saldo tabungan langsung dari tabel santri
  let totalSaldo = profil.saldoTabungan || 0;

  const [katalogRes, riwayatRes] = await Promise.all([
    getKatalogOrtu(),
    getRiwayatPesananOrtu()
  ]);

  const katalog = katalogRes.success && Array.isArray(katalogRes.data) ? katalogRes.data : [];
  const riwayat = riwayatRes.success && Array.isArray(riwayatRes.data) ? riwayatRes.data : [];

  return <KebutuhanOrtuClient katalog={katalog} riwayatPesanan={riwayat} saldo={totalSaldo} />;
}


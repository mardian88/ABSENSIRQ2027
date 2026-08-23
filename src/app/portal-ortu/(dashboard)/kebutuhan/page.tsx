export const dynamic = "force-dynamic";
import { getKatalogOrtu, getRiwayatPesananOrtu } from "./actions";
import KebutuhanOrtuClient from "./KebutuhanOrtuClient";
import { cookies } from "next/headers";
import { db } from "@/db";
import { keuanganTabungan } from "@/db/schema";
import { eq, sum } from "drizzle-orm";

export const metadata = {
  title: "Kebutuhan Santri | Portal Wali Santri",
};

export default async function KebutuhanOrtuPage() {
  const c = await cookies();
  const sessionData = c.get("ortu_session")?.value;
  let santriId = "";
  if (sessionData) {
    try {
      const data = JSON.parse(sessionData);
      santriId = data.id;
    } catch {}
  }

  // Hitung saldo tabungan untuk keperluan "berbayar"
  let totalSaldo = 0;
  if (santriId) {
    const tabunganList = await db.select().from(keuanganTabungan).where(eq(keuanganTabungan.idSantri, santriId));
    tabunganList.forEach(t => {
      if (t.jenis === 'setor' || t.jenis === 'topup') totalSaldo += t.nominal;
      else if (t.jenis === 'tarik' || t.jenis === 'belanja') totalSaldo -= t.nominal;
    });
  }

  const [katalogRes, riwayatRes] = await Promise.all([
    getKatalogOrtu(),
    getRiwayatPesananOrtu()
  ]);

  const katalog = katalogRes.success && Array.isArray(katalogRes.data) ? katalogRes.data : [];
  const riwayat = riwayatRes.success && Array.isArray(riwayatRes.data) ? riwayatRes.data : [];

  return <KebutuhanOrtuClient katalog={katalog} riwayatPesanan={riwayat} saldo={totalSaldo} />;
}


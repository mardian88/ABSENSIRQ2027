export const dynamic = "force-dynamic";
import { getKatalogAdmin, getPesananMasuk } from "./actions";
import KatalogAdminClient from "./KatalogAdminClient";

export const metadata = {
  title: "Kebutuhan Santri | Admin Keuangan",
};

export default async function KatalogAdminPage() {
  const [katalogRes, pesananRes] = await Promise.all([
    getKatalogAdmin(),
    getPesananMasuk()
  ]);

  const katalog = katalogRes.success && Array.isArray(katalogRes.data) ? katalogRes.data : [];
  const pesanan = pesananRes.success && Array.isArray(pesananRes.data) ? pesananRes.data : [];

  return <KatalogAdminClient initialKatalog={katalog} initialPesanan={pesanan} />;
}


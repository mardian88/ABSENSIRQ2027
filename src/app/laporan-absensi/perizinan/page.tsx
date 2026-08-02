import { getDaftarPerizinan } from "./actions";
import { LaporanPerizinanClient } from "./LaporanPerizinanClient";

export default async function LaporanPerizinanPage() {
  // Fetch initial data (default: semua)
  const data = await getDaftarPerizinan("semua");

  return <LaporanPerizinanClient initialData={data} />;
}

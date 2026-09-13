import { getLaporanAbsensi } from "./actions";
import { LaporanClient } from "./LaporanClient";

export const dynamic = "force-dynamic";

export default async function LaporanAbsensiPage() {
  // Ambil data default: hari ini
  const initialData = await getLaporanAbsensi("hari_ini");

  return <LaporanClient initialData={initialData} />;
}

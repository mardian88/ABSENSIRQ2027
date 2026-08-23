export const dynamic = "force-dynamic";
import { getKeuanganData } from "./actions";
import { KeuanganOrtuClient } from "./KeuanganClient";

export default async function KeuanganOrtuPage() {
  const data = await getKeuanganData();

  return <KeuanganOrtuClient data={data} />;
}


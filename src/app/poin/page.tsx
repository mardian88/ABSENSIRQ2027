import { getRekapPoinSantri } from "./actions";
import { PoinDashboardClient } from "./PoinDashboardClient";

export const dynamic = "force-dynamic";

export default async function PoinPage() {
  const data = await getRekapPoinSantri();
  
  return <PoinDashboardClient data={data} />;
}

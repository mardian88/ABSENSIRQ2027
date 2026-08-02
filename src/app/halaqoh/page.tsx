import { getHalaqohList } from "./actions";
import { HalaqohClient } from "./HalaqohClient";

export const dynamic = "force-dynamic";

export default async function HalaqohPage() {
  const data = await getHalaqohList();

  return <HalaqohClient initialData={data} />;
}

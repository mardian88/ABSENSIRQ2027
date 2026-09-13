import { getProgressMutabaahAdmin } from "./actions";
import { ProgressClient } from "./ProgressClient";

export const dynamic = "force-dynamic";

export default async function ProgressMutabaahPage() {
  const res = await getProgressMutabaahAdmin();
  return <ProgressClient data={res.data || []} />;
}

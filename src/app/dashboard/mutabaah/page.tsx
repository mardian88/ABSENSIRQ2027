import { getSemuaMutabaahAdmin } from "./actions";
import { MutabaahAdminClient } from "./MutabaahAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminMutabaahPage() {
  const res = await getSemuaMutabaahAdmin();
  return <MutabaahAdminClient data={res.data || []} />;
}

import { getGuruList } from "./actions";
import { AdminGuruClient } from "./AdminGuruClient";

export const dynamic = "force-dynamic";

export default async function AdminGuruPage() {
  const data = await getGuruList();
  return <AdminGuruClient initialData={data} />;
}

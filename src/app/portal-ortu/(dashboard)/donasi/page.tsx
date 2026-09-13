export const dynamic = "force-dynamic";
import { getProgramDonasiAktif } from "./actions";
import DonasiOrtuClient from "./DonasiOrtuClient";

export default async function DonasiPage() {
  const res = await getProgramDonasiAktif();
  const programs = res.success ? res.data : [];

  return <DonasiOrtuClient initialPrograms={programs || []} />;
}



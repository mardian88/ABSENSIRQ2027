import { redirect } from "next/navigation";
import { getGuruDashboardData, logoutGuru } from "./actions";
import { PortalGuruClient } from "./PortalGuruClient";

export const dynamic = "force-dynamic";

export default async function PortalGuruPage() {
  const data = await getGuruDashboardData();
  
  if (!data) {
    redirect("/portal-guru/login");
  }

  return <PortalGuruClient initialData={data} />;
}

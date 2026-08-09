import { getOrtuSession, getRiwayatIzin, getMutabaahOrtuData } from "../actions";
import { DashboardOrtuClient } from "./DashboardOrtuClient";

export const dynamic = "force-dynamic";

export default async function PortalOrtuDashboard() {
  const profil = await getOrtuSession();
  
  if (!profil) {
    return null;
  }

  // Fetch some summary data
  const izinData = await getRiwayatIzin(profil.id);
  const mutabaahData = await getMutabaahOrtuData();
  
  return <DashboardOrtuClient profil={profil} izinData={izinData} mutabaahData={mutabaahData} />;
}

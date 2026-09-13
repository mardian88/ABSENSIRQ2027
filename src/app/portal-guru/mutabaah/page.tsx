import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getGuruDashboardData } from "../actions";
import { MutabaahGuruClient } from "./MutabaahGuruClient";
import { getSantriHalaqohGuru, getRiwayatMutabaahGuru } from "./actions";

export const dynamic = "force-dynamic";

export default async function MutabaahGuruPage() {
  const c = await cookies();
  const guruId = c.get("guru_session")?.value;
  if (!guruId) {
    redirect("/portal-guru/login");
  }

  const [guruData, listSantri, riwayatData] = await Promise.all([
    getGuruDashboardData(),
    getSantriHalaqohGuru(),
    getRiwayatMutabaahGuru()
  ]);

  if (!guruData) {
    redirect("/portal-guru/login");
  }

  return (
    <MutabaahGuruClient 
      profil={guruData.profil} 
      listSantri={listSantri.data || []} 
      riwayat={riwayatData.data || []} 
    />
  );
}

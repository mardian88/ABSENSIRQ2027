import { redirect } from "next/navigation";
import { getMutabaahOrtuData } from "../../actions";
import { MutabaahOrtuClient } from "./MutabaahOrtuClient";

export const dynamic = "force-dynamic";

export default async function MutabaahOrtuPage() {
  const data = await getMutabaahOrtuData();

  if (!data || !data.profil) {
    redirect("/portal-ortu/login");
  }

  return (
    <MutabaahOrtuClient 
      profil={data.profil} 
      riwayat={data.riwayat} 
    />
  );
}

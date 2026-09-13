import { getOrtuSession } from "../../actions";
import { redirect } from "next/navigation";
import { ProfilClient } from "./ProfilClient";
import { db } from "@/db";
import { santri } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function ProfilOrtuPage() {
  const profil = await getOrtuSession();
  
  if (!profil) {
    redirect("/portal-ortu/login");
  }

  const [santriData] = await db.select().from(santri).where(eq(santri.id, profil.id));

  return <ProfilClient profil={profil} santriData={santriData} />;
}

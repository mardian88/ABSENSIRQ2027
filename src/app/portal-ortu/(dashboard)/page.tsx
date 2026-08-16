import { getOrtuSession } from "../actions";
import { getKeuanganData } from "./keuangan/actions";
import { db } from "@/db";
import { pengumumanPortal, notifikasiPortal } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { DashboardOrtuClient } from "./DashboardOrtuClient";

export const dynamic = "force-dynamic";

export default async function PortalOrtuDashboard() {
  const profil = await getOrtuSession();
  
  if (!profil) {
    return null;
  }

  // Fetch financial data for the dashboard cards
  const keuangan = await getKeuanganData();

  // Fetch active announcements
  const pengumuman = await db.select()
    .from(pengumumanPortal)
    .where(eq(pengumumanPortal.isAktif, true))
    .orderBy(desc(pengumumanPortal.tanggal));
    
  // Fetch specific notifications for this santri
  const notifikasi = await db.select()
    .from(notifikasiPortal)
    .where(eq(notifikasiPortal.idSantri, profil.id))
    .orderBy(desc(notifikasiPortal.tanggal));
  
  return <DashboardOrtuClient profil={profil} keuangan={keuangan} pengumuman={pengumuman} notifikasi={notifikasi} />;
}

export const dynamic = "force-dynamic";
import { getDetailProgramDonasi } from "../actions";
import DonasiDetailClient from "./DonasiDetailClient";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { santri } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getOrtuSession } from "../../../actions";

export default async function DonasiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profil = await getOrtuSession();
  
  if (!profil) {
    redirect("/portal-ortu/login");
  }

  const idSantri = profil.id;

  const res = await getDetailProgramDonasi(id);
  if (!res.success || !res.data) {
    return <div className="p-8 text-center text-slate-500">Program tidak ditemukan: {res.message}</div>;
  }

  return <DonasiDetailClient program={res.data} donaturs={res.donaturs || []} idSantri={idSantri} namaSantri={profil.namaLengkap} />;
}


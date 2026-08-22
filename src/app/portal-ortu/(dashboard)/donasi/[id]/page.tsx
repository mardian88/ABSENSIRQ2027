import { getDetailProgramDonasi } from "../actions";
import DonasiDetailClient from "./DonasiDetailClient";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { santri } from "@/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export default async function DonasiDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionValue = cookieStore.get("ortu_session")?.value;
  
  if (!sessionValue) {
    redirect("/portal-ortu/login");
  }

  const idSantri = sessionValue;

  const sArr = await db.select().from(santri).where(eq(santri.id, idSantri));
  if(sArr.length === 0) redirect("/portal-ortu/login");

  const res = await getDetailProgramDonasi(id);
  if (!res.success || !res.data) {
    return <div className="p-8 text-center text-slate-500">Program tidak ditemukan: {res.message}</div>;
  }

  return <DonasiDetailClient program={res.data} donaturs={res.donaturs || []} idSantri={idSantri} namaSantri={sArr[0].namaLengkap} />;
}


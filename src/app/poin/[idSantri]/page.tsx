import { getRiwayatPoin, getKategoriPoin } from "../actions";
import { PoinDetailClient } from "./PoinDetailClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PoinDetailPage({ params }: { params: Promise<{ idSantri: string }> }) {
  const resolvedParams = await params;
  const [data, kategori] = await Promise.all([
    getRiwayatPoin(resolvedParams.idSantri),
    getKategoriPoin()
  ]);

  if (!data) {
    redirect("/poin");
  }

  return <PoinDetailClient initialData={data} kategoriPoin={kategori} />;
}

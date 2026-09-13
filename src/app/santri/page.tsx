import { getSantriList, getHalaqohList } from "./actions";
import { getSesiAbsensiList } from "../pengaturan/actions";
import { SantriClient } from "./SantriClient";

export const dynamic = "force-dynamic";

export default async function SantriPage() {
  const santriList = await getSantriList();
  const halaqohList = await getHalaqohList();
  const sesiList = await getSesiAbsensiList();

  return <SantriClient santriList={santriList} halaqohList={halaqohList} sesiList={sesiList} />;
}

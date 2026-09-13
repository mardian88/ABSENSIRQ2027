import { getSantriForManualAbsen } from "../actions";
import { ManualAbsenClient } from "./ManualAbsenClient";

export const dynamic = "force-dynamic";

export default async function AbsensiManualPage() {
  const data = await getSantriForManualAbsen();
  
  return <ManualAbsenClient initialData={data} />;
}

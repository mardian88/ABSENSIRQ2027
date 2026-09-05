import { getRaportData } from "./actions"
import RaportClient from "./RaportClient"

export const metadata = {
  title: "Raport Santri - Sistem Absensi RQM",
}

export const dynamic = 'force-dynamic'

export default async function RaportSantriPage() {
  const data = await getRaportData()
  
  return <RaportClient data={data} />
}

import { getSesiOptions, getSantriBelumHadir } from "./actions";
import { BelumHadirClient } from "./BelumHadirClient";

export const dynamic = "force-dynamic";

export default async function BelumHadirPage() {
  const sesiOptions = await getSesiOptions();

  // Determine current active session
  const now = new Date();
  // Using WIB timezone
  const dateFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false });
  // The format will be something like "14:30"
  const currentTimeStr = dateFormatter.format(now).replace('24:', '00:');
  
  let initialSesiId = sesiOptions.length > 0 ? sesiOptions[0].id : undefined;
  
  for (let i = 0; i < sesiOptions.length; i++) {
    const sesi = sesiOptions[i];
    const nextSesi = i < sesiOptions.length - 1 ? sesiOptions[i + 1] : null;
    
    if (sesi.jamMulai && currentTimeStr >= sesi.jamMulai) {
      if (!nextSesi || (nextSesi.jamMulai && currentTimeStr < nextSesi.jamMulai)) {
        initialSesiId = sesi.id;
        break;
      }
    }
  }

  const initialData = await getSantriBelumHadir(initialSesiId);

  return (
    <BelumHadirClient 
      initialData={initialData} 
      sesiOptions={sesiOptions} 
      initialSesiId={initialSesiId} 
    />
  );
}

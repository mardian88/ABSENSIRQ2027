"use server";

import { getRekapPoinSantri } from "../poin/actions";

export async function getDashboardPoin() {
  const rekap = await getRekapPoinSantri();
  
  // rekap is already sorted by totalPoin descending
  const top3 = rekap.slice(0, 3);
  
  // copy and sort ascending
  const bottom3 = [...rekap].sort((a, b) => a.totalPoin - b.totalPoin).slice(0, 3);

  return { top3, bottom3 };
}

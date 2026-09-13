import { db } from "../src/db";
import { surahMaster } from "../src/db/schema";
import { v4 as uuidv4 } from "uuid";

async function run() {
  console.log("Seeding 114 Surah...");
  try {
    const res = await fetch("https://equran.id/api/v2/surat");
    const data: any = await res.json();
    
    if (data.code === 200 && data.data) {
      const inserts = data.data.map((s: any) => ({
        id: uuidv4(),
        juz: s.nomor, // Just as a placeholder for now, since this API doesn't have juz array per surah cleanly mapped to 1 integer
        nomorSurah: s.nomor,
        namaSurah: s.namaLatin,
        namaArab: s.nama,
        jumlahAyat: s.jumlahAyat,
        tipe: s.tempatTurun === "Mekah" ? "Makkiyah" : "Madaniyah",
        urutanDalamJuz: 1, // Placeholder
        isAktif: true
      }));

      // In real scenario we might need better juz mapping, but for now just seed the 114 surahs.
      for (const item of inserts) {
        await db.insert(surahMaster).values(item);
      }
      console.log("Successfully seeded 114 surahs.");
    }
  } catch (error) {
    console.error("Failed to seed surah", error);
  }
}

run();

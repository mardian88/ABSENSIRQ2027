import "dotenv/config";
import { db } from "../src/db";
import { santri, halaqoh } from "../src/db/schema";
import { eq, like, sql, isNull } from "drizzle-orm";

const rawData = `
- [Belum ada halaqah]: (Kosong)
- [Halaqah 1 Siang Ummi]: Adhitama Elvan Efendi, Akhtar Alfa Rejeki Gumilar, Aneska Jennaira Subagja, Aqilla Azzahra Oktaviani, Ar Sakha Putra Al Jabbar, Arsalan Ghazal Nabhani, Epica Drebya, Izqian Abqory Dhiaulhaq, Keysha Atthaya Fatarani, Mochammad Rakhaa Supanji, Muhammad Abidzar Al Ghifari, Nadil Muhammad Al-Jabbar, Rafasya Athoillah Abqaru Zain, Taqy Muhammad Qail
- [Halaqah 1 Sore Sayid]: Agam Raditya Pratama, Arvino jalu putra, Azella humaira arsyila, Fathir muhamad firzatulah, Gavan Faiz Abdillah, Muhammad Rizki Febriyansyah, Nada nadia kamaira, Rafasya purnama mulya, Raja Ramdan Maulana, Ahmad Rasyid Nurrakim
- [Halaqah 2 Siang Najwa]: Abizar Rafif Ashari, Akmal Umar Raiq, Aluna Syafa Raqqilla, Azhar Rizaldi, BINAR LITUHAYU ABHITAH, Dihan Fadillah, Embun Kasturi, Kafeel Ravindra Kusumah, Khalid Rasyid Al Bakti, Lutfhi Adhari Syahputra, Mahendra Yusuf Nugraha, Mahreen Ataya Haziqah Ramadhani, Najwa Khairunnisa Salsabila, Nazneen Alfathunnisa Aretha, Sakura Faiz Kayyisa
- [Halaqah 2 Sore Ummi]: Adzriel Rafif Fakhri, Aldevaro Rashdan Naruna, Althallea Faradiba Nur Fauziyah (Xi), Alvis Fadhil Aydinrahmani, Azalea Quinsha Nabila, Erqisya Fatma Malik Ramadhani, Kenzie Sagara Rahman, Khairul Azzam, Mikhayla Alesha Nugraha, Muhammad Adzwar Adzhani, Muhammad Al Fatih, Muhammad Aqsha Syazwan, Muhammad Arsyad Al Fathir, Muhammad Fariz Abiyyu Munif, Muhammad Jasin Al Fatih, Salwa Putri Rahmadhani
- [Halaqah 3 Sore Teh Nazwa ]: Althaf Adelard Ardhani Ihsan, Atqiya, Bilal Mirza Ramadhan, Elgryansyah Fathan Malik Asmofie, Habna Millata Khairan, Mentari Alya Rengganis, Muhammad Azka Alfarizi, Navia Rizkiantri, Rafisqy Alby Permana, Rafka Aqila Rafaizan, Sabrina Nazwa Taqiyya, Sagita Nasha Zahrani, Shafwan Ramadhan, Shareen Ziya Yudistira, Zaira Syakira Nur Afifah
- [Halaqah 4 Sore Teh Reni]: Abdurahman Al Ghifari, Alayya Ratifa Faisal, Alfi Muhammad Kasyaf Elfaqih, Annisa Shezan Nafasha, Assyifa Cantika Aura Putri, Ayra Azkiya Nur Almahyra, Azrina Shanum Alula, Hafiz Putra Rusdiana, Hasya Nurfia Hanifa, Kayla Nurazizah, Muhammad Kahfi Al Azzam, Muhammad Rasyad Ar Zain, Rafifa Makaila Mauludiah, Shezan Raudhah, Tsarwah Muzayyanah Alhakim
- [Halaqah 5 Sore Teh Arsy]: Bilfaqih Rey Al Tezza Perkasa, Fatimah Jauhariyah Azmi, Inara Mahestri, Karina, Khaysa Aziza, Najma Dzikrina Anjani, Nauval Faiz Rabbani Pratama, Nazwa Putri Mutakin, Nyimas Rinrin Kusumah Ningrum, Rindiani Khumaira, Sacyta Nayara Bilqis, Salimah Nur Ramadhani Alhakim, Syafa Athaya Fitriani, Zahra Putri Herdiyanti
- [Halaqah 6 Teh Nada]: Abizard Rafisqy Rahandika, Alradya Saffeera Alfarizky, Anindita Keysa Zahra, Anisa Alifatu Zahra, Dzavira Trifa Nurinsira, Fadlan Dzakir Zaidan, Fauzi Khoerul Hidayat, Hairul Nizam, Ikhsan Ahmad Mubarok, Mochammad Ziddan Baihaqi Akbar, Naila Qanita Salim, Raina Althafunnisa, Raya Rambu Rabbani, Wilda Nur Paoziah, Zakiya Talita Sakhi
- [Halaqah 2 Malam Abi]: Alfarisi, Alif Muhammad Maulana Yusuf, El'Farisza Irna Juwita, Faiha Nada Zalfa, Gusti Barkah Ramdani, Muhammad Arken Alkahfi, Nadhira Thapana Ramadhani, Raihan Abdul Mugni, Salsabila Nurul Fadhilah, Muhammad Fajar Habibie
- [Halaqah 1 Malam Sayid]: Adhitama Natadiharsa, Akyla Cantika Kusumah, Kenisha Adzkia Queenara, Mishael muhammad arsya ramadhan, Naysa Kania Al Bakti, Salwa Al Bakti, Shanum Mahveen Aprilianti, Yumna Saira Larasati
`;

const generateId = () => Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);

async function main() {
  const lines = rawData.split('\n').filter(l => l.trim() !== '');
  
  // First set ALL santri to unassigned (Belum ada halaqah)
  await db.update(santri).set({ idHalaqoh: null });

  // Delete all existing halaqoh to avoid duplicates
  await db.delete(halaqoh);

  const results = [];
  const notFound = [];

  for (const line of lines) {
    const match = line.match(/- \[([^\]]+)\]:\s*(.*)/);
    if (!match) continue;

    const halaqohName = match[1].trim();
    let santriListStr = match[2].trim();

    if (halaqohName === 'Belum ada halaqah' || santriListStr === '(Kosong)') {
      continue; // Will handle at the end
    }

    // Create halaqoh
    const hId = generateId();
    await db.insert(halaqoh).values({
      id: hId,
      namaHalaqoh: halaqohName,
      namaPengajar: "-",
    });

    const santriNames = santriListStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
    const assignedSantris = [];

    for (const sName of santriNames) {
      // Find santri by exact or case-insensitive match
      const found = await db.select().from(santri).where(sql`LOWER(nama_lengkap) LIKE ${sName.toLowerCase()}`);
      if (found.length > 0) {
        await db.update(santri).set({ idHalaqoh: hId }).where(eq(santri.id, found[0].id));
        assignedSantris.push(found[0].namaLengkap);
      } else {
        // Try fallback with LIKE %name%
        const fuzzy = await db.select().from(santri).where(sql`LOWER(nama_lengkap) LIKE ${'%' + sName.toLowerCase() + '%'}`);
        if (fuzzy.length === 1) {
          await db.update(santri).set({ idHalaqoh: hId }).where(eq(santri.id, fuzzy[0].id));
          assignedSantris.push(fuzzy[0].namaLengkap);
        } else {
          notFound.push(sName);
        }
      }
    }

    results.push({ name: halaqohName, count: assignedSantris.length, santris: assignedSantris });
  }

  // Get all unassigned santri
  const unassigned = await db.select().from(santri).where(isNull(santri.idHalaqoh));

  // Build the markdown output
  console.log("=== OUTPUT MARKDOWN ===");
  for (const r of results) {
    console.log(`- **[${r.name}]** (${r.count} Santri): ${r.santris.join(', ')}`);
  }
  console.log(`- **[Belum ada halaqah / Tidak Cocok]** (${unassigned.length} Santri): ${unassigned.map(u => u.namaLengkap).join(', ')}`);
  
  if (notFound.length > 0) {
    console.log("\n*Catatan: Nama-nama dari daftar Anda yang tidak ditemukan di database dan belum dimasukkan (mungkin salah ketik/belum terdaftar):*");
    console.log(notFound.join(', '));
  }
}

main().catch(console.error);

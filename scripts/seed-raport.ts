import { db } from "../src/db";
import { surahMaster, pengaturanPredikatRaport, pengaturanSemester } from "../src/db/schema";
import { v4 as uuidv4 } from "uuid";

const surahs = [
  { nomor: 1, nama: "Al-Fatihah", arab: "الفاتحة", juz: 1, urutan: 1, ayat: 7, tipe: "Makkiyah" },
  { nomor: 2, nama: "Al-Baqarah", arab: "البقرة", juz: 1, urutan: 2, ayat: 286, tipe: "Madaniyah" },
  { nomor: 3, nama: "Ali 'Imran", arab: "آل عمران", juz: 3, urutan: 1, ayat: 200, tipe: "Madaniyah" },
  { nomor: 4, nama: "An-Nisa'", arab: "النساء", juz: 4, urutan: 1, ayat: 176, tipe: "Madaniyah" },
  { nomor: 5, nama: "Al-Ma'idah", arab: "المائدة", juz: 6, urutan: 1, ayat: 120, tipe: "Madaniyah" },
  { nomor: 6, nama: "Al-An'am", arab: "الأنعام", juz: 7, urutan: 1, ayat: 165, tipe: "Makkiyah" },
  { nomor: 7, nama: "Al-A'raf", arab: "الأعراف", juz: 8, urutan: 1, ayat: 206, tipe: "Makkiyah" },
  { nomor: 8, nama: "Al-Anfal", arab: "الأنفال", juz: 9, urutan: 1, ayat: 75, tipe: "Madaniyah" },
  { nomor: 9, nama: "At-Taubah", arab: "التوبة", juz: 10, urutan: 1, ayat: 129, tipe: "Madaniyah" },
  { nomor: 10, nama: "Yunus", arab: "يونس", juz: 11, urutan: 1, ayat: 109, tipe: "Makkiyah" },
  { nomor: 11, nama: "Hud", arab: "هود", juz: 11, urutan: 2, ayat: 123, tipe: "Makkiyah" },
  { nomor: 12, nama: "Yusuf", arab: "يوسف", juz: 12, urutan: 1, ayat: 111, tipe: "Makkiyah" },
  { nomor: 13, nama: "Ar-Ra'd", arab: "الرعد", juz: 13, urutan: 1, ayat: 43, tipe: "Madaniyah" },
  { nomor: 14, nama: "Ibrahim", arab: "إبراهيم", juz: 13, urutan: 2, ayat: 52, tipe: "Makkiyah" },
  { nomor: 15, nama: "Al-Hijr", arab: "الحجر", juz: 14, urutan: 1, ayat: 99, tipe: "Makkiyah" },
  { nomor: 16, nama: "An-Nahl", arab: "النحل", juz: 14, urutan: 2, ayat: 128, tipe: "Makkiyah" },
  { nomor: 17, nama: "Al-Isra'", arab: "الإسراء", juz: 15, urutan: 1, ayat: 111, tipe: "Makkiyah" },
  { nomor: 18, nama: "Al-Kahf", arab: "الكهف", juz: 15, urutan: 2, ayat: 110, tipe: "Makkiyah" },
  { nomor: 19, nama: "Maryam", arab: "مريم", juz: 16, urutan: 1, ayat: 98, tipe: "Makkiyah" },
  { nomor: 20, nama: "Ta Ha", arab: "طه", juz: 16, urutan: 2, ayat: 135, tipe: "Makkiyah" },
  { nomor: 21, nama: "Al-Anbiya'", arab: "الأنبياء", juz: 17, urutan: 1, ayat: 112, tipe: "Makkiyah" },
  { nomor: 22, nama: "Al-Hajj", arab: "الحج", juz: 17, urutan: 2, ayat: 78, tipe: "Madaniyah" },
  { nomor: 23, nama: "Al-Mu'minun", arab: "المؤمنون", juz: 18, urutan: 1, ayat: 118, tipe: "Makkiyah" },
  { nomor: 24, nama: "An-Nur", arab: "النور", juz: 18, urutan: 2, ayat: 64, tipe: "Madaniyah" },
  { nomor: 25, nama: "Al-Furqan", arab: "الفرقان", juz: 18, urutan: 3, ayat: 77, tipe: "Makkiyah" },
  { nomor: 26, nama: "Asy-Syu'ara'", arab: "الشعراء", juz: 19, urutan: 1, ayat: 227, tipe: "Makkiyah" },
  { nomor: 27, nama: "An-Naml", arab: "النمل", juz: 19, urutan: 2, ayat: 93, tipe: "Makkiyah" },
  { nomor: 28, nama: "Al-Qasas", arab: "القصص", juz: 20, urutan: 1, ayat: 88, tipe: "Makkiyah" },
  { nomor: 29, nama: "Al-'Ankabut", arab: "العنكبوت", juz: 20, urutan: 2, ayat: 69, tipe: "Makkiyah" },
  { nomor: 30, nama: "Ar-Rum", arab: "الروم", juz: 21, urutan: 1, ayat: 60, tipe: "Makkiyah" },
  { nomor: 31, nama: "Luqman", arab: "لقمان", juz: 21, urutan: 2, ayat: 34, tipe: "Makkiyah" },
  { nomor: 32, nama: "As-Sajdah", arab: "السجدة", juz: 21, urutan: 3, ayat: 30, tipe: "Makkiyah" },
  { nomor: 33, nama: "Al-Ahzab", arab: "الأحزاب", juz: 21, urutan: 4, ayat: 73, tipe: "Madaniyah" },
  { nomor: 34, nama: "Saba'", arab: "سبأ", juz: 22, urutan: 1, ayat: 54, tipe: "Makkiyah" },
  { nomor: 35, nama: "Fatir", arab: "فاطر", juz: 22, urutan: 2, ayat: 45, tipe: "Makkiyah" },
  { nomor: 36, nama: "Ya Sin", arab: "يس", juz: 22, urutan: 3, ayat: 83, tipe: "Makkiyah" },
  { nomor: 37, nama: "As-Saffat", arab: "الصافات", juz: 23, urutan: 1, ayat: 182, tipe: "Makkiyah" },
  { nomor: 38, nama: "Sad", arab: "ص", juz: 23, urutan: 2, ayat: 88, tipe: "Makkiyah" },
  { nomor: 39, nama: "Az-Zumar", arab: "الزمر", juz: 23, urutan: 3, ayat: 75, tipe: "Makkiyah" },
  { nomor: 40, nama: "Ghafir", arab: "غافر", juz: 24, urutan: 1, ayat: 85, tipe: "Makkiyah" },
  { nomor: 41, nama: "Fussilat", arab: "فصلت", juz: 24, urutan: 2, ayat: 54, tipe: "Makkiyah" },
  { nomor: 42, nama: "Asy-Syura", arab: "الشورى", juz: 25, urutan: 1, ayat: 53, tipe: "Makkiyah" },
  { nomor: 43, nama: "Az-Zukhruf", arab: "الزخرف", juz: 25, urutan: 2, ayat: 89, tipe: "Makkiyah" },
  { nomor: 44, nama: "Ad-Dukhan", arab: "الدخان", juz: 25, urutan: 3, ayat: 59, tipe: "Makkiyah" },
  { nomor: 45, nama: "Al-Jasiyah", arab: "الجاثية", juz: 25, urutan: 4, ayat: 37, tipe: "Makkiyah" },
  { nomor: 46, nama: "Al-Ahqaf", arab: "الأحقاف", juz: 26, urutan: 1, ayat: 35, tipe: "Makkiyah" },
  { nomor: 47, nama: "Muhammad", arab: "محمد", juz: 26, urutan: 2, ayat: 38, tipe: "Madaniyah" },
  { nomor: 48, nama: "Al-Fath", arab: "الفتح", juz: 26, urutan: 3, ayat: 29, tipe: "Madaniyah" },
  { nomor: 49, nama: "Al-Hujurat", arab: "الحجرات", juz: 26, urutan: 4, ayat: 18, tipe: "Madaniyah" },
  { nomor: 50, nama: "Qaf", arab: "ق", juz: 26, urutan: 5, ayat: 45, tipe: "Makkiyah" },
  { nomor: 51, nama: "Az-Zariyat", arab: "الذاريات", juz: 26, urutan: 6, ayat: 60, tipe: "Makkiyah" },
  { nomor: 52, nama: "At-Tur", arab: "الطور", juz: 27, urutan: 1, ayat: 49, tipe: "Makkiyah" },
  { nomor: 53, nama: "An-Najm", arab: "النجم", juz: 27, urutan: 2, ayat: 62, tipe: "Makkiyah" },
  { nomor: 54, nama: "Al-Qamar", arab: "القمر", juz: 27, urutan: 3, ayat: 55, tipe: "Makkiyah" },
  { nomor: 55, nama: "Ar-Rahman", arab: "الرحمن", juz: 27, urutan: 4, ayat: 78, tipe: "Madaniyah" },
  { nomor: 56, nama: "Al-Waqi'ah", arab: "الواقعة", juz: 27, urutan: 5, ayat: 96, tipe: "Makkiyah" },
  { nomor: 57, nama: "Al-Hadid", arab: "الحديد", juz: 27, urutan: 6, ayat: 29, tipe: "Madaniyah" },
  { nomor: 58, nama: "Al-Mujadalah", arab: "المجادلة", juz: 28, urutan: 1, ayat: 22, tipe: "Madaniyah" },
  { nomor: 59, nama: "Al-Hasyr", arab: "الحشر", juz: 28, urutan: 2, ayat: 24, tipe: "Madaniyah" },
  { nomor: 60, nama: "Al-Mumtahanah", arab: "الممتحنة", juz: 28, urutan: 3, ayat: 13, tipe: "Madaniyah" },
  { nomor: 61, nama: "As-Saff", arab: "الصف", juz: 28, urutan: 4, ayat: 14, tipe: "Madaniyah" },
  { nomor: 62, nama: "Al-Jumu'ah", arab: "الجمعة", juz: 28, urutan: 5, ayat: 11, tipe: "Madaniyah" },
  { nomor: 63, nama: "Al-Munafiqun", arab: "المنافقون", juz: 28, urutan: 6, ayat: 11, tipe: "Madaniyah" },
  { nomor: 64, nama: "At-Tagabun", arab: "التغابن", juz: 28, urutan: 7, ayat: 18, tipe: "Madaniyah" },
  { nomor: 65, nama: "At-Talaq", arab: "الطلاق", juz: 28, urutan: 8, ayat: 12, tipe: "Madaniyah" },
  { nomor: 66, nama: "At-Tahrim", arab: "التحريم", juz: 28, urutan: 9, ayat: 12, tipe: "Madaniyah" },
  { nomor: 67, nama: "Al-Mulk", arab: "الملك", juz: 29, urutan: 1, ayat: 30, tipe: "Makkiyah" },
  { nomor: 68, nama: "Al-Qalam", arab: "القلم", juz: 29, urutan: 2, ayat: 52, tipe: "Makkiyah" },
  { nomor: 69, nama: "Al-Haqqah", arab: "الحاقة", juz: 29, urutan: 3, ayat: 52, tipe: "Makkiyah" },
  { nomor: 70, nama: "Al-Ma'arij", arab: "المعارج", juz: 29, urutan: 4, ayat: 44, tipe: "Makkiyah" },
  { nomor: 71, nama: "Nuh", arab: "نوح", juz: 29, urutan: 5, ayat: 28, tipe: "Makkiyah" },
  { nomor: 72, nama: "Al-Jinn", arab: "الجن", juz: 29, urutan: 6, ayat: 28, tipe: "Makkiyah" },
  { nomor: 73, nama: "Al-Muzzammil", arab: "المزمل", juz: 29, urutan: 7, ayat: 20, tipe: "Makkiyah" },
  { nomor: 74, nama: "Al-Muddassir", arab: "المدثر", juz: 29, urutan: 8, ayat: 56, tipe: "Makkiyah" },
  { nomor: 75, nama: "Al-Qiyamah", arab: "القيامة", juz: 29, urutan: 9, ayat: 40, tipe: "Makkiyah" },
  { nomor: 76, nama: "Al-Insan", arab: "الإنسان", juz: 29, urutan: 10, ayat: 31, tipe: "Madaniyah" },
  { nomor: 77, nama: "Al-Mursalat", arab: "المرسلات", juz: 29, urutan: 11, ayat: 50, tipe: "Makkiyah" },
  { nomor: 78, nama: "An-Naba'", arab: "النبأ", juz: 30, urutan: 1, ayat: 40, tipe: "Makkiyah" },
  { nomor: 79, nama: "An-Nazi'at", arab: "النازعات", juz: 30, urutan: 2, ayat: 46, tipe: "Makkiyah" },
  { nomor: 80, nama: "'Abasa", arab: "عبس", juz: 30, urutan: 3, ayat: 42, tipe: "Makkiyah" },
  { nomor: 81, nama: "At-Takwir", arab: "التكوير", juz: 30, urutan: 4, ayat: 29, tipe: "Makkiyah" },
  { nomor: 82, nama: "Al-Infitar", arab: "الانفطار", juz: 30, urutan: 5, ayat: 19, tipe: "Makkiyah" },
  { nomor: 83, nama: "Al-Mutaffifin", arab: "المطففين", juz: 30, urutan: 6, ayat: 36, tipe: "Makkiyah" },
  { nomor: 84, nama: "Al-Insyiqaq", arab: "الانشقاق", juz: 30, urutan: 7, ayat: 25, tipe: "Makkiyah" },
  { nomor: 85, nama: "Al-Buruj", arab: "البروج", juz: 30, urutan: 8, ayat: 22, tipe: "Makkiyah" },
  { nomor: 86, nama: "At-Tariq", arab: "الطارق", juz: 30, urutan: 9, ayat: 17, tipe: "Makkiyah" },
  { nomor: 87, nama: "Al-A'la", arab: "الأعلى", juz: 30, urutan: 10, ayat: 19, tipe: "Makkiyah" },
  { nomor: 88, nama: "Al-Gasyiyah", arab: "الغاشية", juz: 30, urutan: 11, ayat: 26, tipe: "Makkiyah" },
  { nomor: 89, nama: "Al-Fajr", arab: "الفجر", juz: 30, urutan: 12, ayat: 30, tipe: "Makkiyah" },
  { nomor: 90, nama: "Al-Balad", arab: "البلد", juz: 30, urutan: 13, ayat: 20, tipe: "Makkiyah" },
  { nomor: 91, nama: "Asy-Syams", arab: "الشمس", juz: 30, urutan: 14, ayat: 15, tipe: "Makkiyah" },
  { nomor: 92, nama: "Al-Lail", arab: "الليل", juz: 30, urutan: 15, ayat: 21, tipe: "Makkiyah" },
  { nomor: 93, nama: "Ad-Duha", arab: "الضحى", juz: 30, urutan: 16, ayat: 11, tipe: "Makkiyah" },
  { nomor: 94, nama: "Asy-Syarh", arab: "الشرح", juz: 30, urutan: 17, ayat: 8, tipe: "Makkiyah" },
  { nomor: 95, nama: "At-Tin", arab: "التين", juz: 30, urutan: 18, ayat: 8, tipe: "Makkiyah" },
  { nomor: 96, nama: "Al-'Alaq", arab: "العلق", juz: 30, urutan: 19, ayat: 19, tipe: "Makkiyah" },
  { nomor: 97, nama: "Al-Qadr", arab: "القدر", juz: 30, urutan: 20, ayat: 5, tipe: "Makkiyah" },
  { nomor: 98, nama: "Al-Bayyinah", arab: "البينة", juz: 30, urutan: 21, ayat: 8, tipe: "Madaniyah" },
  { nomor: 99, nama: "Az-Zalzalah", arab: "الزلزلة", juz: 30, urutan: 22, ayat: 8, tipe: "Madaniyah" },
  { nomor: 100, nama: "Al-'Adiyat", arab: "العاديات", juz: 30, urutan: 23, ayat: 11, tipe: "Makkiyah" },
  { nomor: 101, nama: "Al-Qari'ah", arab: "القارعة", juz: 30, urutan: 24, ayat: 11, tipe: "Makkiyah" },
  { nomor: 102, nama: "At-Takasur", arab: "التكاثر", juz: 30, urutan: 25, ayat: 8, tipe: "Makkiyah" },
  { nomor: 103, nama: "Al-'Asr", arab: "العصر", juz: 30, urutan: 26, ayat: 3, tipe: "Makkiyah" },
  { nomor: 104, nama: "Al-Humazah", arab: "الهمزة", juz: 30, urutan: 27, ayat: 9, tipe: "Makkiyah" },
  { nomor: 105, nama: "Al-Fil", arab: "الفيل", juz: 30, urutan: 28, ayat: 5, tipe: "Makkiyah" },
  { nomor: 106, nama: "Quraisy", arab: "قريش", juz: 30, urutan: 29, ayat: 4, tipe: "Makkiyah" },
  { nomor: 107, nama: "Al-Ma'un", arab: "الماعون", juz: 30, urutan: 30, ayat: 7, tipe: "Makkiyah" },
  { nomor: 108, nama: "Al-Kausar", arab: "الكوثر", juz: 30, urutan: 31, ayat: 3, tipe: "Makkiyah" },
  { nomor: 109, nama: "Al-Kafirun", arab: "الكافرون", juz: 30, urutan: 32, ayat: 6, tipe: "Makkiyah" },
  { nomor: 110, nama: "An-Nasr", arab: "النصر", juz: 30, urutan: 33, ayat: 3, tipe: "Madaniyah" },
  { nomor: 111, nama: "Al-Lahab", arab: "المسد", juz: 30, urutan: 34, ayat: 5, tipe: "Makkiyah" },
  { nomor: 112, nama: "Al-Ikhlas", arab: "الإخلاص", juz: 30, urutan: 35, ayat: 4, tipe: "Makkiyah" },
  { nomor: 113, nama: "Al-Falaq", arab: "الفلق", juz: 30, urutan: 36, ayat: 5, tipe: "Makkiyah" },
  { nomor: 114, nama: "An-Nas", arab: "الناس", juz: 30, urutan: 37, ayat: 6, tipe: "Makkiyah" }
];

async function seed() {
  console.log("Seeding surah...");
  for (const s of surahs) {
    await db.insert(surahMaster).values({
      id: uuidv4(),
      juz: s.juz,
      nomorSurah: s.nomor,
      namaSurah: s.nama,
      namaArab: s.arab,
      jumlahAyat: s.ayat,
      tipe: s.tipe,
      urutanDalamJuz: s.urutan
    }).onConflictDoNothing();
  }

  console.log("Seeding predicates...");
  const predicates = [
    { id: uuidv4(), jenis: 'KB', rentangMin: 90, rentangMax: 100, predikat: "Mumtaz (A)" },
    { id: uuidv4(), jenis: 'KB', rentangMin: 80, rentangMax: 89, predikat: "Jayyid Jiddan (B+)" },
    { id: uuidv4(), jenis: 'KB', rentangMin: 70, rentangMax: 79, predikat: "Jayyid (B)" },
    { id: uuidv4(), jenis: 'KB', rentangMin: 0, rentangMax: 69, predikat: "Maqbul (C)" },

    { id: uuidv4(), jenis: 'KH', rentangMin: 90, rentangMax: 100, predikat: "Mutqin (A)" },
    { id: uuidv4(), jenis: 'KH', rentangMin: 80, rentangMax: 89, predikat: "Lancar (B)" },
    { id: uuidv4(), jenis: 'KH', rentangMin: 70, rentangMax: 79, predikat: "Mengulang (C)" },
    { id: uuidv4(), jenis: 'KH', rentangMin: 0, rentangMax: 69, predikat: "Tasmi' Ulang (D)" }
  ];
  for (const p of predicates) {
    await db.insert(pengaturanPredikatRaport).values(p).onConflictDoNothing();
  }

  console.log("Seeding default semester...");
  await db.insert(pengaturanSemester).values({
    id: uuidv4(),
    nama: "Semester Ganjil",
    tahunAjaran: "2026/2027",
    isAktif: true,
    waktuDibuat: new Date()
  }).onConflictDoNothing();

  console.log("Done seeding!");
}

seed().catch(console.error);

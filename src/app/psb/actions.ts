"use server";

import { db } from "@/db";
import { pendaftar, pengaturanHumas } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

import { z } from "zod";
import { headers } from "next/headers";

type SubmitPSBInput = {
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: string;
  alamatLengkap: string;
  isAlamatDomisiliSama: boolean;
  alamatDomisili: string;
  jenjangSekolah: string;
  jenjangSekolahLainnya?: string;
  namaSekolah: string;
  kelasSekolah: string;
  ikutLes: boolean;
  hariLes?: string;
  jamLesMulai?: string;
  jamLesSelesai?: string;
  namaAyah: string;
  pekerjaanAyah: string;
  pekerjaanAyahLainnya?: string;
  instansiAyah: string;
  namaIbu: string;
  pekerjaanIbu: string;
  pekerjaanIbuLainnya?: string;
  instansiIbu: string;
  kontakOrtu: string;
  sudahMengaji: boolean;
  bukuMengaji?: string;
  capaianMengaji?: string;
  sudahMenghafal: boolean;
  capaianHafalan?: string;
  sumberInfo?: string;
};

const psbSchema = z.object({
  namaLengkap: z.string().min(1).max(100),
  tempatLahir: z.string().min(1).max(100),
  tanggalLahir: z.string().min(1),
  jenisKelamin: z.string().min(1).max(20),
  alamatLengkap: z.string().min(1).max(500),
  isAlamatDomisiliSama: z.boolean(),
  alamatDomisili: z.string().max(500).optional().nullable(),
  jenjangSekolah: z.string().min(1).max(50),
  jenjangSekolahLainnya: z.string().max(100).optional().nullable(),
  namaSekolah: z.string().min(1).max(100),
  kelasSekolah: z.string().min(1).max(50),
  ikutLes: z.boolean(),
  hariLes: z.string().max(50).optional().nullable(),
  jamLesMulai: z.string().max(20).optional().nullable(),
  jamLesSelesai: z.string().max(20).optional().nullable(),
  namaAyah: z.string().min(1).max(100),
  pekerjaanAyah: z.string().min(1).max(100),
  pekerjaanAyahLainnya: z.string().max(100).optional().nullable(),
  instansiAyah: z.string().max(100).optional().nullable(),
  namaIbu: z.string().min(1).max(100),
  pekerjaanIbu: z.string().min(1).max(100),
  pekerjaanIbuLainnya: z.string().max(100).optional().nullable(),
  instansiIbu: z.string().max(100).optional().nullable(),
  kontakOrtu: z.string().min(1).max(20),
  sudahMengaji: z.boolean(),
  bukuMengaji: z.string().max(100).optional().nullable(),
  capaianMengaji: z.string().max(100).optional().nullable(),
  sudahMenghafal: z.boolean(),
  capaianHafalan: z.string().max(100).optional().nullable(),
  sumberInfo: z.string().max(255).optional().nullable(),
});

// Simple in-memory rate limiting map
// Format: { [ip]: { count: number, timestamp: number } }
const rateLimitMap = new Map<string, { count: number, timestamp: number }>();

export async function submitPendaftaran(data: SubmitPSBInput) {
  // 1. Rate Limiting (Anti Spam)
  // Get IP address from headers
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
  const now = Date.now();
  
  if (rateLimitMap.has(ip)) {
    const record = rateLimitMap.get(ip)!;
    // Window: 10 minutes (600,000 ms)
    if (now - record.timestamp < 600000) {
      if (record.count >= 3) {
        return { success: false, message: "Terlalu banyak permintaan. Silakan coba lagi setelah 10 menit." };
      }
      record.count++;
    } else {
      // Reset window
      record.count = 1;
      record.timestamp = now;
    }
  } else {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
  }

  // 2. Server-side Validation (Anti Injection)
  const validationResult = psbSchema.safeParse(data);
  if (!validationResult.success) {
    console.error("Zod Validation Error:", validationResult.error.issues);
    return { success: false, message: "Data tidak valid atau mengandung karakter yang dilarang." };
  }

  const validData = validationResult.data;

  await db.insert(pendaftar).values({
    id: uuidv4(),
    ...validData,
    alamatDomisili: validData.alamatDomisili || "",
    instansiAyah: validData.instansiAyah || "",
    instansiIbu: validData.instansiIbu || "",
    tanggalDaftar: new Date(),
  });

  // Check if Fonnte WA is active
  const [humas] = await db.select().from(pengaturanHumas).limit(1);
  
  if (humas?.isAktif && humas.tokenFonnte) {
    let phone = data.kontakOrtu.replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }

    const message = `Assalamu'alaikum.\n\nTerima kasih sudah mendaftar di Rumah Qur'an Muharrik.\nSemua data atas nama ananda *${data.namaLengkap}* sudah kami rekap dengan baik.\n\nMohon ditunggu informasi update melalui WhatsApp yang dikirim dari Admin kami di nomor 0813-9494-0401.\n\n_Mohon simpan (save) nomor ini untuk menghindari pesan terdeteksi sebagai Spam._`;

    try {
      await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': humas.tokenFonnte,
        },
        body: new URLSearchParams({
          target: phone,
          message: message,
        })
      });
    } catch (e) {
      console.error('Failed to send WA message:', e);
    }
  }

  revalidatePath("/dashboard/psb");
  return { success: true };
}

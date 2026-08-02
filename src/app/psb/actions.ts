"use server";

import { db } from "@/db";
import { pendaftar, pengaturanHumas } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

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

export async function submitPendaftaran(data: SubmitPSBInput) {
  await db.insert(pendaftar).values({
    id: uuidv4(),
    ...data,
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

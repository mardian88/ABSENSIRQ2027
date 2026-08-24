"use server";

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});


import { db } from "@/db";
import { pengaturanProfil, sesiAbsensi, pengaturanHariAktif, hariLibur, pengaturanAbsensiGlobal, pengumumanPortal, notifikasiPortal, santri, pengumumanGuru, notifikasiGuru, guru } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { v4 as uuidv4 } from "uuid";

export async function getPengaturanProfil() {
  const [profil] = await db.select().from(pengaturanProfil).limit(1);
  if (!profil) {
    return { id: "", namaRumahQuran: "Rumah Qur'an", urlLogo: "", warnaTema: "", passwordAbsensi: "", isPsbAktif: true, isCountdownAktif: false, batasWaktuPsb: null };
  }
  return profil;
}

export async function updatePengaturanProfil(data: { id?: string, namaRumahQuran: string, urlLogo?: string, warnaTema?: string, passwordAbsensi?: string, isPsbAktif?: boolean, isCountdownAktif?: boolean, batasWaktuPsb?: Date | null }) {
  let id = data.id;
  if (!id) {
    const [existing] = await db.select().from(pengaturanProfil).limit(1);
    if (existing) {
      id = existing.id;
    } else {
      id = uuidv4();
      await db.insert(pengaturanProfil).values({
        id,
        namaRumahQuran: data.namaRumahQuran,
        urlLogo: data.urlLogo,
        warnaTema: data.warnaTema,
        passwordAbsensi: data.passwordAbsensi,
        isPsbAktif: data.isPsbAktif !== undefined ? data.isPsbAktif : true,
        isCountdownAktif: data.isCountdownAktif !== undefined ? data.isCountdownAktif : false,
        batasWaktuPsb: data.batasWaktuPsb
      });
      revalidatePath("/");
      return { success: true };
    }
  }

  await db.update(pengaturanProfil).set({
    namaRumahQuran: data.namaRumahQuran,
    urlLogo: data.urlLogo,
    warnaTema: data.warnaTema,
    passwordAbsensi: data.passwordAbsensi,
    isPsbAktif: data.isPsbAktif,
    isCountdownAktif: data.isCountdownAktif,
    batasWaktuPsb: data.batasWaktuPsb
  }).where(require("drizzle-orm").eq(pengaturanProfil.id, id));

  revalidatePath("/", "layout");
  return { success: true };
}

// --- Sesi Absensi CRUD ---

export async function getSesiAbsensiList() {
  return await db.select().from(sesiAbsensi);
}

export async function createSesiAbsensi(data: {
  namaSesi: string;
  waktuMulaiMasuk: string;
  waktuBatasMasuk: string;
  waktuMulaiPulang: string;
  waktuNormalPulang: string;
  waktuTutup: string;
}) {
  const id = uuidv4();
  await db.insert(sesiAbsensi).values({
    id,
    ...data
  });
  revalidatePath("/pengaturan");
  return id;
}

export async function updateSesiAbsensi(id: string, data: {
  namaSesi: string;
  waktuMulaiMasuk: string;
  waktuBatasMasuk: string;
  waktuMulaiPulang: string;
  waktuNormalPulang: string;
  waktuTutup: string;
}) {
  await db.update(sesiAbsensi).set(data).where(eq(sesiAbsensi.id, id));
  revalidatePath("/pengaturan");
  return true;
}

export async function deleteSesiAbsensi(id: string) {
  await db.delete(sesiAbsensi).where(eq(sesiAbsensi.id, id));
  revalidatePath("/pengaturan");
  return true;
}

// --- Hari Aktif CRUD ---

export async function getHariAktifList() {
  const data = await db.select().from(pengaturanHariAktif);
  
  // Jika masih kosong, inisialisasi default
  if (data.length === 0) {
    const hariDefault = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
    for (const h of hariDefault) {
      await db.insert(pengaturanHariAktif).values({
        id: h.toLowerCase(),
        hari: h,
        isAktif: h !== "Minggu" // Misal minggu libur default
      });
    }
    return await db.select().from(pengaturanHariAktif);
  }
  return data;
}

export async function toggleHariAktif(id: string, isAktif: boolean) {
  await db.update(pengaturanHariAktif).set({ isAktif }).where(eq(pengaturanHariAktif.id, id));
  revalidatePath("/pengaturan");
  return true;
}

// --- Hari Libur CRUD ---

export async function getHariLiburList() {
  return await db.select().from(hariLibur).orderBy(hariLibur.tanggal);
}

export async function addHariLibur(data: { tanggal: string; keterangan: string }) {
  await db.insert(hariLibur).values({
    id: uuidv4(),
    tanggal: data.tanggal,
    keterangan: data.keterangan,
    isAktif: true
  });
  revalidatePath("/pengaturan");
  return true;
}

export async function deleteHariLibur(id: string) {
  await db.delete(hariLibur).where(eq(hariLibur.id, id));
  revalidatePath("/pengaturan");
  return true;
}

export async function toggleHariLibur(id: string, isAktif: boolean) {
  await db.update(hariLibur).set({ isAktif }).where(eq(hariLibur.id, id));
  revalidatePath("/pengaturan");
  return true;
}

// --- Pengaturan Absensi Global ---

export async function getPengaturanAbsensiGlobal() {
  const [data] = await db.select().from(pengaturanAbsensiGlobal).limit(1);
  if (!data) {
    const newId = uuidv4();
    await db.insert(pengaturanAbsensiGlobal).values({
      id: newId,
      isAutoAlpaAktif: false
    });
    return { id: newId, isAutoAlpaAktif: false };
  }
  return data;
}

export async function toggleAutoAlpa(id: string, isAutoAlpaAktif: boolean) {
  await db.update(pengaturanAbsensiGlobal).set({ isAutoAlpaAktif }).where(eq(pengaturanAbsensiGlobal.id, id));
  revalidatePath("/pengaturan");
  return true;
}

// --- Pengaturan Thank You Page (Izin/Sakit) ---
import { pengaturanHalamanSukses } from "@/db/schema";

export async function getPengaturanHalamanSukses() {
  const [data] = await db.select().from(pengaturanHalamanSukses).limit(1);
  if (!data) {
    const newId = uuidv4();
    await db.insert(pengaturanHalamanSukses).values({
      id: newId,
      diperbaruiPada: new Date()
    });
    return { 
      id: newId, 
      urlLogo: null, 
      pesanHtml: '<h2 style="text-align:center;">Terima Kasih!</h2><p style="text-align:center;">Pengajuan izin/sakit santri telah berhasil dikirimkan dan tercatat di sistem kami.</p>' 
    };
  }
  return data;
}

export async function updatePengaturanHalamanSukses(id: string, data: { urlLogo?: string | null, pesanHtml: string }) {
  await db.update(pengaturanHalamanSukses).set({
    urlLogo: data.urlLogo,
    pesanHtml: data.pesanHtml,
    diperbaruiPada: new Date()
  }).where(eq(pengaturanHalamanSukses.id, id));
  revalidatePath("/pengaturan");
  return true;
}

export async function uploadLogoHalamanSukses(formData: FormData) {
  const file = formData.get("logo") as File;
  if (!file || file.size === 0) {
    throw new Error("Tidak ada file yang diunggah.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/png";
  const base64Data = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  return dataUrl;
}

export async function uploadImageToCloudinary(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file || file.size === 0) {
    throw new Error("Tidak ada file yang diunggah.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder: "pengaturan_logo", resource_type: "image" },
      (error, result) => {
        if (error || !result) reject(error);
        else resolve(result.secure_url);
      }
    ).end(buffer);
  });
}
// --- Pengaturan Humas (WhatsApp Fonnte) ---
import { pengaturanHumas, templatePesan } from "@/db/schema";

export async function getPengaturanHumas() {
  const [data] = await db.select().from(pengaturanHumas).limit(1);
  if (!data) {
    const newId = uuidv4();
    await db.insert(pengaturanHumas).values({
      id: newId,
      tokenFonnte: "",
      nomorAdmin: "",
      isAktif: false
    });
    return { id: newId, tokenFonnte: "", nomorAdmin: "", isAktif: false, nomorReminder: "", isReminderAktif: false };
  }
  return data;
}

export async function updatePengaturanHumas(data: { id: string, tokenFonnte: string, nomorAdmin?: string, isAktif: boolean, nomorReminder?: string, isReminderAktif?: boolean }) {
  const { id, ...updateData } = data;
  await db.update(pengaturanHumas).set(updateData).where(eq(pengaturanHumas.id, id));
  revalidatePath("/pengaturan");
  return true;
}

// --- Fonnte Tokens CRUD & Realtime Quota ---
import { fonnteTokens } from "@/db/schema";

export async function getFonnteTokens() {
  return await db.select().from(fonnteTokens).orderBy(desc(fonnteTokens.isActive));
}

export async function saveFonnteToken(data: { id?: string, name: string, token: string, isActive: boolean }) {
  if (data.id) {
    if (data.isActive) {
      // Deactivate all others first
      await db.update(fonnteTokens).set({ isActive: false, isExhausted: false });
    }
    await db.update(fonnteTokens).set({
      name: data.name,
      token: data.token,
      isActive: data.isActive,
      updatedAt: new Date()
    }).where(eq(fonnteTokens.id, data.id));
  } else {
    if (data.isActive) {
      await db.update(fonnteTokens).set({ isActive: false, isExhausted: false });
    }
    await db.insert(fonnteTokens).values({
      id: uuidv4(),
      name: data.name,
      token: data.token,
      isActive: data.isActive,
      isExhausted: false,
      updatedAt: new Date()
    });
  }
  revalidatePath("/pengaturan");
  return true;
}

export async function deleteFonnteToken(id: string) {
  await db.delete(fonnteTokens).where(eq(fonnteTokens.id, id));
  revalidatePath("/pengaturan");
  return true;
}

export async function checkFonnteQuota(token: string) {
  try {
    const res = await fetch("https://api.fonnte.com/device", {
      method: "POST",
      headers: { Authorization: token }
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return { status: false, reason: err.message };
  }
}

// --- Template Pesan CRUD ---
export async function getTemplatePesanList() {
  return await db.select().from(templatePesan);
}

export async function saveTemplatePesan(data: { id?: string, jenisPesan: string, isiPesan: string, isAktif: boolean }) {
  if (data.id) {
    await db.update(templatePesan).set({
      jenisPesan: data.jenisPesan,
      isiPesan: data.isiPesan,
      isAktif: data.isAktif
    }).where(eq(templatePesan.id, data.id));
  } else {
    await db.insert(templatePesan).values({
      id: uuidv4(),
      jenisPesan: data.jenisPesan,
      isiPesan: data.isiPesan,
      isAktif: data.isAktif
    });
  }
  revalidatePath("/pengaturan");
  return true;
}

export async function deleteTemplatePesan(id: string) {
  await db.delete(templatePesan).where(eq(templatePesan.id, id));
  revalidatePath("/pengaturan");
  return true;
}

export async function toggleTemplatePesan(id: string, isAktif: boolean) {
  await db.update(templatePesan).set({ isAktif }).where(eq(templatePesan.id, id));
  revalidatePath("/pengaturan");
  return true;
}
export async function seedDefaultTemplates() {
  const templatesToSeed = [
    // ABSEN MASUK
    {
      jenisPesan: "absen_masuk",
      isiPesan: "Assalamu'alaikum Ayah/Bunda. Alhamdulillah, ananda [NAMA_SANTRI] telah hadir di Rumah Qur'an pada pukul [WAKTU]. Semoga Allah jadikan setiap langkahnya menuju majelis ilmu sebagai pemberat timbangan amal kebaikan. Jazakumullah khairan.",
      isAktif: true
    },
    {
      jenisPesan: "absen_masuk",
      isiPesan: "Assalamu'alaikum wr. wb. Kami menginformasikan bahwa ananda [NAMA_SANTRI] sudah tiba di halaqah pada jam [WAKTU]. Semoga Allah SWT senantiasa memberikan kemudahan dan kefahaman dalam menuntut ilmu. Aamiin.",
      isAktif: true
    },
    {
      jenisPesan: "absen_masuk",
      isiPesan: "Assalamu'alaikum. Puji syukur, ananda [NAMA_SANTRI] telah masuk kelas ([WAKTU]). 'Barangsiapa menempuh jalan untuk menuntut ilmu, Allah akan mudahkan baginya jalan menuju surga' (HR. Muslim).",
      isAktif: true
    },

    // ABSEN PULANG
    {
      jenisPesan: "absen_pulang",
      isiPesan: "Assalamu'alaikum. Alhamdulillah kegiatan belajar hari ini telah usai. Ananda [NAMA_SANTRI] telah pulang pada pukul [WAKTU]. Semoga ilmu yang didapat hari ini berkah dan bermanfaat.",
      isAktif: true
    },
    {
      jenisPesan: "absen_pulang",
      isiPesan: "Assalamu'alaikum Ayah/Bunda. Ananda [NAMA_SANTRI] telah menyelesaikan halaqah dan absen pulang jam [WAKTU]. Semoga lelahnya menjadi Lillah dan kelak menjadi ahlul qur'an yang membanggakan keluarga. Aamiin.",
      isAktif: true
    },
    {
      jenisPesan: "absen_pulang",
      isiPesan: "Assalamu'alaikum wr. wb. Kami infokan bahwa ananda [NAMA_SANTRI] sudah bersiap pulang pukul [WAKTU]. Terima kasih atas dukungan Ayah/Bunda. Semoga Allah senantiasa merahmati keluarga di rumah.",
      isAktif: true
    },

    // ABSEN TELAT
    {
      jenisPesan: "absen_telat",
      isiPesan: "Assalamu'alaikum. Ananda [NAMA_SANTRI] hari ini hadir terlambat pada pukul [WAKTU]. Mohon kerjasamanya agar esok hari bisa hadir lebih tepat waktu, agar keberkahan awal majelis tidak terlewat. Jazakumullah khairan.",
      isAktif: true
    },
    {
      jenisPesan: "absen_telat",
      isiPesan: "Assalamu'alaikum Ayah/Bunda. Kami menginfokan ananda [NAMA_SANTRI] datang terlambat di kelas pada pukul [WAKTU]. Kedisiplinan adalah kunci kesuksesan seorang penuntut ilmu. Mohon dukungannya di rumah. Terima kasih.",
      isAktif: true
    },

    // ALPA ORTU
    {
      jenisPesan: "alpa_ortu",
      isiPesan: "Assalamu'alaikum Ayah/Bunda. Hari ini ananda [NAMA_SANTRI] belum tercatat kehadirannya (Alpa) di halaqah. Jika ananda berhalangan hadir, mohon berkenan memberikan konfirmasi izin. Semoga Allah senantiasa melindungi kita semua.",
      isAktif: true
    },
    {
      jenisPesan: "alpa_ortu",
      isiPesan: "Assalamu'alaikum. Kami merindukan kehadiran ananda [NAMA_SANTRI] di majelis hari ini. Sampai saat ini ananda berstatus Alpa. Apabila ada udzur syar'i, mohon diinformasikan kepada ustaz/ustazah. Jazakumullah khairan.",
      isAktif: true
    },

    // IZIN ORTU
    {
      jenisPesan: "izin_ortu",
      isiPesan: "Assalamu'alaikum. Pengajuan izin (Keterangan: [KETERANGAN]) untuk ananda [NAMA_SANTRI] pada tanggal [TANGGAL] telah kami catat. Semoga urusannya dimudahkan Allah dan yang sakit segera diangkat penyakitnya. Aamiin.",
      isAktif: true
    },
    {
      jenisPesan: "izin_ortu",
      isiPesan: "Assalamu'alaikum Ayah/Bunda. Kami telah merekap izin ananda [NAMA_SANTRI] (Alasan: [KETERANGAN]). Semoga Allah SWT senantiasa memberikan kelapangan. Kami tunggu kehadirannya kembali di halaqah dengan semangat baru.",
      isAktif: true
    },

    // RAPOR BULANAN
    {
      jenisPesan: "rapor_bulanan",
      isiPesan: "Assalamu'alaikum Warahmatullahi Wabarakatuh,\nBapak/Ibu Wali dari [NAMA_SANTRI],\n\nBerikut kami sampaikan Rapor Kedisiplinan Bulan Ini:\n✅ Hadir: [TOTAL_HADIR] kali\n🤒 Sakit: [TOTAL_SAKIT] hari\n✉️ Izin: [TOTAL_IZIN] hari\n❌ Alpa: [TOTAL_ALPA] kali\n\n🏅 Total Poin Santri: [TOTAL_POIN]\n\nSemoga Ananda semakin disiplin dan istiqomah dalam menuntut ilmu.\nJazakumullah Khairan.",
      isAktif: true
    },

    // KEUANGAN
    {
      jenisPesan: "topup_tabungan_approve",
      isiPesan: "Assalamu'alaikum Ayah/Bunda. Alhamdulillah, pengajuan Top-up Tabungan ananda [NAMA_SANTRI] sebesar [NOMINAL] telah berhasil kami verifikasi. Saldo tabungan saat ini: [SALDO_AKHIR]. Jazakumullah khairan.",
      isAktif: true
    },
    {
      jenisPesan: "infaq_kas_approve",
      isiPesan: "Assalamu'alaikum Ayah/Bunda. Alhamdulillah, pembayaran Infaq & Kas ananda [NAMA_SANTRI] sebesar [NOMINAL] telah berhasil kami verifikasi. Jazakumullah khairan atas partisipasinya.",
      isAktif: true
    },
    {
      jenisPesan: "infaq_saja_approve",
      isiPesan: "Assalamu'alaikum Ayah/Bunda. Alhamdulillah, pembayaran Infaq ananda [NAMA_SANTRI] sebesar [NOMINAL] telah berhasil kami verifikasi. Semoga pahalanya mengalir tiada henti. Jazakumullah khairan.",
      isAktif: true
    },
    {
      jenisPesan: "kas_saja_approve",
      isiPesan: "Assalamu'alaikum Ayah/Bunda. Alhamdulillah, pembayaran Uang Kas ananda [NAMA_SANTRI] sebesar [NOMINAL] telah berhasil kami verifikasi. Jazakumullah khairan.",
      isAktif: true
    }
  ];

  let addedCount = 0;
  for (const tmpl of templatesToSeed) {
    await db.insert(templatePesan).values({
      id: uuidv4(),
      jenisPesan: tmpl.jenisPesan,
      isiPesan: tmpl.isiPesan,
      isAktif: tmpl.isAktif
    });
    addedCount++;
  }

  revalidatePath("/pengaturan");
  return addedCount;
}


import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getAdminId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user?.id || null;
}

export async function getPengumumanPortal() {
  return await db.select().from(pengumumanPortal).orderBy(desc(pengumumanPortal.tanggal));
}

export async function tambahPengumuman(judul: string, isi: string, isAktif: boolean) {
  const adminId = await getAdminId();
  if (!adminId) throw new Error("Akses ditolak");

  await db.insert(pengumumanPortal).values({
    id: uuidv4(),
    judul,
    isi,
    tanggal: new Date(),
    isAktif,
    idAdmin: adminId
  });

  if (isAktif) {
    const santriList = await db.select({ id: santri.id }).from(santri).where(eq(santri.statusSantri, 'aktif'));
    for (const s of santriList) {
      await db.insert(notifikasiPortal).values({
        id: uuidv4(),
        idSantri: s.id,
        judul: judul,
        isi: isi,
        jenis: 'pengumuman',
        isRead: false,
        tanggal: new Date()
      });
    }
  }

  revalidatePath('/pengaturan');
  revalidatePath('/portal-ortu');
}

export async function updatePengumuman(id: string, judul: string, isi: string, isAktif: boolean) {
  const adminId = await getAdminId();
  if (!adminId) throw new Error("Akses ditolak");

  await db.update(pengumumanPortal).set({ judul, isi, isAktif }).where(eq(pengumumanPortal.id, id));

  // Note: We only send notification on creation for now, to avoid spamming if just fixing typos.
  // If needed, we can add logic to broadcast if changing from inactive to active.
  
  revalidatePath('/pengaturan');
  revalidatePath('/portal-ortu');
}

export async function hapusPengumuman(id: string) {
  const adminId = await getAdminId();
  if (!adminId) throw new Error("Akses ditolak");

  await db.delete(pengumumanPortal).where(eq(pengumumanPortal.id, id));
  revalidatePath('/pengaturan');
  revalidatePath('/portal-ortu');
}


// --- PENGATURAN AUDIO NOTIFIKASI ---
export async function getAudioSettings() {
  const [data] = await db.select().from(pengaturanAbsensiGlobal).limit(1);
  return data || null;
}

export async function updateAudioSettings(formData: FormData) {
  const isAudioMasukAktif = formData.get('isAudioMasukAktif') === 'true';
  const isAudioPulangAktif = formData.get('isAudioPulangAktif') === 'true';
  const isAudioGagalAktif = formData.get('isAudioGagalAktif') === 'true';
  
  const fileMasuk = formData.get('fileMasuk') as File | null;
  const filePulang = formData.get('filePulang') as File | null;
  const fileGagal = formData.get('fileGagal') as File | null;

  let urlAudioMasuk = formData.get('urlAudioMasuk') as string | null;
  let urlAudioPulang = formData.get('urlAudioPulang') as string | null;
  let urlAudioGagal = formData.get('urlAudioGagal') as string | null;

  async function uploadToCloudinary(file: File) {
    if (file.size === 0) return null;
    const buffer = Buffer.from(await file.arrayBuffer());
    return new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: "audio_absensi", resource_type: "video" }, // audio is treated as video in cloudinary
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result.secure_url);
        }
      ).end(buffer);
    });
  }

  try {
    if (fileMasuk && fileMasuk.size > 0) {
      urlAudioMasuk = await uploadToCloudinary(fileMasuk);
    }
    if (filePulang && filePulang.size > 0) {
      urlAudioPulang = await uploadToCloudinary(filePulang);
    }
    if (fileGagal && fileGagal.size > 0) {
      urlAudioGagal = await uploadToCloudinary(fileGagal);
    }

    const [existing] = await db.select().from(pengaturanAbsensiGlobal).limit(1);
    
    if (existing) {
      await db.update(pengaturanAbsensiGlobal)
        .set({
          isAudioMasukAktif,
          isAudioPulangAktif,
          isAudioGagalAktif,
          urlAudioMasuk,
          urlAudioPulang,
          urlAudioGagal
        })
        .where(eq(pengaturanAbsensiGlobal.id, existing.id));
    } else {
      await db.insert(pengaturanAbsensiGlobal).values({
        id: "global-setting",
        isAudioMasukAktif,
        isAudioPulangAktif,
        isAudioGagalAktif,
        urlAudioMasuk,
        urlAudioPulang,
        urlAudioGagal
      });
    }

    revalidatePath("/pengaturan");
    return { success: true, message: "Pengaturan audio berhasil disimpan" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Gagal menyimpan pengaturan audio" };
  }
}

export async function getPengumumanGuru() {
  return await db.select().from(pengumumanGuru).orderBy(desc(pengumumanGuru.tanggal));
}

export async function tambahPengumumanGuru(judul: string, isi: string, isAktif: boolean) {
  const adminId = await getAdminId();
  if (!adminId) throw new Error("Akses ditolak");

  await db.insert(pengumumanGuru).values({
    id: uuidv4(),
    judul,
    isi,
    tanggal: new Date(),
    isAktif,
    idAdmin: adminId
  });

  if (isAktif) {
    const guruList = await db.select({ id: guru.id }).from(guru);
    for (const g of guruList) {
      await db.insert(notifikasiGuru).values({
        id: uuidv4(),
        idGuru: g.id,
        judul: judul,
        isi: isi,
        jenis: 'pengumuman',
        isRead: false,
        tanggal: new Date()
      });
    }
  }

  revalidatePath('/pengaturan');
  revalidatePath('/portal-guru');
}

export async function updatePengumumanGuru(id: string, judul: string, isi: string, isAktif: boolean) {
  const adminId = await getAdminId();
  if (!adminId) throw new Error("Akses ditolak");

  await db.update(pengumumanGuru).set({ judul, isi, isAktif }).where(eq(pengumumanGuru.id, id));
  
  revalidatePath('/pengaturan');
  revalidatePath('/portal-guru');
}

export async function hapusPengumumanGuru(id: string) {
  const adminId = await getAdminId();
  if (!adminId) throw new Error("Akses ditolak");

  await db.delete(pengumumanGuru).where(eq(pengumumanGuru.id, id));
  revalidatePath('/pengaturan');
  revalidatePath('/portal-guru');
}



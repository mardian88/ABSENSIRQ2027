const fs = require('fs');

const imports = `
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
`;

const functions = `
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
`;

let content = fs.readFileSync('src/app/pengaturan/actions.ts', 'utf8');

// just append everything to the bottom, and put the import at the top
content = imports + '\\n' + content + '\\n' + functions;

fs.writeFileSync('src/app/pengaturan/actions.ts', content);

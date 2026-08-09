"use server";

import { db } from "@/db";
import { mutabaahSetoran, santri, halaqoh, guru } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getProgressMutabaahAdmin() {
  try {
    // Ambil data santri dan halaqahnya
    const dataSantri = await db
      .select({
        id: santri.id,
        namaLengkap: santri.namaLengkap,
        nomorInduk: santri.nomorInduk,
        namaHalaqoh: halaqoh.namaHalaqoh,
      })
      .from(santri)
      .leftJoin(halaqoh, eq(santri.idHalaqoh, halaqoh.id))
      .where(eq(santri.statusSantri, 'aktif'));

    // Ambil SEMUA mutabaah, urutkan dari yang terbaru
    const semuaMutabaah = await db
      .select({
        id: mutabaahSetoran.id,
        idSantri: mutabaahSetoran.idSantri,
        jenis: mutabaahSetoran.jenis,
        capaian: mutabaahSetoran.capaian,
        tanggal: mutabaahSetoran.tanggal,
        waktuDibuat: mutabaahSetoran.waktuDibuat,
        inputOleh: mutabaahSetoran.inputOleh,
        namaGuru: guru.namaLengkap,
        catatanGuru: mutabaahSetoran.catatanGuru,
      })
      .from(mutabaahSetoran)
      .leftJoin(guru, eq(mutabaahSetoran.idGuru, guru.id))
      .orderBy(desc(mutabaahSetoran.waktuDibuat));

    // Proses data (Map/Reduce)
    const progressData = dataSantri.map(s => {
      const mutabaahSantri = semuaMutabaah.filter(m => m.idSantri === s.id);
      const latestMengaji = mutabaahSantri.find(m => m.jenis === 'mengaji');
      const latestHafalan = mutabaahSantri.find(m => m.jenis === 'hafalan');

      // Cek kapan terakhir kali di-update (bisa dari mengaji atau hafalan)
      let terakhirUpdate = null;
      if (latestMengaji && latestHafalan) {
        terakhirUpdate = latestMengaji.waktuDibuat > latestHafalan.waktuDibuat ? latestMengaji.waktuDibuat : latestHafalan.waktuDibuat;
      } else if (latestMengaji) {
        terakhirUpdate = latestMengaji.waktuDibuat;
      } else if (latestHafalan) {
        terakhirUpdate = latestHafalan.waktuDibuat;
      }

      // Hitung selisih hari dari terakhir update
      let hariTanpaUpdate = -1; // -1 artinya belum pernah
      if (terakhirUpdate) {
        const now = new Date();
        const last = new Date(terakhirUpdate);
        const diffTime = Math.abs(now.getTime() - last.getTime());
        hariTanpaUpdate = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        idSantri: s.id,
        namaSantri: s.namaLengkap,
        nis: s.nomorInduk,
        namaHalaqoh: s.namaHalaqoh,
        mengaji: latestMengaji || null,
        hafalan: latestHafalan || null,
        terakhirUpdate,
        hariTanpaUpdate
      };
    });

    return { success: true, data: progressData };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

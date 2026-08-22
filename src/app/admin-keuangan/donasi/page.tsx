import { db } from "@/db";
import { programDonasi, transaksiDonasi, santri } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import DonasiAdminClient from "./DonasiAdminClient";

export default async function DonasiAdminPage() {
  const programs = await db.select().from(programDonasi).orderBy(desc(programDonasi.waktuDibuat));
  
  const transaksis = await db.select({
    id: transaksiDonasi.id,
    nominal: transaksiDonasi.nominal,
    metode: transaksiDonasi.metode,
    status: transaksiDonasi.status,
    isAnonim: transaksiDonasi.isAnonim,
    doa: transaksiDonasi.doa,
    waktuDibuat: transaksiDonasi.waktuDibuat,
    waktuVerifikasi: transaksiDonasi.waktuVerifikasi,
    idProgram: transaksiDonasi.idProgram,
    judulProgram: programDonasi.judul,
    idSantri: transaksiDonasi.idSantri,
    namaSantri: santri.namaLengkap,
    nis: santri.nomorInduk
  })
  .from(transaksiDonasi)
  .leftJoin(programDonasi, eq(transaksiDonasi.idProgram, programDonasi.id))
  .leftJoin(santri, eq(transaksiDonasi.idSantri, santri.id))
  .orderBy(desc(transaksiDonasi.waktuDibuat));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Program Wakaf</h1>
        <p className="text-slate-500">Kelola program Wakaf dan verifikasi pembayaran dari orang tua.</p>
      </div>

      <DonasiAdminClient initialPrograms={programs} initialTransaksi={transaksis} />
    </div>
  );
}


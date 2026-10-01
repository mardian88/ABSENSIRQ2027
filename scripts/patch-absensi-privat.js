const fs = require('fs');
const file = 'src/app/portal-guru/(dashboard)/absensi-privat/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `import { db } from "@/db";
import { santriPrivat, absensiPrivat } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FormAbsensiPrivat from "./FormAbsensiPrivat";
import { Badge } from "@/components/ui/badge";
import { getGuruSession } from "../../actions";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function AbsensiPrivatPage() {
  const session = await getGuruSession();
  
  if (!session) {
    redirect("/portal-guru/login");
  }

  if (!session.isGuruPrivat) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 mb-6">Akun Anda tidak memiliki akses ke fitur Guru Privat.</p>
        <Link href="/portal-guru" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
          Kembali ke Dashboard Utama
        </Link>
      </div>
    );
  }

  const daftarSantri = await db.select().from(santriPrivat).where(eq(santriPrivat.statusSantri, 'aktif'));
  
  const riwayatAbsensi = await db.select({
    id: absensiPrivat.id,
    waktuSesi: absensiPrivat.waktuSesi,
    statusKehadiran: absensiPrivat.statusKehadiran,
    capaianHafalan: absensiPrivat.capaianHafalan,
    santri: {
      namaLengkap: santriPrivat.namaLengkap
    }
  }).from(absensiPrivat)
    .innerJoin(santriPrivat, eq(absensiPrivat.idSantriPrivat, santriPrivat.id))
    .where(eq(absensiPrivat.idGuru, session.id))
    .orderBy(desc(absensiPrivat.waktuSesi))
    .limit(10);

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div>
        <Link href="/portal-guru" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 mb-4 transition">
          <ArrowLeft className="w-4 h-4 mr-1" /> Kembali ke Dasbor Utama
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Absensi & Capaian Privat</h2>
        <p className="text-slate-500 mt-1">Catat kehadiran dan progres hafalan/jilid santri privat setelah sesi selesai.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg">Input Absensi Sesi Privat</CardTitle>
            <CardDescription>Pilih santri dan masukkan capaian hari ini.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <FormAbsensiPrivat daftarSantri={daftarSantri} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg">Riwayat Mengajar Anda (10 Terakhir)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {riwayatAbsensi.map((absen) => (
                <div key={absen.id} className="flex flex-col p-4 border border-slate-100 rounded-xl bg-white shadow-sm hover:border-emerald-200 transition">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800">{absen.santri.namaLengkap}</span>
                    <Badge variant={absen.statusKehadiran === 'hadir' ? 'default' : (absen.statusKehadiran === 'izin' ? 'secondary' : 'destructive')} className={absen.statusKehadiran === 'hadir' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}>
                      {absen.statusKehadiran.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs font-semibold text-slate-400 mb-2">
                    {new Date(absen.waktuSesi).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                  </div>
                  {absen.capaianHafalan && (
                    <div className="text-sm bg-slate-50 border border-slate-100 p-3 rounded-lg text-slate-700">
                      <span className="font-semibold block mb-1">Capaian / Jilid:</span> {absen.capaianHafalan}
                    </div>
                  )}
                </div>
              ))}
              {riwayatAbsensi.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-8">Belum ada riwayat absensi yang Anda input.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}`;

fs.writeFileSync(file, replacement);
console.log("Updated absensi-privat page!");

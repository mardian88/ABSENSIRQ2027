import { db } from "@/db";
import { santriPrivat, absensiPrivat } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FormAbsensiPrivat from "./FormAbsensiPrivat";
import { Badge } from "@/components/ui/badge";

export default async function AbsensiPrivatPage() {
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
    .orderBy(desc(absensiPrivat.waktuSesi))
    .limit(10);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Absensi & Capaian Privat</h2>
        <p className="text-muted-foreground">Catat kehadiran dan progres hafalan/jilid santri privat setelah sesi selesai.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Input Absensi Sesi Privat</CardTitle>
            <CardDescription>Pilih santri dan masukkan capaian hari ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormAbsensiPrivat daftarSantri={daftarSantri} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>10 Riwayat Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riwayatAbsensi.map((absen) => (
                <div key={absen.id} className="flex flex-col space-y-1 p-3 border rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{absen.santri.namaLengkap}</span>
                    <Badge variant={absen.statusKehadiran === 'hadir' ? 'default' : (absen.statusKehadiran === 'izin' ? 'secondary' : 'destructive')}>
                      {absen.statusKehadiran.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(absen.waktuSesi).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                  </div>
                  {absen.capaianHafalan && (
                    <div className="mt-2 text-sm bg-muted/50 p-2 rounded">
                      <span className="font-medium">Capaian:</span> {absen.capaianHafalan}
                    </div>
                  )}
                </div>
              ))}
              {riwayatAbsensi.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada riwayat absensi.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { db } from "@/db";
import { santriPrivat, keuanganPrivat } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import GenerateTagihanButton from "./GenerateTagihanButton";
import BayarButton from "./BayarButton";

export default async function KeuanganPrivatPage({ searchParams }: { searchParams: { bulan?: string, tahun?: string } }) {
  const now = new Date();
  const currentBulan = searchParams.bulan ? parseInt(searchParams.bulan) : now.getMonth() + 1;
  const currentTahun = searchParams.tahun ? parseInt(searchParams.tahun) : now.getFullYear();

  const dataTagihan = await db.select({
    id: keuanganPrivat.id,
    bulan: keuanganPrivat.bulan,
    tahun: keuanganPrivat.tahun,
    nominalTagihan: keuanganPrivat.nominalTagihan,
    status: keuanganPrivat.status,
    tanggalLunas: keuanganPrivat.tanggalLunas,
    santri: {
      namaLengkap: santriPrivat.namaLengkap,
      nomorInduk: santriPrivat.nomorInduk
    }
  }).from(keuanganPrivat)
    .innerJoin(santriPrivat, eq(keuanganPrivat.idSantriPrivat, santriPrivat.id))
    .where(and(eq(keuanganPrivat.bulan, currentBulan), eq(keuanganPrivat.tahun, currentTahun)))
    .orderBy(desc(keuanganPrivat.status));

  const totalTagihan = dataTagihan.reduce((acc, curr) => acc + curr.nominalTagihan, 0);
  const totalLunas = dataTagihan.filter(t => t.status === 'lunas').reduce((acc, curr) => acc + curr.nominalTagihan, 0);

  const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tagihan Privat</h2>
          <p className="text-muted-foreground">Manajemen SPP/Flat-rate bulanan santri privat.</p>
        </div>
        <GenerateTagihanButton bulan={currentBulan} tahun={currentTahun} namaBulan={namaBulan[currentBulan - 1]} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bulan Aktif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{namaBulan[currentBulan - 1]} {currentTahun}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Potensi Tagihan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {totalTagihan.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lunas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Rp {totalLunas.toLocaleString('id-ID')}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Tagihan Santri</CardTitle>
          <CardDescription>Menampilkan daftar tagihan pada periode terpilih.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Santri</TableHead>
                <TableHead>No. Induk</TableHead>
                <TableHead>Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataTagihan.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    Belum ada tagihan untuk bulan ini. Klik "Generate Tagihan" untuk membuat otomatis.
                  </TableCell>
                </TableRow>
              ) : (
                dataTagihan.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.santri.namaLengkap}</TableCell>
                    <TableCell>{t.santri.nomorInduk || "-"}</TableCell>
                    <TableCell>Rp {t.nominalTagihan.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge variant={t.status === 'lunas' ? 'default' : 'destructive'}>
                        {t.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <BayarButton idTagihan={t.id} status={t.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

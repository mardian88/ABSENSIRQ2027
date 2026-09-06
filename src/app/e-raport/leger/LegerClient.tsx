"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";
import toast from "react-hot-toast";

export function LegerClient({ halaqahList, semesterList }: { halaqahList: any[], semesterList: any[] }) {
  const [selectedHalaqah, setSelectedHalaqah] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [loading, setLoading] = useState(false);
  
  const [legerData, setLegerData] = useState<any>(null);
  const [printTarget, setPrintTarget] = useState<any>(null);

  useEffect(() => {
    if (selectedHalaqah && selectedSemester) {
      loadData();
    }
  }, [selectedHalaqah, selectedSemester]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { getLegerData } = await import('./actions');
      const res = await getLegerData(selectedHalaqah, selectedSemester);
      setLegerData(res);
    } catch (e) {
      toast.error("Gagal memuat data Leger");
    }
    setLoading(false);
  };

  const getPredikat = (nilai: number, skalaPenilaianJson: string) => {
    try {
      const skala = JSON.parse(skalaPenilaianJson);
      for (const s of skala) {
        if (nilai >= s.min && nilai <= s.max) return s.grade;
      }
    } catch(e) {}
    return "-";
  };

  const handlePrint = (row: any) => {
    setPrintTarget(row);
    // Give state time to render the print UI, then print
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* FILTER PANE - HIDDEN ON PRINT */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-50 p-4 rounded-lg border print:hidden">
        <div className="flex-1 space-y-2">
          <Label>Semester Aktif</Label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
          >
            <option value="">-- Pilih Semester --</option>
            {semesterList.map(s => (
              <option key={s.id} value={s.id}>{s.nama}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Halaqah</Label>
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
            value={selectedHalaqah}
            onChange={(e) => setSelectedHalaqah(e.target.value)}
          >
            <option value="">-- Pilih Halaqah --</option>
            {halaqahList.map(h => (
              <option key={h.id} value={h.id}>{h.namaHalaqoh}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="flex justify-center p-8 print:hidden"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}

      {/* LEGER TABLE - HIDDEN ON PRINT */}
      {!loading && legerData && (
        <Card className="print:hidden">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b">
                <tr>
                  <th className="px-4 py-3">NIS</th>
                  <th className="px-4 py-3">Nama Santri</th>
                  <th className="px-4 py-3 text-center">Akhlak</th>
                  <th className="px-4 py-3 text-center">Disiplin</th>
                  <th className="px-4 py-3 text-center">Tahsin</th>
                  <th className="px-4 py-3 text-center">UAS Tulis</th>
                  <th className="px-4 py-3 text-center">UAS Lisan</th>
                  <th className="px-4 py-3 text-center">Nilai Akhir</th>
                  <th className="px-4 py-3 text-center">Target Selesai (KB)</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {legerData.rows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-slate-400">Belum ada data santri di Halaqah ini.</td>
                  </tr>
                ) : (
                  legerData.rows.map((row: any) => (
                    <tr key={row.santri.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">{row.santri.nomorInduk}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.santri.namaLengkap}</td>
                      <td className="px-4 py-3 text-center">{row.averages.akhlak}</td>
                      <td className="px-4 py-3 text-center">{row.averages.kedisiplinan}</td>
                      <td className="px-4 py-3 text-center">{row.averages.tahsin}</td>
                      <td className="px-4 py-3 text-center">{row.kognitif.uasTulis}</td>
                      <td className="px-4 py-3 text-center">{row.kognitif.uasLisan}</td>
                      <td className="px-4 py-3 text-center font-bold text-indigo-700">
                        {row.raport?.nilaiAkhirTotal || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-emerald-600 font-medium">
                        {row.hafalan.tercapaiKb} / {row.hafalan.targetCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => handlePrint(row)}>
                          <Printer className="w-4 h-4 mr-2" /> Cetak
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* PRINTABLE RAPORT PAGE - VISIBLE ONLY ON PRINT */}
      {printTarget && legerData?.meta && (
        <div className="hidden print:block w-[210mm] min-h-[297mm] bg-white text-black p-8 mx-auto text-sm" style={{ fontFamily: "Times New Roman, serif" }}>
          
          {/* KOP */}
          <div className="flex items-center justify-between border-b-4 border-black pb-4 mb-6">
            <div className="w-24 h-24 bg-slate-100 flex items-center justify-center overflow-hidden">
              {legerData.meta.pengaturan?.logoUrl ? (
                <img src={legerData.meta.pengaturan.logoUrl} alt="Logo" className="object-contain" />
              ) : (
                <span className="text-xs text-slate-400">Logo</span>
              )}
            </div>
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold uppercase tracking-widest">{legerData.meta.pengaturan?.namaLembaga || "NAMA LEMBAGA"}</h1>
              <p className="text-sm mt-1">{legerData.meta.pengaturan?.alamatLembaga || "Alamat Lembaga"}</p>
              <p className="text-sm">Telp: {legerData.meta.pengaturan?.kontakLembaga || "-"}</p>
            </div>
            <div className="w-24 h-24"></div>
          </div>

          <h2 className="text-center text-lg font-bold underline mb-6 uppercase">LAPORAN HASIL BELAJAR SANTRI</h2>

          {/* BIODATA */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <table className="w-full">
              <tbody>
                <tr><td className="w-32 py-1">Nama Santri</td><td>: <strong>{printTarget.santri.namaLengkap}</strong></td></tr>
                <tr><td className="py-1">Nomor Induk</td><td>: {printTarget.santri.nomorInduk}</td></tr>
                <tr><td className="py-1">Halaqah</td><td>: {legerData.meta.halaqah?.namaHalaqoh}</td></tr>
              </tbody>
            </table>
            <table className="w-full">
              <tbody>
                <tr><td className="w-32 py-1">Tahun Ajaran</td><td>: {legerData.meta.tahunAjaran?.tahunAjaran || "-"}</td></tr>
                <tr><td className="py-1">Semester</td><td>: {legerData.meta.semester?.nama}</td></tr>
              </tbody>
            </table>
          </div>

          {/* NILAI AKHLAK & KEDISIPLINAN */}
          <h3 className="font-bold mb-2">A. NILAI AKHLAK & KEDISIPLINAN</h3>
          <table className="w-full border-collapse border border-black mb-6">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-black p-2 text-left w-1/2">Aspek Penilaian</th>
                <th className="border border-black p-2 text-center w-24">Nilai Angka</th>
                <th className="border border-black p-2 text-center">Predikat</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold bg-slate-50" colSpan={3}>1. Akhlak</td>
              </tr>
              <tr>
                <td className="border border-black p-2 pl-6">Adab & Sopan Santun</td>
                <td className="border border-black p-2 text-center">{printTarget.akhlak.adab}</td>
                <td className="border border-black p-2 text-center">{getPredikat(printTarget.akhlak.adab, legerData.meta.pengaturan?.skalaPenilaian)}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 pl-6">Kerajinan</td>
                <td className="border border-black p-2 text-center">{printTarget.akhlak.rajin}</td>
                <td className="border border-black p-2 text-center">{getPredikat(printTarget.akhlak.rajin, legerData.meta.pengaturan?.skalaPenilaian)}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 pl-6">Kerapian</td>
                <td className="border border-black p-2 text-center">{printTarget.akhlak.rapi}</td>
                <td className="border border-black p-2 text-center">{getPredikat(printTarget.akhlak.rapi, legerData.meta.pengaturan?.skalaPenilaian)}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-bold bg-slate-50" colSpan={3}>2. Kedisiplinan</td>
              </tr>
              <tr>
                <td className="border border-black p-2 pl-6">Kedisiplinan Waktu</td>
                <td className="border border-black p-2 text-center">{printTarget.kedisiplinan.waktu}</td>
                <td className="border border-black p-2 text-center">{getPredikat(printTarget.kedisiplinan.waktu, legerData.meta.pengaturan?.skalaPenilaian)}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 pl-6">Kedisiplinan Seragam</td>
                <td className="border border-black p-2 text-center">{printTarget.kedisiplinan.seragam}</td>
                <td className="border border-black p-2 text-center">{getPredikat(printTarget.kedisiplinan.seragam, legerData.meta.pengaturan?.skalaPenilaian)}</td>
              </tr>
              <tr>
                <td className="border border-black p-2 pl-6">Kedisiplinan Ibadah</td>
                <td className="border border-black p-2 text-center">{printTarget.kedisiplinan.ibadah}</td>
                <td className="border border-black p-2 text-center">{getPredikat(printTarget.kedisiplinan.ibadah, legerData.meta.pengaturan?.skalaPenilaian)}</td>
              </tr>
            </tbody>
          </table>

          {/* NILAI KOGNITIF */}
          <h3 className="font-bold mb-2">B. NILAI KOGNITIF (TAHSIN & AKADEMIK)</h3>
          <table className="w-full border-collapse border border-black mb-6">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-black p-2 text-left w-1/2">Aspek Penilaian</th>
                <th className="border border-black p-2 text-center w-24">Nilai Angka</th>
                <th className="border border-black p-2 text-center">Predikat</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-2 font-bold bg-slate-50" colSpan={3}>1. Tahsin Al-Quran</td>
              </tr>
              {legerData.meta.tahsinItems.map((item: any) => {
                const nilaiItem = printTarget.kognitif.tahsin[item.id] || 0;
                return (
                  <tr key={item.id}>
                    <td className="border border-black p-2 pl-6">{item.namaItem}</td>
                    <td className="border border-black p-2 text-center">{nilaiItem}</td>
                    <td className="border border-black p-2 text-center">{getPredikat(nilaiItem, legerData.meta.pengaturan?.skalaPenilaian)}</td>
                  </tr>
                )
              })}
              <tr>
                <td className="border border-black p-2 font-bold bg-slate-50" colSpan={3}>2. Ujian Akademik</td>
              </tr>
              <tr>
                <td className="border border-black p-2 pl-6">Ujian Tulis</td>
                <td className="border border-black p-2 text-center">{printTarget.kognitif.uasTulis}</td>
                <td className="border border-black p-2 text-center">{getPredikat(printTarget.kognitif.uasTulis, legerData.meta.pengaturan?.skalaPenilaian)}</td>
              </tr>
              {legerData.meta.pengaturan?.showUasLisan && (
                <tr>
                  <td className="border border-black p-2 pl-6">Ujian Lisan</td>
                  <td className="border border-black p-2 text-center">{printTarget.kognitif.uasLisan}</td>
                  <td className="border border-black p-2 text-center">{getPredikat(printTarget.kognitif.uasLisan, legerData.meta.pengaturan?.skalaPenilaian)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="page-break" style={{ pageBreakBefore: 'always' }}></div>

          {/* TARGET HAFALAN SURAH */}
          <h3 className="font-bold mb-2 pt-8">C. CAPAIAN TAHFIDZ AL-QURAN</h3>
          <table className="w-full border-collapse border border-black mb-6">
            <thead>
              <tr className="bg-slate-200">
                <th className="border border-black p-2 text-center w-12">No</th>
                <th className="border border-black p-2 text-left">Nama Surah Target</th>
                <th className="border border-black p-2 text-center w-24">KB</th>
                <th className="border border-black p-2 text-center w-24">KH</th>
                <th className="border border-black p-2 text-center w-24">Nilai</th>
                <th className="border border-black p-2 text-center w-32">Predikat</th>
              </tr>
            </thead>
            <tbody>
              {printTarget.hafalan.detail.length === 0 ? (
                <tr>
                  <td className="border border-black p-4 text-center italic" colSpan={6}>Belum ada target surah yang ditugaskan.</td>
                </tr>
              ) : (
                printTarget.hafalan.detail.map((surah: any, idx: number) => (
                  <tr key={surah.idSurah}>
                    <td className="border border-black p-2 text-center">{idx + 1}</td>
                    <td className="border border-black p-2">
                      <div className="flex justify-between items-center">
                        <span>{surah.namaSurah}</span>
                        <span className="font-arabic text-lg">{surah.namaArab}</span>
                      </div>
                    </td>
                    <td className="border border-black p-2 text-center">{surah.kb ? '✅' : '-'}</td>
                    <td className="border border-black p-2 text-center">{surah.kh ? '✅' : '-'}</td>
                    <td className="border border-black p-2 text-center">{surah.nilai || '-'}</td>
                    <td className="border border-black p-2 text-center">{surah.predikat || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* KEHADIRAN & CATATAN */}
          <div className="grid grid-cols-2 gap-8 mb-12">
            <div>
              <h3 className="font-bold mb-2">D. KEHADIRAN</h3>
              <table className="w-full border-collapse border border-black">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 w-1/2">Sakit (S)</td>
                    <td className="border border-black p-2 text-center">{printTarget.raport?.sakit || 0} Hari</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Izin (I)</td>
                    <td className="border border-black p-2 text-center">{printTarget.raport?.izin || 0} Hari</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2">Alpa (A)</td>
                    <td className="border border-black p-2 text-center">{printTarget.raport?.alpa || 0} Hari</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="font-bold mb-2">E. CATATAN WALI KELAS</h3>
              <div className="border border-black p-4 min-h-[120px] italic">
                {printTarget.raport?.catatanWaliKelas || "-"}
              </div>
            </div>
          </div>

          {/* TANDA TANGAN */}
          <div className="flex justify-between mt-12 text-center px-8">
            <div className="flex flex-col items-center justify-end w-48">
              <p className="mb-16">Mengetahui,<br/>Orang Tua / Wali</p>
              <p className="font-bold underline w-full border-b border-black inline-block"></p>
            </div>
            
            <div className="flex flex-col items-center justify-end w-48">
              <p className="mb-16">Kepala Lembaga</p>
              <p className="font-bold border-b border-black uppercase">{legerData.meta.pengaturan?.namaKepala || "K E P A L A"}</p>
              {legerData.meta.pengaturan?.nipKepala && <p>NIP: {legerData.meta.pengaturan?.nipKepala}</p>}
            </div>
            
            <div className="flex flex-col items-center justify-end w-48">
              <p className="mb-16">Wali Kelas / Pengampu</p>
              <p className="font-bold border-b border-black uppercase">{legerData.meta.halaqah?.namaPengajar || "WALI KELAS"}</p>
            </div>
          </div>

        </div>
      )}

      {/* STYLES FOR PRINTING */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}} />
    </div>
  );
}

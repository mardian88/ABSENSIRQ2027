"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import toast from "react-hot-toast";

type SurahProgress = {
  idSurah: string;
  namaSurah: string;
  namaArab: string;
  nomorSurah: number;
  jumlahAyat: number;
  idProgress: string | null;
  statusSetoran: string;
  nilaiKb: number | null;
  predikatKb: string;
  catatanKb: string;
  nilaiKh: number | null;
  predikatKh: string;
  catatanKh: string;
};

type SantriRow = {
  idSantri: string;
  namaSantri: string;
  nis: string;
  idRaport: string | null;
  surahProgress: SurahProgress[];
};

export function SetoranClient({ halaqahList, semesterList }: { halaqahList: any[], semesterList: any[] }) {
  const [selectedHalaqah, setSelectedHalaqah] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [santriData, setSantriData] = useState<SantriRow[]>([]);
  const [skalaPenilaian, setSkalaPenilaian] = useState<any[]>([]);
  const [expandedSantri, setExpandedSantri] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (selectedHalaqah && selectedSemester) loadData();
  }, [selectedHalaqah, selectedSemester]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { getSetoranData } = await import('./actions');
      const res = await getSetoranData(selectedHalaqah, selectedSemester);
      setSantriData(res.santriData);
      setSkalaPenilaian(res.skalaPenilaian);
    } catch (e) {
      toast.error("Gagal memuat data setoran");
    }
    setLoading(false);
  };

  const getPredikat = (nilai: number | null) => {
    if (nilai === null || nilai === undefined) return "";
    for (const s of skalaPenilaian) {
      if (nilai >= s.min && nilai <= s.max) return s.grade;
    }
    return "";
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedSantri);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedSantri(next);
  };

  const updateSurahField = (santriIdx: number, surahIdx: number, field: keyof SurahProgress, value: any) => {
    const copy = [...santriData];
    const surah = { ...copy[santriIdx].surahProgress[surahIdx] };

    if (field === "nilaiKb") {
      const num = value === "" ? null : parseInt(value) || 0;
      surah.nilaiKb = num;
      surah.predikatKb = num !== null ? getPredikat(num) : "";
      if (num !== null && num > 0) surah.statusSetoran = surah.statusSetoran || "Sudah Setor";
    } else if (field === "nilaiKh") {
      const num = value === "" ? null : parseInt(value) || 0;
      surah.nilaiKh = num;
      surah.predikatKh = num !== null ? getPredikat(num) : "";
    } else {
      (surah as any)[field] = value;
    }

    copy[santriIdx].surahProgress[surahIdx] = surah;
    setSantriData(copy);
  };

  const handleSave = async (santriIdx: number) => {
    const row = santriData[santriIdx];
    setSaving(row.idSantri);
    try {
      const { saveSetoranProgress } = await import('./actions');
      await saveSetoranProgress(
        row.idSantri,
        selectedSemester,
        selectedHalaqah,
        row.surahProgress.map(s => ({
          idSurah: s.idSurah,
          idProgress: s.idProgress,
          statusSetoran: s.statusSetoran,
          nilaiKb: s.nilaiKb,
          predikatKb: s.predikatKb,
          catatanKb: s.catatanKb,
          nilaiKh: s.nilaiKh,
          predikatKh: s.predikatKh,
          catatanKh: s.catatanKh,
        }))
      );
      toast.success(`Setoran ${row.namaSantri} berhasil disimpan!`);
      loadData(); // Refresh to get new IDs
    } catch (e) {
      toast.error("Gagal menyimpan setoran");
    }
    setSaving(null);
  };

  const getStatusColor = (sp: SurahProgress) => {
    if (sp.nilaiKh !== null && sp.nilaiKh > 0) return "bg-emerald-50 border-emerald-200";
    if (sp.nilaiKb !== null && sp.nilaiKb > 0) return "bg-amber-50 border-amber-200";
    return "bg-white border-slate-200";
  };

  const getStatusBadge = (sp: SurahProgress) => {
    if (sp.nilaiKh !== null && sp.nilaiKh > 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">KH ✓</span>;
    if (sp.nilaiKb !== null && sp.nilaiKb > 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">KB ✓</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Belum</span>;
  };

  return (
    <div className="space-y-6">
      {/* FILTER */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-50 p-4 rounded-lg border">
        <div className="flex-1 space-y-2">
          <Label>Semester</Label>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)}>
            <option value="">-- Pilih Semester --</option>
            {semesterList.map(s => <option key={s.id} value={s.id}>{s.nama}</option>)}
          </select>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Halaqah</Label>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={selectedHalaqah} onChange={e => setSelectedHalaqah(e.target.value)}>
            <option value="">-- Pilih Halaqah --</option>
            {halaqahList.map(h => <option key={h.id} value={h.id}>{h.namaHalaqoh}</option>)}
          </select>
        </div>
      </div>

      {loading && <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}

      {/* SANTRI CARDS */}
      {!loading && santriData.length > 0 && santriData.map((row, sIdx) => {
        const isExpanded = expandedSantri.has(row.idSantri);
        const totalSurah = row.surahProgress.length;
        const kbCount = row.surahProgress.filter(s => s.nilaiKb !== null && s.nilaiKb > 0).length;
        const khCount = row.surahProgress.filter(s => s.nilaiKh !== null && s.nilaiKh > 0).length;

        return (
          <Card key={row.idSantri} className="overflow-hidden">
            {/* HEADER */}
            <div 
              className="bg-indigo-50/60 p-4 border-b cursor-pointer flex items-center justify-between hover:bg-indigo-50 transition-colors"
              onClick={() => toggleExpand(row.idSantri)}
            >
              <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{row.namaSantri}</h3>
                  <p className="text-sm text-slate-500">NIS: {row.nis}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden md:block">
                  <div className="flex gap-3">
                    <span className="text-xs text-slate-500">Target: <strong className="text-slate-700">{totalSurah}</strong></span>
                    <span className="text-xs text-amber-600">KB: <strong>{kbCount}</strong></span>
                    <span className="text-xs text-emerald-600">KH: <strong>{khCount}</strong></span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-48 bg-slate-200 rounded-full h-2 mt-1.5">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${totalSurah ? (khCount / totalSurah) * 100 : 0}%` }}></div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </div>

            {/* EXPANDED BODY */}
            {isExpanded && (
              <CardContent className="p-0">
                {totalSurah === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8 italic">Belum ada surah yang ditugaskan. Atur di menu Tugas Surah Santri.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                          <tr>
                            <th className="px-4 py-3 text-left">Surah</th>
                            <th className="px-4 py-3 text-center">Status</th>
                            <th className="px-3 py-3 text-center" colSpan={3}>
                              <span className="text-amber-700">KB (<em>Khotam Baru</em>)</span>
                            </th>
                            <th className="px-3 py-3 text-center" colSpan={3}>
                              <span className="text-emerald-700">KH (<em>Khotam Hafalan</em>)</span>
                            </th>
                          </tr>
                          <tr className="bg-slate-50 text-[10px]">
                            <th className="px-4 py-1"></th>
                            <th className="px-4 py-1"></th>
                            <th className="px-3 py-1 text-center text-amber-600">Nilai</th>
                            <th className="px-3 py-1 text-center text-amber-600">Predikat</th>
                            <th className="px-3 py-1 text-center text-amber-600">Catatan</th>
                            <th className="px-3 py-1 text-center text-emerald-600">Nilai</th>
                            <th className="px-3 py-1 text-center text-emerald-600">Predikat</th>
                            <th className="px-3 py-1 text-center text-emerald-600">Catatan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {row.surahProgress.map((sp, spIdx) => (
                            <tr key={sp.idSurah} className={`${getStatusColor(sp)} transition-colors`}>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-slate-400 w-6">{sp.nomorSurah}.</span>
                                  <div>
                                    <p className="font-medium text-slate-800">{sp.namaSurah}</p>
                                    <p className="text-xs text-slate-400">{sp.jumlahAyat} Ayat</p>
                                  </div>
                                  <span className="text-lg ml-auto font-arabic text-slate-500">{sp.namaArab}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">{getStatusBadge(sp)}</td>
                              {/* KB */}
                              <td className="px-2 py-3 text-center">
                                <Input 
                                  type="number" min={0} max={100} className="h-8 w-16 text-center mx-auto" 
                                  value={sp.nilaiKb ?? ""} 
                                  onChange={e => updateSurahField(sIdx, spIdx, "nilaiKb", e.target.value)} 
                                />
                              </td>
                              <td className="px-2 py-3 text-center">
                                <span className="text-xs font-semibold italic text-amber-700">{sp.predikatKb || "-"}</span>
                              </td>
                              <td className="px-2 py-3 text-center">
                                <Input 
                                  type="text" className="h-8 w-24 text-xs" placeholder="Catatan..." 
                                  value={sp.catatanKb} 
                                  onChange={e => updateSurahField(sIdx, spIdx, "catatanKb", e.target.value)} 
                                />
                              </td>
                              {/* KH */}
                              <td className="px-2 py-3 text-center">
                                <Input 
                                  type="number" min={0} max={100} className="h-8 w-16 text-center mx-auto" 
                                  value={sp.nilaiKh ?? ""} 
                                  onChange={e => updateSurahField(sIdx, spIdx, "nilaiKh", e.target.value)} 
                                />
                              </td>
                              <td className="px-2 py-3 text-center">
                                <span className="text-xs font-semibold italic text-emerald-700">{sp.predikatKh || "-"}</span>
                              </td>
                              <td className="px-2 py-3 text-center">
                                <Input 
                                  type="text" className="h-8 w-24 text-xs" placeholder="Catatan..." 
                                  value={sp.catatanKh} 
                                  onChange={e => updateSurahField(sIdx, spIdx, "catatanKh", e.target.value)} 
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="p-4 border-t bg-slate-50 flex justify-end">
                      <Button 
                        onClick={() => handleSave(sIdx)} 
                        disabled={saving === row.idSantri}
                        className="bg-indigo-600 hover:bg-indigo-700"
                      >
                        {saving === row.idSantri ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Simpan Setoran {row.namaSantri.split(" ")[0]}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {!loading && selectedHalaqah && selectedSemester && santriData.length === 0 && (
        <p className="text-center text-slate-400 py-12">Tidak ada santri di Halaqah ini.</p>
      )}
    </div>
  );
}

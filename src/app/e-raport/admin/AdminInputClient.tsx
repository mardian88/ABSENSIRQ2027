"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import toast from "react-hot-toast";

export function AdminInputClient({ halaqahList, semesterList }: { halaqahList: any[], semesterList: any[] }) {
  const [selectedHalaqah, setSelectedHalaqah] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [santriData, setSantriData] = useState<any[]>([]);
  const [tahsinItems, setTahsinItems] = useState<any[]>([]);
  const [bobot, setBobot] = useState<any>(null);

  useEffect(() => {
    if (selectedHalaqah && selectedSemester) {
      loadData();
    }
  }, [selectedHalaqah, selectedSemester]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { getAdminInputData } = await import('./actions');
      const res = await getAdminInputData(selectedHalaqah, selectedSemester);
      
      // Parse JSON fields
      const parsedSantri = res.santriData.map(s => {
        let akhlak = { adab: 0, rajin: 0, rapi: 0 };
        let kedisiplinan = { waktu: 0, seragam: 0, ibadah: 0 };
        let kognitif = { uasTulis: 0, uasLisan: 0, tahsin: {} };
        
        if (s.raport) {
          if (s.raport.akhlak) akhlak = JSON.parse(s.raport.akhlak);
          if (s.raport.kedisiplinan) kedisiplinan = JSON.parse(s.raport.kedisiplinan);
          if (s.raport.kognitif) kognitif = JSON.parse(s.raport.kognitif);
        } else {
          // Initialize empty tahsin
          res.tahsinItems.forEach((t: any) => {
            (kognitif.tahsin as any)[t.id] = 0;
          });
        }
        
        return {
          ...s,
          form: {
            sakit: s.raport?.sakit || 0,
            izin: s.raport?.izin || 0,
            alpa: s.raport?.alpa || 0,
            catatanWaliKelas: s.raport?.catatanWaliKelas || "",
            akhlak,
            kedisiplinan,
            kognitif
          }
        };
      });
      
      setTahsinItems(res.tahsinItems);
      setBobot(res.bobot);
      setSantriData(parsedSantri);
    } catch (e) {
      toast.error("Gagal memuat data");
    }
    setLoading(false);
  };

  const handleInputChange = (index: number, category: string, field: string, value: string) => {
    const newData = [...santriData];
    const numValue = parseInt(value) || 0;
    
    if (category === "root") {
      newData[index].form[field] = field === "catatanWaliKelas" ? value : numValue;
    } else if (category === "tahsin") {
      newData[index].form.kognitif.tahsin[field] = numValue;
    } else {
      newData[index].form[category][field] = numValue;
    }
    
    setSantriData(newData);
  };

  const calculateNilaiAkhir = (form: any) => {
    if (!bobot) return 0;
    
    // Akhlak Average
    const akVals = Object.values(form.akhlak) as number[];
    const akAvg = akVals.length ? akVals.reduce((a, b) => a + b, 0) / akVals.length : 0;
    
    // Kedisiplinan Average
    const kdVals = Object.values(form.kedisiplinan) as number[];
    const kdAvg = kdVals.length ? kdVals.reduce((a, b) => a + b, 0) / kdVals.length : 0;
    
    // Kognitif Average
    const tahsinVals = Object.values(form.kognitif.tahsin) as number[];
    const tahsinAvg = tahsinVals.length ? tahsinVals.reduce((a, b) => a + b, 0) / tahsinVals.length : 0;
    const kgAvg = (tahsinAvg + form.kognitif.uasTulis + form.kognitif.uasLisan) / 3;
    
    // Total
    const total = (akAvg * (bobot.bobotAkhlak / 100)) + 
                  (kdAvg * (bobot.bobotKedisiplinan / 100)) + 
                  (kgAvg * (bobot.bobotKognitif / 100));
                  
    return Math.round(total);
  };

  const handleSaveAll = async () => {
    setLoading(true);
    try {
      const { saveAdminInput } = await import('./actions');
      const { v4: uuidv4 } = await import('uuid');
      
      const payload = santriData.map(s => {
        // Prepare DB payload
        const now = new Date();
        const nilaiAkhirTotal = calculateNilaiAkhir(s.form);
        
        return {
          idRaport: s.raport?.id,
          payload: {
            id: s.raport?.id || uuidv4(),
            idSantri: s.idSantri,
            idSemester: selectedSemester,
            idHalaqah: selectedHalaqah,
            akhlak: JSON.stringify(s.form.akhlak),
            kedisiplinan: JSON.stringify(s.form.kedisiplinan),
            kognitif: JSON.stringify(s.form.kognitif),
            sakit: s.form.sakit,
            izin: s.form.izin,
            alpa: s.form.alpa,
            nilaiAkhirTotal,
            catatanWaliKelas: s.form.catatanWaliKelas,
            waktuDibuat: s.raport?.waktuDibuat || now,
            diperbaruiPada: now
          }
        };
      });
      
      await saveAdminInput(payload);
      toast.success("Berhasil menyimpan nilai!");
      loadData();
    } catch (error) {
      toast.error("Gagal menyimpan data");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 bg-slate-50 p-4 rounded-lg border">
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

      {loading && <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}

      {!loading && santriData.length > 0 && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={handleSaveAll} className="bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4 mr-2" /> Simpan Semua Nilai
            </Button>
          </div>

          {santriData.map((santri, idx) => (
            <Card key={santri.idSantri} className="overflow-hidden border-indigo-100">
              <div className="bg-indigo-50/50 p-4 border-b flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{santri.namaSantri}</h3>
                  <p className="text-sm text-slate-500">NIS: {santri.nis}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Estimasi Nilai Akhir</p>
                  <p className="text-2xl font-bold text-indigo-600">{calculateNilaiAkhir(santri.form)}</p>
                </div>
              </div>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 md:divide-x">
                  
                  {/* Akhlak */}
                  <div className="p-4 space-y-4">
                    <h4 className="font-semibold text-emerald-700 flex items-center gap-2">
                      <span className="bg-emerald-100 p-1 rounded">🌟</span> Akhlak ({bobot?.bobotAkhlak}%)
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Adab & Sopan Santun</Label>
                        <Input type="number" min={0} max={100} value={santri.form.akhlak.adab} onChange={e => handleInputChange(idx, "akhlak", "adab", e.target.value)} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-xs">Kerajinan</Label>
                        <Input type="number" min={0} max={100} value={santri.form.akhlak.rajin} onChange={e => handleInputChange(idx, "akhlak", "rajin", e.target.value)} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-xs">Kerapian</Label>
                        <Input type="number" min={0} max={100} value={santri.form.akhlak.rapi} onChange={e => handleInputChange(idx, "akhlak", "rapi", e.target.value)} className="h-8" />
                      </div>
                    </div>
                  </div>

                  {/* Kedisiplinan */}
                  <div className="p-4 space-y-4">
                    <h4 className="font-semibold text-blue-700 flex items-center gap-2">
                      <span className="bg-blue-100 p-1 rounded">⏱️</span> Kedisiplinan ({bobot?.bobotKedisiplinan}%)
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs">Kedisiplinan Waktu</Label>
                        <Input type="number" min={0} max={100} value={santri.form.kedisiplinan.waktu} onChange={e => handleInputChange(idx, "kedisiplinan", "waktu", e.target.value)} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-xs">Kedisiplinan Seragam</Label>
                        <Input type="number" min={0} max={100} value={santri.form.kedisiplinan.seragam} onChange={e => handleInputChange(idx, "kedisiplinan", "seragam", e.target.value)} className="h-8" />
                      </div>
                      <div>
                        <Label className="text-xs">Kedisiplinan Ibadah</Label>
                        <Input type="number" min={0} max={100} value={santri.form.kedisiplinan.ibadah} onChange={e => handleInputChange(idx, "kedisiplinan", "ibadah", e.target.value)} className="h-8" />
                      </div>
                    </div>
                  </div>

                  {/* Kognitif / Tahsin */}
                  <div className="p-4 space-y-4">
                    <h4 className="font-semibold text-amber-700 flex items-center gap-2">
                      <span className="bg-amber-100 p-1 rounded">📖</span> Kognitif ({bobot?.bobotKognitif}%)
                    </h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                      {tahsinItems.map(t => (
                        <div key={t.id}>
                          <Label className="text-xs truncate" title={t.namaItem}>{t.namaItem}</Label>
                          <Input type="number" min={0} max={100} value={santri.form.kognitif.tahsin[t.id] || 0} onChange={e => handleInputChange(idx, "tahsin", t.id, e.target.value)} className="h-8" />
                        </div>
                      ))}
                      <div>
                        <Label className="text-xs">Ujian Tertulis</Label>
                        <Input type="number" min={0} max={100} value={santri.form.kognitif.uasTulis} onChange={e => handleInputChange(idx, "kognitif", "uasTulis", e.target.value)} className="h-8 border-amber-300" />
                      </div>
                      <div>
                        <Label className="text-xs">Ujian Lisan</Label>
                        <Input type="number" min={0} max={100} value={santri.form.kognitif.uasLisan} onChange={e => handleInputChange(idx, "kognitif", "uasLisan", e.target.value)} className="h-8 border-amber-300" />
                      </div>
                    </div>
                  </div>

                  {/* Kehadiran & Catatan */}
                  <div className="p-4 space-y-4">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2">
                      <span className="bg-slate-200 p-1 rounded">📋</span> Kehadiran & Catatan
                    </h4>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs text-rose-600">Sakit</Label>
                        <Input type="number" min={0} value={santri.form.sakit} onChange={e => handleInputChange(idx, "root", "sakit", e.target.value)} className="h-8" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-amber-600">Izin</Label>
                        <Input type="number" min={0} value={santri.form.izin} onChange={e => handleInputChange(idx, "root", "izin", e.target.value)} className="h-8" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-red-600">Alpa</Label>
                        <Input type="number" min={0} value={santri.form.alpa} onChange={e => handleInputChange(idx, "root", "alpa", e.target.value)} className="h-8" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Catatan Wali Kelas</Label>
                      <textarea 
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px]"
                        placeholder="Tulis pesan penyemangat..."
                        value={santri.form.catatanWaliKelas}
                        onChange={e => handleInputChange(idx, "root", "catatanWaliKelas", e.target.value)}
                      />
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

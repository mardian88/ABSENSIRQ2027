"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Search, CheckSquare, Square } from "lucide-react";
import toast from "react-hot-toast";

export function SurahSantriClient({ halaqahList, surahList }: { halaqahList: any[], surahList: any[] }) {
  const [selectedHalaqah, setSelectedHalaqah] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [santriData, setSantriData] = useState<any[]>([]);
  
  // Modal state
  const [activeSantri, setActiveSantri] = useState<any | null>(null);
  const [tempSelection, setTempSelection] = useState<Set<string>>(new Set());
  const [searchSurah, setSearchSurah] = useState("");

  useEffect(() => {
    if (selectedHalaqah) {
      loadData();
    }
  }, [selectedHalaqah]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { getSurahAssignments } = await import('./actions');
      const res = await getSurahAssignments(selectedHalaqah);
      setSantriData(res);
    } catch (e) {
      toast.error("Gagal memuat data santri");
    }
    setLoading(false);
  };

  const openModal = (santri: any) => {
    setActiveSantri(santri);
    setTempSelection(new Set(santri.assignedSurahIds));
    setSearchSurah("");
  };

  const toggleSurah = (surahId: string) => {
    const newSet = new Set(tempSelection);
    if (newSet.has(surahId)) {
      newSet.delete(surahId);
    } else {
      newSet.add(surahId);
    }
    setTempSelection(newSet);
  };

  const saveSelection = async () => {
    if (!activeSantri) return;
    setLoading(true);
    try {
      const { saveSurahAssignments } = await import('./actions');
      const newSurahIds = Array.from(tempSelection);
      await saveSurahAssignments(activeSantri.idSantri, newSurahIds);
      
      toast.success("Berhasil menyimpan target surah!");
      setActiveSantri(null);
      loadData();
    } catch (error) {
      toast.error("Gagal menyimpan data");
    }
    setLoading(false);
  };

  const filteredSurahs = surahList.filter(s => 
    s.namaSurah.toLowerCase().includes(searchSurah.toLowerCase()) || 
    s.namaArab.includes(searchSurah)
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-50 p-4 rounded-lg border max-w-sm">
        <div className="space-y-2">
          <Label>Pilih Halaqah</Label>
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

      {loading && !activeSantri && <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>}

      {!loading && santriData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {santriData.map(santri => (
            <Card key={santri.idSantri} className="flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{santri.namaSantri}</h3>
                  <p className="text-sm text-slate-500">NIS: {santri.nis}</p>
                </div>
                
                <div className="bg-indigo-50 rounded p-3">
                  <p className="text-sm font-medium text-indigo-800 mb-1">Target Hafalan:</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {santri.assignedSurahIds.length} <span className="text-sm font-normal text-indigo-600/70">Surah</span>
                  </p>
                </div>

                <Button variant="outline" className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => openModal(santri)}>
                  Atur Target Surah
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL PILIH SURAH */}
      {activeSantri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-indigo-50 rounded-t-xl">
              <div>
                <h3 className="font-bold text-lg">Pilih Target Surah</h3>
                <p className="text-sm text-slate-600">Santri: {activeSantri.namaSantri}</p>
              </div>
              <Button variant="ghost" onClick={() => setActiveSantri(null)}>Tutup</Button>
            </div>
            
            <div className="p-4 border-b bg-slate-50">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari nama surah..." 
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 pl-9 text-sm"
                  value={searchSurah}
                  onChange={e => setSearchSurah(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSurahs.map(surah => {
                  const isSelected = tempSelection.has(surah.id);
                  return (
                    <div 
                      key={surah.id} 
                      onClick={() => toggleSurah(surah.id)}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-indigo-100 border-indigo-300' : 'bg-white border-slate-200 hover:border-indigo-200'}`}
                    >
                      <div className="flex items-center gap-3">
                        {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-300" />}
                        <div>
                          <p className={`font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                            {surah.nomorSurah}. {surah.namaSurah}
                          </p>
                          <p className="text-xs text-slate-500">{surah.jumlahAyat} Ayat</p>
                        </div>
                      </div>
                      <p className={`text-xl font-arabic ${isSelected ? 'text-indigo-900' : 'text-slate-400'}`}>
                        {surah.namaArab}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t flex justify-between items-center bg-white rounded-b-xl">
              <p className="text-sm font-medium text-slate-600">
                Terpilih: <span className="text-indigo-600 font-bold">{tempSelection.size}</span> Surah
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setActiveSantri(null)}>Batal</Button>
                <Button onClick={saveSelection} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Simpan Target
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

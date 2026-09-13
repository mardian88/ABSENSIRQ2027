"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Plus, Trash2, Edit2, CheckCircle2, X } from "lucide-react";
import toast from "react-hot-toast";

export function PengaturanRaportManager() {
  const [activeSubTab, setActiveSubTab] = useState("lembaga");

  // State Profil
  const [profil, setProfil] = useState<any>(null);
  const [loadingProfil, setLoadingProfil] = useState(true);
  const [savingProfil, setSavingProfil] = useState(false);

  // State Akademik
  const [tahunAjaranList, setTahunAjaranList] = useState<any[]>([]);
  const [semesterList, setSemesterList] = useState<any[]>([]);
  const [loadingAkademik, setLoadingAkademik] = useState(true);
  const [newTahunAjaran, setNewTahunAjaran] = useState("");
  const [savingAkademik, setSavingAkademik] = useState(false);
  const [selectedTahunAjaranId, setSelectedTahunAjaranId] = useState<string | null>(null);

  // State Tahsin
  const [tahsinList, setTahsinList] = useState<any[]>([]);
  const [loadingTahsin, setLoadingTahsin] = useState(true);
  const [tahsinForm, setTahsinForm] = useState({ id: "", namaItem: "", urutan: 1, isAktif: true });
  const [isEditingTahsin, setIsEditingTahsin] = useState(false);
  const [savingTahsin, setSavingTahsin] = useState(false);

  useEffect(() => {
    if (activeSubTab === "lembaga") loadProfil();
    if (activeSubTab === "akademik") loadAkademik();
    if (activeSubTab === "tahsin") loadTahsin();
  }, [activeSubTab]);

  // ======================
  // PROFIL LOGIC
  // ======================
  const loadProfil = async () => {
    setLoadingProfil(true);
    const { getPengaturanRaport } = await import('./raport-actions');
    const data = await getPengaturanRaport();
    if (data) {
      setProfil(data);
    } else {
      setProfil({
        namaLembaga: "",
        alamatLembaga: "",
        kontakLembaga: "",
        namaKepala: "",
        nipKepala: "",
        logoUrl: "",
        ttdKepalaUrl: "",
        bobotAkhlak: 20,
        bobotKedisiplinan: 20,
        bobotKognitif: 60,
        skalaPenilaian: JSON.stringify([
          { min: 90, max: 100, grade: "Mumtaz" },
          { min: 80, max: 89, grade: "Jayyid Jiddan" },
          { min: 70, max: 79, grade: "Jayyid" },
          { min: 60, max: 69, grade: "Maqbul" },
          { min: 0, max: 59, grade: "Naqish" },
        ]),
        showUasLisan: true
      });
    }
    setLoadingProfil(false);
  };

  const handleSaveProfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profil) return;
    if (profil.bobotAkhlak + profil.bobotKedisiplinan + profil.bobotKognitif !== 100) {
      toast.error("Total bobot harus tepat 100%");
      return;
    }
    setSavingProfil(true);
    try {
      const { savePengaturanRaport } = await import('./raport-actions');
      await savePengaturanRaport(profil);
      toast.success("Profil Raport berhasil disimpan");
    } catch (error) {
      toast.error("Gagal menyimpan profil");
    }
    setSavingProfil(false);
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'ttdKepalaUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      setSavingProfil(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const { uploadImageToCloudinary } = await import("./actions");
        const url = await uploadImageToCloudinary(formData);
        
        const updated = { ...profil, [field]: url };
        setProfil(updated);
        
        const { savePengaturanRaport } = await import('./raport-actions');
        await savePengaturanRaport(updated);
        toast.success(field === 'logoUrl' ? "Logo berhasil diunggah" : "Tanda tangan berhasil diunggah");
      } catch (error) {
        toast.error("Gagal mengunggah gambar");
      }
      setSavingProfil(false);
    }
  };

  // ======================
  // AKADEMIK LOGIC
  // ======================
  const loadAkademik = async () => {
    setLoadingAkademik(true);
    const { getTahunAjaranList } = await import('./raport-actions');
    const ta = await getTahunAjaranList();
    setTahunAjaranList(ta);
    if (ta.length > 0 && !selectedTahunAjaranId) {
      const activeTa = ta.find(t => t.isAktif) || ta[0];
      setSelectedTahunAjaranId(activeTa.id);
      loadSemesters(activeTa.id);
    } else if (selectedTahunAjaranId) {
      loadSemesters(selectedTahunAjaranId);
    }
    setLoadingAkademik(false);
  };

  const loadSemesters = async (idTa: string) => {
    const { getSemesterList } = await import('./raport-actions');
    const sems = await getSemesterList(idTa);
    setSemesterList(sems);
  };

  const handleAddTa = async () => {
    if (!newTahunAjaran) return toast.error("Nama Tahun Ajaran wajib diisi");
    setSavingAkademik(true);
    try {
      const { createTahunAjaran } = await import('./raport-actions');
      await createTahunAjaran(newTahunAjaran);
      setNewTahunAjaran("");
      toast.success("Tahun Ajaran berhasil ditambahkan");
      loadAkademik();
    } catch (e) {
      toast.error("Gagal menambah Tahun Ajaran");
    }
    setSavingAkademik(false);
  };

  const handleActivateTa = async (id: string) => {
    setSavingAkademik(true);
    try {
      const { setActiveTahunAjaran } = await import('./raport-actions');
      await setActiveTahunAjaran(id);
      toast.success("Tahun Ajaran diaktifkan");
      loadAkademik();
    } catch (e) {
      toast.error("Gagal mengaktifkan Tahun Ajaran");
    }
    setSavingAkademik(false);
  };

  const handleActivateSemester = async (id: string) => {
    setSavingAkademik(true);
    try {
      const { setActiveSemester } = await import('./raport-actions');
      await setActiveSemester(id);
      toast.success("Semester diaktifkan");
      loadSemesters(selectedTahunAjaranId!);
    } catch (e) {
      toast.error("Gagal mengaktifkan Semester");
    }
    setSavingAkademik(false);
  };

  const handleUpdateHariEfektif = async (id: string, value: string) => {
    const num = parseInt(value);
    if (isNaN(num)) return;
    try {
      const { updateSemesterHariEfektif } = await import('./raport-actions');
      await updateSemesterHariEfektif(id, num);
      toast.success("Hari efektif diperbarui");
      loadSemesters(selectedTahunAjaranId!);
    } catch (e) {
      toast.error("Gagal memperbarui hari efektif");
    }
  };

  // ======================
  // TAHSIN LOGIC
  // ======================
  const loadTahsin = async () => {
    setLoadingTahsin(true);
    const { getTahsinItems } = await import('./raport-actions');
    const items = await getTahsinItems();
    setTahsinList(items);
    setTahsinForm(prev => ({ ...prev, urutan: items.length + 1 }));
    setLoadingTahsin(false);
  };

  const handleSaveTahsin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tahsinForm.namaItem) return toast.error("Nama item wajib diisi");
    setSavingTahsin(true);
    try {
      const { saveTahsinItem } = await import('./raport-actions');
      await saveTahsinItem(tahsinForm);
      toast.success("Item Tahsin berhasil disimpan");
      setTahsinForm({ id: "", namaItem: "", urutan: tahsinList.length + (isEditingTahsin ? 0 : 2), isAktif: true });
      setIsEditingTahsin(false);
      loadTahsin();
    } catch (error) {
      toast.error("Gagal menyimpan item");
    }
    setSavingTahsin(false);
  };

  const handleDeleteTahsin = async (id: string) => {
    if (!confirm("Hapus item ini?")) return;
    setSavingTahsin(true);
    try {
      const { deleteTahsinItem } = await import('./raport-actions');
      await deleteTahsinItem(id);
      toast.success("Item dihapus");
      loadTahsin();
    } catch (error) {
      toast.error("Gagal menghapus item");
    }
    setSavingTahsin(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
        <button 
          onClick={() => setActiveSubTab("lembaga")} 
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeSubTab === 'lembaga' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          Profil Raport
        </button>
        <button 
          onClick={() => setActiveSubTab("akademik")} 
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeSubTab === 'akademik' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          Tahun Ajaran & Semester
        </button>
        <button 
          onClick={() => setActiveSubTab("tahsin")} 
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeSubTab === 'tahsin' ? 'bg-white shadow text-emerald-700' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          Item Tahsin
        </button>
      </div>

      {activeSubTab === "lembaga" && (
        <Card>
          <CardHeader>
            <CardTitle>Profil Lembaga & Bobot Nilai</CardTitle>
            <CardDescription>Pengaturan Kop Surat, Tanda Tangan, dan Kalkulasi Bobot Nilai Akhir Raport.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingProfil ? (
              <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : profil && (
              <form onSubmit={handleSaveProfil} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Lembaga Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 border-b pb-2">Identitas Lembaga</h3>
                    <div className="space-y-2">
                      <Label>Nama Lembaga</Label>
                      <Input value={profil.namaLembaga} onChange={e => setProfil({...profil, namaLembaga: e.target.value})} required placeholder="Contoh: Rumah Qur'an RQM" />
                    </div>
                    <div className="space-y-2">
                      <Label>Alamat Lengkap</Label>
                      <Input value={profil.alamatLembaga} onChange={e => setProfil({...profil, alamatLembaga: e.target.value})} required placeholder="Contoh: Jl. Sudirman No 1..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Kontak (Telp/WA)</Label>
                      <Input value={profil.kontakLembaga} onChange={e => setProfil({...profil, kontakLembaga: e.target.value})} required placeholder="Contoh: 081234567890" />
                    </div>
                    <div className="space-y-2">
                      <Label>Nama Kepala Lembaga</Label>
                      <Input value={profil.namaKepala} onChange={e => setProfil({...profil, namaKepala: e.target.value})} required placeholder="Contoh: Ustadz Fulan" />
                    </div>
                    <div className="space-y-2">
                      <Label>NIP / NIQ (Opsional)</Label>
                      <Input value={profil.nipKepala || ''} onChange={e => setProfil({...profil, nipKepala: e.target.value})} placeholder="Contoh: 19901010..." />
                    </div>
                  </div>

                  {/* Bobot & Media */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-800 border-b pb-2">Bobot Penilaian (%)</h3>
                    <div className="flex gap-4">
                      <div className="space-y-2 flex-1">
                        <Label>Akhlak</Label>
                        <Input type="number" min={0} max={100} value={profil.bobotAkhlak} onChange={e => setProfil({...profil, bobotAkhlak: parseInt(e.target.value) || 0})} required />
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label>Kedisiplinan</Label>
                        <Input type="number" min={0} max={100} value={profil.bobotKedisiplinan} onChange={e => setProfil({...profil, bobotKedisiplinan: parseInt(e.target.value) || 0})} required />
                      </div>
                      <div className="space-y-2 flex-1">
                        <Label>Kognitif</Label>
                        <Input type="number" min={0} max={100} value={profil.bobotKognitif} onChange={e => setProfil({...profil, bobotKognitif: parseInt(e.target.value) || 0})} required />
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">Total harus 100%. Saat ini: {profil.bobotAkhlak + profil.bobotKedisiplinan + profil.bobotKognitif}%</p>

                    <h3 className="font-semibold text-slate-800 border-b pb-2 mt-6">Upload Media</h3>
                    
                    <div className="space-y-2">
                      <Label>Logo Lembaga (Tampil di Kiri KOP)</Label>
                      <div className="flex items-center gap-4">
                        {profil.logoUrl && <img src={profil.logoUrl} className="w-16 h-16 object-contain bg-slate-100 rounded border" alt="Logo" />}
                        <div className="relative">
                          <Input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={e => handleUploadImage(e, 'logoUrl')} />
                          <Button type="button" variant="outline" size="sm">Pilih Gambar</Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mt-4">
                      <Label>Tanda Tangan Kepala Lembaga</Label>
                      <div className="flex items-center gap-4">
                        {profil.ttdKepalaUrl && <img src={profil.ttdKepalaUrl} className="w-24 h-16 object-contain bg-slate-100 rounded border" alt="TTD" />}
                        <div className="relative">
                          <Input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={e => handleUploadImage(e, 'ttdKepalaUrl')} />
                          <Button type="button" variant="outline" size="sm">Pilih Gambar</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <Button type="submit" disabled={savingProfil}>
                    {savingProfil ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Simpan Profil Raport
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      )}

      {activeSubTab === "akademik" && (
        <Card>
          <CardHeader>
            <CardTitle>Manajemen Tahun Ajaran & Semester</CardTitle>
            <CardDescription>Buat dan aktifkan Tahun Ajaran. Sistem akan otomatis membuat Semester Ganjil & Genap.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAkademik ? (
              <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Kolom Tahun Ajaran */}
                <div>
                  <div className="flex gap-2 mb-4">
                    <Input 
                      placeholder="Contoh: 2026/2027" 
                      value={newTahunAjaran} 
                      onChange={e => setNewTahunAjaran(e.target.value)}
                    />
                    <Button onClick={handleAddTa} disabled={savingAkademik || !newTahunAjaran}>
                      <Plus className="w-4 h-4 mr-1" /> Tambah
                    </Button>
                  </div>
                  
                  <div className="space-y-2 border rounded-lg overflow-hidden">
                    {tahunAjaranList.length === 0 ? (
                      <div className="p-4 text-center text-slate-500 text-sm">Belum ada Tahun Ajaran</div>
                    ) : (
                      tahunAjaranList.map(ta => (
                        <div 
                          key={ta.id} 
                          onClick={() => {
                            setSelectedTahunAjaranId(ta.id);
                            loadSemesters(ta.id);
                          }}
                          className={`flex items-center justify-between p-3 border-b last:border-b-0 cursor-pointer transition-colors ${selectedTahunAjaranId === ta.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{ta.nama}</p>
                            {ta.isAktif && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full mt-1 inline-block">AKTIF</span>}
                          </div>
                          {!ta.isAktif && (
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleActivateTa(ta.id); }} disabled={savingAkademik}>
                              Aktifkan
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Kolom Semester */}
                <div className="bg-slate-50 p-4 rounded-lg border">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    Semester
                    {selectedTahunAjaranId && <span className="text-sm font-normal text-slate-500">({tahunAjaranList.find(t => t.id === selectedTahunAjaranId)?.nama})</span>}
                  </h3>
                  
                  {!selectedTahunAjaranId ? (
                    <div className="text-sm text-slate-500 text-center py-8">Pilih Tahun Ajaran di samping untuk melihat Semester</div>
                  ) : semesterList.length === 0 ? (
                    <div className="text-sm text-slate-500 text-center py-8">Semester tidak ditemukan</div>
                  ) : (
                    <div className="space-y-3">
                      {semesterList.map(sem => (
                        <div key={sem.id} className="bg-white p-3 border rounded-lg shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{sem.nama}</span>
                              {sem.isAktif && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                            </div>
                            {!sem.isAktif && (
                              <Button size="sm" variant="secondary" onClick={() => handleActivateSemester(sem.id)} disabled={savingAkademik || !tahunAjaranList.find(t => t.id === selectedTahunAjaranId)?.isAktif}>
                                Set Aktif
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-3 text-sm">
                            <span className="text-slate-600">Hari Efektif Belajar:</span>
                            <div className="flex items-center gap-2">
                              <Input 
                                type="number" 
                                className="w-20 h-8 text-center" 
                                defaultValue={sem.jumlahHariEfektif}
                                onBlur={(e) => handleUpdateHariEfektif(sem.id, e.target.value)}
                              />
                              <span className="text-slate-500">Hari</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeSubTab === "tahsin" && (
        <Card>
          <CardHeader>
            <CardTitle>Master Data Item Tahsin</CardTitle>
            <CardDescription>Daftar komponen penilaian Tahsin (misal: Makharijul Huruf, Tajwid, dll) yang akan tampil di raport.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingTahsin ? (
              <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
            ) : (
              <div className="space-y-6">
                <form onSubmit={handleSaveTahsin} className="flex gap-2 items-end bg-slate-50 p-4 rounded-lg border">
                  <div className="flex-1 space-y-1">
                    <Label>Nama Item Penilaian</Label>
                    <Input required placeholder="Contoh: Makharijul Huruf" value={tahsinForm.namaItem} onChange={e => setTahsinForm({...tahsinForm, namaItem: e.target.value})} />
                  </div>
                  <div className="w-24 space-y-1">
                    <Label>Urutan</Label>
                    <Input type="number" required value={tahsinForm.urutan} onChange={e => setTahsinForm({...tahsinForm, urutan: parseInt(e.target.value) || 1})} />
                  </div>
                  <div className="w-24 space-y-1 flex flex-col justify-end h-[60px] pb-1">
                    <Label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={tahsinForm.isAktif} onChange={e => setTahsinForm({...tahsinForm, isAktif: e.target.checked})} className="rounded text-indigo-600" />
                      Aktif
                    </Label>
                  </div>
                  <div className="flex gap-2">
                    {isEditingTahsin && (
                      <Button type="button" variant="outline" onClick={() => { setIsEditingTahsin(false); setTahsinForm({ id: "", namaItem: "", urutan: tahsinList.length + 1, isAktif: true }); }}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                    <Button type="submit" disabled={savingTahsin}>
                      {savingTahsin ? <Loader2 className="w-4 h-4 animate-spin" /> : isEditingTahsin ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                      {isEditingTahsin ? "Simpan" : "Tambah"}
                    </Button>
                  </div>
                </form>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-medium border-b">
                      <tr>
                        <th className="px-4 py-3 w-16 text-center">Urutan</th>
                        <th className="px-4 py-3">Item Penilaian Tahsin</th>
                        <th className="px-4 py-3 w-24 text-center">Status</th>
                        <th className="px-4 py-3 w-28 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tahsinList.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Belum ada item tahsin</td></tr>
                      ) : (
                        tahsinList.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 text-center">{item.urutan}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">{item.namaItem}</td>
                            <td className="px-4 py-3 text-center">
                              {item.isAktif ? <span className="text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full text-xs font-bold">Aktif</span> : <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-xs font-bold">Nonaktif</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                <Button size="sm" variant="outline" onClick={() => { setTahsinForm({ id: item.id, namaItem: item.namaItem, urutan: item.urutan, isAktif: item.isAktif }); setIsEditingTahsin(true); }}>
                                  <Edit2 className="w-4 h-4 text-slate-600" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDeleteTahsin(item.id)} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}

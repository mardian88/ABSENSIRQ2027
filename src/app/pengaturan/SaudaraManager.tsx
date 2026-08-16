"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Users, UserMinus, UserPlus, Loader2 } from "lucide-react";
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert";
import { 
  getKeluargaWithSantri, 
  getSantriWithoutKeluarga, 
  createKeluarga, 
  deleteKeluarga, 
  addSantriToKeluarga, 
  removeSantriFromKeluarga 
} from "./actions_saudara";
import Select from "react-select";

export function SaudaraManager() {
  const [keluargaList, setKeluargaList] = useState<any[]>([]);
  const [santriOptions, setSantriOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeluargaName, setNewKeluargaName] = useState("");
  const [selectedNewSantri, setSelectedNewSantri] = useState<any[]>([]);

  // Add Santri to existing Keluarga Modal State
  const [addSantriKeluargaId, setAddSantriKeluargaId] = useState<string | null>(null);
  const [selectedAddSantri, setSelectedAddSantri] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const k = await getKeluargaWithSantri();
      const s = await getSantriWithoutKeluarga();
      setKeluargaList(k);
      setSantriOptions(s.map(x => ({ value: x.id, label: `${x.namaLengkap} (${x.nomorInduk})` })));
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateKeluarga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeluargaName) return;
    
    setIsSaving(true);
    try {
      await createKeluarga(newKeluargaName, selectedNewSantri.map(s => s.value));
      showSuccess("Berhasil", "Grup Keluarga berhasil dibuat.");
      setIsCreateOpen(false);
      setNewKeluargaName("");
      setSelectedNewSantri([]);
      fetchData();
    } catch (error: any) {
      showError("Gagal", error.message || "Gagal membuat keluarga");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSantri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addSantriKeluargaId || !selectedAddSantri) return;

    setIsSaving(true);
    try {
      await addSantriToKeluarga(addSantriKeluargaId, selectedAddSantri.value);
      showSuccess("Berhasil", "Santri berhasil ditambahkan ke keluarga.");
      setAddSantriKeluargaId(null);
      setSelectedAddSantri(null);
      fetchData();
    } catch (error: any) {
      showError("Gagal", error.message || "Gagal menambahkan santri");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveSantri = async (idSantri: string) => {
    const confirm = await showConfirm("Keluarkan Santri?", "Santri akan dikeluarkan dari grup keluarga ini.");
    if (confirm) {
      setIsLoading(true);
      try {
        await removeSantriFromKeluarga(idSantri);
        showSuccess("Berhasil", "Santri dikeluarkan dari keluarga.");
        fetchData();
      } catch (error: any) {
        showError("Gagal", error.message || "Gagal mengeluarkan santri");
        setIsLoading(false);
      }
    }
  };

  const handleDeleteKeluarga = async (idKeluarga: string) => {
    const confirm = await showConfirm("Hapus Keluarga?", "Semua santri di dalamnya akan dilepaskan status saudaranya.");
    if (confirm) {
      setIsLoading(true);
      try {
        await deleteKeluarga(idKeluarga);
        showSuccess("Berhasil", "Grup Keluarga berhasil dihapus.");
        fetchData();
      } catch (error: any) {
        showError("Gagal", error.message || "Gagal menghapus keluarga");
        setIsLoading(false);
      }
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>;
  }

  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Pengaturan Saudara / Keluarga
          </h2>
          <p className="text-sm text-slate-500 mt-1">Kelompokkan santri yang bersaudara untuk keperluan perhitungan biaya khusus (otomatis dibagi rata per santri).</p>
        </div>
        <button 
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Buat Grup Keluarga
        </button>
      </div>

      <div className="p-6">
        {keluargaList.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Belum ada grup keluarga yang dibuat.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keluargaList.map((k) => (
              <div key={k.id} className="border border-slate-200 rounded-xl overflow-hidden hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">{k.namaKeluarga}</h3>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setAddSantriKeluargaId(k.id)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-md transition-colors"
                      title="Tambah Anggota"
                    >
                      <UserPlus className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteKeluarga(k.id)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                      title="Hapus Keluarga"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 bg-white">
                  {k.anggota.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Belum ada anggota.</p>
                  ) : (
                    <ul className="space-y-2">
                      {k.anggota.map((s: any) => (
                        <li key={s.id} className="flex justify-between items-center p-2 rounded-md hover:bg-slate-50 group border border-transparent hover:border-slate-100">
                          <div>
                            <p className="font-medium text-sm text-slate-800">{s.namaLengkap}</p>
                            <p className="text-xs text-slate-500">{s.nomorInduk}</p>
                          </div>
                          <button 
                            onClick={() => handleRemoveSantri(s.id)}
                            className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Keluarkan dari grup"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tambah Keluarga */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Buat Grup Keluarga</h3>
              <p className="text-sm text-slate-500 mt-1">Gabungkan beberapa santri ke dalam satu keluarga.</p>
            </div>
            <form onSubmit={handleCreateKeluarga}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nama Grup Keluarga</label>
                  <input 
                    type="text" 
                    value={newKeluargaName}
                    onChange={e => setNewKeluargaName(e.target.value)}
                    placeholder="Contoh: Keluarga Bpk. Sudirman"
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Pilih Santri (Opsional)</label>
                  <Select
                    isMulti
                    options={santriOptions}
                    value={selectedNewSantri}
                    onChange={(val) => setSelectedNewSantri(val as any)}
                    placeholder="Cari & pilih santri..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end p-6 border-t border-slate-100 bg-slate-50">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSaving} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50">
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tambah Santri ke Keluarga */}
      {addSantriKeluargaId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800">Tambah Anggota Keluarga</h3>
            </div>
            <form onSubmit={handleAddSantri}>
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Pilih Santri</label>
                  <Select
                    options={santriOptions}
                    value={selectedAddSantri}
                    onChange={(val) => setSelectedAddSantri(val)}
                    placeholder="Cari & pilih santri..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end p-6 border-t border-slate-100 bg-slate-50">
                <button type="button" onClick={() => setAddSantriKeluargaId(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" disabled={isSaving || !selectedAddSantri} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50">
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

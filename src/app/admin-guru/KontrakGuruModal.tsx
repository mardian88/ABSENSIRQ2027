"use client";

import { useEffect, useState } from "react";
import { Briefcase, X, Plus, Edit, Trash2 } from "lucide-react";
import { getKontrakByGuruId, saveKontrakGuru } from "./actions";
import { showError, showSuccess, showConfirm } from "@/lib/sweetalert";
import { DatePicker } from "@/components/ui/date-picker";

export function KontrakGuruModal({ isOpen, onClose, guru }: { isOpen: boolean, onClose: () => void, guru: any }) {
  const [kontrakList, setKontrakList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [jenisKontrak, setJenisKontrak] = useState("temporer");
  
  const [tanggalMulai, setTanggalMulai] = useState<Date | undefined>(undefined);
  const [tanggalSelesai, setTanggalSelesai] = useState<Date | undefined>(undefined);
  
  useEffect(() => {
    if (isOpen && guru) {
      loadData();
    }
  }, [isOpen, guru]);

  const loadData = async () => {
    setIsLoading(true);
    const data = await getKontrakByGuruId(guru.id);
    setKontrakList(data);
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    payload.idGuru = guru.id;
    if (editData?.id) payload.id = editData.id;

    setIsLoading(true);
    const res = await saveKontrakGuru(payload);
    if (res.success) {
      showSuccess("Tersimpan", res.message);
      setIsEditing(false);
      setEditData(null);
      setJenisKontrak("temporer");
      loadData();
    } else {
      showError("Gagal", res.message);
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-emerald-600" />
            Kelola Kontrak & Kafalah
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800">{guru?.namaLengkap}</h3>
            <p className="text-sm text-slate-500">NIP: {guru?.nip}</p>
          </div>

          {!isEditing ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-slate-700">Daftar Kontrak</h4>
                <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded-lg text-sm font-medium transition-colors">
                  <Plus className="w-4 h-4" /> Tambah Kontrak
                </button>
              </div>

              {isLoading ? (
                <p className="text-sm text-slate-500 text-center py-4">Memuat data...</p>
              ) : kontrakList.length > 0 ? (
                <div className="space-y-3">
                  {kontrakList.map(k => (
                    <div key={k.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative group">
                      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { 
                          setEditData(k); 
                          setJenisKontrak(k.jenisKontrak);
                          if (k.tanggalMulai) setTanggalMulai(new Date(k.tanggalMulai));
                          if (k.tanggalSelesai) setTanggalSelesai(new Date(k.tanggalSelesai));
                          setIsEditing(true); 
                        }} className="text-blue-600 hover:text-blue-800 bg-white p-1.5 rounded shadow-sm border border-slate-200" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          k.statusKontrak === 'aktif' ? 'bg-emerald-100 text-emerald-700' :
                          k.statusKontrak === 'selesai' ? 'bg-slate-200 text-slate-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {k.statusKontrak === 'aktif' ? 'AKTIF' : k.statusKontrak === 'selesai' ? 'SELESAI' : 'MENUNGGU TTD'}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold capitalize">
                          {k.jenisKontrak}
                        </span>
                        <h5 className="font-bold text-slate-800">{k.jabatan}</h5>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                        <div>
                          <p className="text-slate-500 text-xs">Periode</p>
                          {k.jenisKontrak === 'permanen' ? (
                            <p className="font-medium text-blue-600">Selamanya (Permanen)</p>
                          ) : (
                            <p className="font-medium">{k.tanggalMulai ? new Date(k.tanggalMulai).toLocaleDateString('id-ID') : '-'} - {k.tanggalSelesai ? new Date(k.tanggalSelesai).toLocaleDateString('id-ID') : '-'}</p>
                          )}
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs">Satuan Kafalah (Kehadiran)</p>
                          <p className="font-medium text-emerald-600">Rp {k.satuanKafalah.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                      
                      {k.eSignUrl && (
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <a href={k.eSignUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                            Lihat Tanda Tangan Digital
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                  <p className="text-slate-500 mb-2">Belum ada kontrak untuk guru ini.</p>
                  <button onClick={() => {
                    setEditData(null);
                    setTanggalMulai(undefined);
                    setTanggalSelesai(undefined);
                    setIsEditing(true);
                  }} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700">
                    Buat Kontrak Pertama
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-800 mb-4">{editData ? 'Edit Kontrak' : 'Tambah Kontrak Baru'}</h4>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Jabatan / Posisi</label>
                  <input type="text" name="jabatan" required defaultValue={editData?.jabatan} placeholder="Misal: Guru Tahfizh, Kepala Sekolah" className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Status (Jenis Kontrak)</label>
                  <select 
                    name="jenisKontrak" 
                    value={jenisKontrak}
                    onChange={(e) => setJenisKontrak(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm"
                  >
                    <option value="temporer">Temporer / Kontrak</option>
                    <option value="permanen">Permanen (Selamanya)</option>
                  </select>
                </div>
                
                {jenisKontrak === 'temporer' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Tanggal Mulai</label>
                      <DatePicker name="tanggalMulai" date={tanggalMulai} setDate={setTanggalMulai} placeholder="DD/MM/YYYY" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Tanggal Selesai</label>
                      <DatePicker name="tanggalSelesai" date={tanggalSelesai} setDate={setTanggalSelesai} placeholder="DD/MM/YYYY" />
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium mb-1">Satuan Kafalah per Kehadiran (Rp)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 font-medium text-sm">Rp</span>
                    <input 
                      type="text" 
                      name="satuanKafalah" 
                      required 
                      defaultValue={editData?.satuanKafalah ? editData.satuanKafalah.toLocaleString('id-ID') : "0"} 
                      placeholder="Misal: 50.000" 
                      className="w-full p-2 pl-9 border border-slate-300 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/[^0-9]/g, '');
                        e.target.value = rawValue ? new Intl.NumberFormat('id-ID').format(parseInt(rawValue, 10)) : '';
                      }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Nilai ini akan dikalikan dengan total kehadiran guru pada bulan berjalan.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Status Kontrak</label>
                  <select name="statusKontrak" required defaultValue={editData?.statusKontrak || "menunggu_ttd"} className="w-full p-2 border border-slate-300 rounded-lg text-sm">
                    <option value="menunggu_ttd">Menunggu Tanda Tangan (Draft)</option>
                    <option value="aktif">Aktif</option>
                    <option value="selesai">Selesai / Kadaluarsa</option>
                  </select>
                </div>
                
                <div className="pt-4 flex justify-end gap-2 border-t border-slate-200 mt-4">
                  <button type="button" onClick={() => { setIsEditing(false); setEditData(null); setJenisKontrak("temporer"); setTanggalMulai(undefined); setTanggalSelesai(undefined); }} className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100">Batal</button>
                  <button type="submit" disabled={isLoading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                    {isLoading ? "Menyimpan..." : "Simpan Kontrak"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

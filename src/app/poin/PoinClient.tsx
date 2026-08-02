"use client";

import { useState } from "react";
import { Plus, Trash2, Award, AlertTriangle, Calendar, Star, Users, History, FileText, X } from "lucide-react";
import { createCatatanPoin, deleteCatatanPoin } from "./actions";
import { showConfirm } from "@/lib/sweetalert";
import { formatDateID } from "@/lib/date";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const poinSchema = z.object({
  idSantri: z.string().min(1, "Pilih santri terlebih dahulu"),
  jenisCatatan: z.enum(["reward", "punishment"]),
  deskripsi: z.string().min(1, "Deskripsi wajib diisi"),
  poinDiberikan: z.number().min(1, "Poin minimal 1"),
});

type PoinFormValues = z.infer<typeof poinSchema>;

type PoinData = {
  id: string;
  idSantri: string;
  namaSantri: string | null;
  jenisCatatan: string;
  deskripsi: string;
  poinDiberikan: number;
  tanggalKejadian: Date;
};

type RekapData = {
  idSantri: string;
  namaSantri: string;
  totalReward: number;
  totalPunishment: number;
  poinAkhir: number;
};

export function PoinClient({ 
  rekap,
  allPoin,
  santriOptions 
}: { 
  rekap: RekapData[];
  allPoin: PoinData[]; 
  santriOptions: any[];
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"rekap" | "history">("rekap");
  const [search, setSearch] = useState("");

  // Modal for individual history
  const [selectedSantri, setSelectedSantri] = useState<RekapData | null>(null);

  const form = useForm<PoinFormValues>({
    resolver: zodResolver(poinSchema),
    defaultValues: {
      idSantri: "",
      jenisCatatan: "punishment",
      deskripsi: "",
      poinDiberikan: 5,
    },
  });

  const onSubmit = async (data: PoinFormValues) => {
    await createCatatanPoin(data);
    setIsDialogOpen(false);
    form.reset();
  };

  const filteredRekap = rekap.filter(r => 
    r.namaSantri.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAllPoin = allPoin.filter(p => 
    p.namaSantri?.toLowerCase().includes(search.toLowerCase()) || 
    p.deskripsi?.toLowerCase().includes(search.toLowerCase())
  );

  // When a santri is selected for details, filter their specific history
  const santriHistory = selectedSantri ? allPoin.filter(p => p.idSantri === selectedSantri.idSantri) : [];
  const santriRewards = santriHistory.filter(p => p.jenisCatatan === 'reward');
  const santriPunishments = santriHistory.filter(p => p.jenisCatatan === 'punishment');

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Poin Prestasi & Pelanggaran</h1>
          <p className="text-slate-500 mt-1">Buku poin kedisiplinan dan riwayat perilaku santri.</p>
        </div>
        <button 
          onClick={() => setIsDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-semibold shadow-sm transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          Catat Poin
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab("rekap")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "rekap" 
            ? "bg-white text-slate-800 shadow-sm" 
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Users className="w-4 h-4" /> Rekap Santri
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "history" 
            ? "bg-white text-slate-800 shadow-sm" 
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <History className="w-4 h-4" /> Semua Riwayat
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <input 
            type="text"
            placeholder={activeTab === 'rekap' ? "Cari nama santri..." : "Cari nama atau deskripsi..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
          />
        </div>

        {activeTab === "rekap" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-700">Nama Santri</th>
                  <th className="p-4 font-semibold text-center text-slate-700">Total Prestasi (+)</th>
                  <th className="p-4 font-semibold text-center text-slate-700">Total Pelanggaran (-)</th>
                  <th className="p-4 font-semibold text-center text-slate-700">Poin Akhir</th>
                  <th className="p-4 font-semibold text-slate-700 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRekap.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      Belum ada data santri.
                    </td>
                  </tr>
                ) : (
                  filteredRekap.map((r) => (
                    <tr key={r.idSantri} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">{r.namaSantri}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 font-semibold px-3 py-1 rounded-full">
                          {r.totalReward}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center justify-center bg-rose-50 text-rose-700 font-semibold px-3 py-1 rounded-full">
                          {r.totalPunishment}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex items-center justify-center font-bold px-3 py-1 rounded-full ${r.poinAkhir >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {r.poinAkhir > 0 ? '+' : ''}{r.poinAkhir}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setSelectedSantri(r)}
                          className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          Detail Riwayat
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "history" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="p-4 font-semibold text-slate-700">Tanggal</th>
                  <th className="p-4 font-semibold text-slate-700">Nama Santri</th>
                  <th className="p-4 font-semibold text-slate-700">Jenis</th>
                  <th className="p-4 font-semibold text-slate-700">Deskripsi</th>
                  <th className="p-4 font-semibold text-center text-slate-700">Poin</th>
                  <th className="p-4 font-semibold text-slate-700 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAllPoin.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p>Belum ada catatan poin.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAllPoin.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 text-slate-600 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDateID(p.tanggalKejadian)}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-800">{p.namaSantri || "-"}</td>
                      <td className="p-4">
                        {p.jenisCatatan === 'reward' ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">
                            <Award className="w-3 h-3"/> Prestasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded-full">
                            <AlertTriangle className="w-3 h-3"/> Pelanggaran
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-600">{p.deskripsi}</td>
                      <td className="p-4 text-center">
                        {p.jenisCatatan === 'reward' ? (
                          <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-full">
                            +{p.poinDiberikan}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded-full">
                            -{p.poinDiberikan}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button 
                            onClick={async () => {
                              const confirmed = await showConfirm("Hapus catatan ini?");
                              if (confirmed) deleteCatatanPoin(p.id);
                            }} 
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Riwayat Santri */}
      {selectedSantri && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-50 rounded-2xl w-full max-w-5xl max-h-[90vh] shadow-xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 bg-white border-b border-slate-200 rounded-t-2xl flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">
                  Buku Poin: {selectedSantri.namaSantri}
                </h2>
                <div className="flex gap-4 mt-2">
                  <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Total Prestasi: {selectedSantri.totalReward}</span>
                  <span className="text-sm font-medium text-rose-600 bg-rose-50 px-2 py-1 rounded-md">Total Pelanggaran: {selectedSantri.totalPunishment}</span>
                  <span className={`text-sm font-bold px-2 py-1 rounded-md ${selectedSantri.poinAkhir >= 0 ? 'text-emerald-700 bg-emerald-100' : 'text-rose-700 bg-rose-100'}`}>
                    Poin Akhir: {selectedSantri.poinAkhir > 0 ? '+' : ''}{selectedSantri.poinAkhir}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSantri(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Kolom Prestasi */}
                <div className="bg-white border border-emerald-100 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100 flex items-center gap-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-emerald-800">Riwayat Prestasi</h3>
                  </div>
                  <div className="divide-y divide-emerald-50">
                    {santriRewards.length === 0 ? (
                       <div className="p-6 text-center text-slate-400 text-sm">
                         Belum ada catatan prestasi.
                       </div>
                    ) : (
                      santriRewards.map(p => (
                        <div key={p.id} className="p-4 hover:bg-emerald-50/50 transition-colors flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{p.deskripsi}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDateID(p.tanggalKejadian)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md text-sm">+{p.poinDiberikan}</span>
                            <button 
                              onClick={async () => { 
                                const confirmed = await showConfirm("Hapus catatan ini?");
                                if (confirmed) deleteCatatanPoin(p.id);
                              }}
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Kolom Pelanggaran */}
                <div className="bg-white border border-rose-100 rounded-xl shadow-sm overflow-hidden">
                  <div className="bg-rose-50 px-4 py-3 border-b border-rose-100 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    <h3 className="font-bold text-rose-800">Riwayat Pelanggaran</h3>
                  </div>
                  <div className="divide-y divide-rose-50">
                    {santriPunishments.length === 0 ? (
                       <div className="p-6 text-center text-slate-400 text-sm">
                         Belum ada catatan pelanggaran.
                       </div>
                    ) : (
                      santriPunishments.map(p => (
                        <div key={p.id} className="p-4 hover:bg-rose-50/50 transition-colors flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-slate-800">{p.deskripsi}</p>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatDateID(p.tanggalKejadian)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded-md text-sm">-{p.poinDiberikan}</span>
                            <button 
                              onClick={async () => { 
                                const confirmed = await showConfirm("Hapus catatan ini?");
                                if (confirmed) deleteCatatanPoin(p.id);
                              }}
                              className="text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Form Tambah Poin */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                Catat Poin Baru
              </h2>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Santri</label>
                <select {...form.register("idSantri")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                  <option value="">-- Pilih Santri --</option>
                  {santriOptions.map(s => (
                    <option key={s.id} value={s.id}>{s.namaLengkap}</option>
                  ))}
                </select>
                {form.formState.errors.idSantri && <span className="text-xs text-rose-500">{form.formState.errors.idSantri.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Catatan</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="reward" {...form.register("jenisCatatan")} className="text-emerald-500 focus:ring-emerald-500" />
                    <span className="text-sm text-slate-700">Prestasi (Tambah Poin)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" value="punishment" {...form.register("jenisCatatan")} className="text-rose-500 focus:ring-rose-500" />
                    <span className="text-sm text-slate-700">Pelanggaran (Kurang Poin)</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan / Deskripsi</label>
                <textarea {...form.register("deskripsi")} rows={3} placeholder="Contoh: Hafalan 1 Juz atau Terlambat masuk" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                {form.formState.errors.deskripsi && <span className="text-xs text-rose-500">{form.formState.errors.deskripsi.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jumlah Poin</label>
                <input type="number" {...form.register("poinDiberikan", { valueAsNumber: true })} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                {form.formState.errors.poinDiberikan && <span className="text-xs text-rose-500">{form.formState.errors.poinDiberikan.message}</span>}
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={form.formState.isSubmitting}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50"
                >
                  {form.formState.isSubmitting ? "Menyimpan..." : "Simpan Catatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

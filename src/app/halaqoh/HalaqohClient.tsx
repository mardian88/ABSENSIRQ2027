"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit2, Trash2, BookOpen, GripVertical, Users } from "lucide-react";
import { createHalaqoh, updateHalaqoh, deleteHalaqoh, updateSantriHalaqoh } from "./actions";
import { showConfirm } from "@/lib/sweetalert";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

const halaqohSchema = z.object({
  namaHalaqoh: z.string().min(1, "Nama Halaqoh wajib diisi"),
  namaPengajar: z.string().min(1, "Nama Pengajar wajib diisi"),
  idSesiAbsensi: z.string().optional().nullable(),
});

type HalaqohFormValues = z.infer<typeof halaqohSchema>;

type Santri = {
  id: string;
  namaLengkap: string;
  nomorInduk: string;
  jenjangSekolah: string | null;
  kelasSekolah: string | null;
  idHalaqoh: string | null;
};

type HalaqohData = {
  id: string;
  namaHalaqoh: string;
  namaPengajar: string;
  idSesiAbsensi: string | null;
  sesi: { namaSesi: string; waktuMulaiMasuk: string; waktuMulaiPulang: string } | null;
  jumlahSantri: number;
  santri: Santri[];
};

type SesiList = { id: string, namaSesi: string };

export function HalaqohClient({ initialData }: { initialData: { halaqohs: HalaqohData[], unassigned: Santri[], sesiList: SesiList[] } }) {
  const [data, setData] = useState(initialData);
  const router = useRouter();

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [draggedSantriId, setDraggedSantriId] = useState<string | null>(null);
  const [draggedFromId, setDraggedFromId] = useState<string | null>(null);

  const form = useForm<HalaqohFormValues>({
    resolver: zodResolver(halaqohSchema),
    defaultValues: {
      namaHalaqoh: "",
      namaPengajar: "",
      idSesiAbsensi: "",
    },
  });

  const onSubmit = async (formData: HalaqohFormValues) => {
    if (editingId) {
      await updateHalaqoh(editingId, formData);
      // Optimistic local update
      setData(prev => ({
        ...prev,
        halaqohs: prev.halaqohs.map(h => h.id === editingId ? { ...h, ...formData } : h)
      }));
    } else {
      await createHalaqoh(formData);
      router.refresh(); // Fetch new data without losing scroll
    }
    setIsDialogOpen(false);
    form.reset();
    setEditingId(null);
  };

  const handleEdit = (halaqoh: HalaqohData) => {
    setEditingId(halaqoh.id);
    form.reset({
      namaHalaqoh: halaqoh.namaHalaqoh,
      namaPengajar: halaqoh.namaPengajar,
      idSesiAbsensi: halaqoh.idSesiAbsensi || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Hapus halaqoh ini?", "Santri di dalamnya akan dipindahkan ke daftar 'Belum Ada Halaqoh'.");
    if (confirmed) {
      await deleteHalaqoh(id);
      router.refresh();
    }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, idSantri: string, fromHalaqohId: string | null) => {
    setDraggedSantriId(idSantri);
    setDraggedFromId(fromHalaqohId);
    e.dataTransfer.effectAllowed = "move";
    // For visual styling
    setTimeout(() => {
      (e.target as HTMLElement).classList.add("opacity-50");
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove("opacity-50");
    setDraggedSantriId(null);
    setDraggedFromId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, toHalaqohId: string | null) => {
    e.preventDefault();
    
    if (!draggedSantriId || draggedFromId === toHalaqohId) return;

    // 1. Optimistic Update Local State
    setData(prev => {
      let movedSantri: Santri | undefined;
      
      // Find the santri
      if (draggedFromId === null) {
        movedSantri = prev.unassigned.find(s => s.id === draggedSantriId);
      } else {
        movedSantri = prev.halaqohs.find(h => h.id === draggedFromId)?.santri.find(s => s.id === draggedSantriId);
      }

      if (!movedSantri) return prev;
      
      // Deep copy the santri
      const clonedSantri = { ...movedSantri, idHalaqoh: toHalaqohId };

      // Generate new arrays
      const newUnassigned = draggedFromId === null 
        ? prev.unassigned.filter(s => s.id !== draggedSantriId) 
        : toHalaqohId === null 
          ? (prev.unassigned.some(s => s.id === clonedSantri.id) ? prev.unassigned : [clonedSantri, ...prev.unassigned])
          : prev.unassigned;

      const newHalaqohs = prev.halaqohs.map(h => {
        let newSantriList = [...h.santri];
        
        // Remove if source
        if (h.id === draggedFromId) {
          newSantriList = newSantriList.filter(s => s.id !== draggedSantriId);
        }
        
        // Add if destination
        if (h.id === toHalaqohId) {
          if (!newSantriList.some(s => s.id === clonedSantri.id)) {
            newSantriList = [clonedSantri, ...newSantriList];
          }
        }
        
        return { ...h, santri: newSantriList, jumlahSantri: newSantriList.length };
      });

      return { halaqohs: newHalaqohs, unassigned: newUnassigned, sesiList: prev.sesiList };
    });

    // 2. Persist to DB
    try {
      await updateSantriHalaqoh(draggedSantriId, toHalaqohId);
    } catch (error) {
      toast.error("Gagal memindahkan santri");
      // Revert could be implemented here, but simple reload is fallback
      router.refresh();
    }
  };

  // --- Export Excel ---
  const handleExportExcel = () => {
    // We want to export only the assigned Halaqohs (or include "Belum Masuk Halaqoh" at the end)
    // Let's include all Halaqohs
    const halaqohsToExport = [...data.halaqohs];

    if (halaqohsToExport.length === 0) {
      toast.error("Tidak ada data halaqoh untuk diexport");
      return;
    }

    const aoa: any[][] = [];

    // Row 0: Nama Halaqoh
    const rowNamaHalaqoh: any[] = [];
    // Row 1: Pembimbing
    const rowPembimbing: any[] = [];
    // Row 2: Sesi
    const rowSesi: any[] = [];
    // Row 3: Header Kolom
    const rowHeaders: any[] = [];

    halaqohsToExport.forEach((h) => {
      rowNamaHalaqoh.push(`Halaqah: ${h.namaHalaqoh}`, ""); // Takes 2 cols
      rowPembimbing.push(`Pembimbing: ${h.namaPengajar}`, "");
      rowSesi.push(h.sesi ? `Sesi: ${h.sesi.namaSesi}` : "Sesi: -", "");
      rowHeaders.push("No", "Nama Lengkap");
    });

    aoa.push(rowNamaHalaqoh);
    aoa.push(rowPembimbing);
    aoa.push(rowSesi);
    aoa.push(rowHeaders);

    // Max number of santri among all halaqohs to determine rows
    const maxSantri = Math.max(...halaqohsToExport.map(h => h.santri.length), 0);

    for (let i = 0; i < maxSantri; i++) {
      const rowSantri: any[] = [];
      halaqohsToExport.forEach((h) => {
        if (i < h.santri.length) {
          rowSantri.push(i + 1); // No
          rowSantri.push(h.santri[i].namaLengkap); // Nama
        } else {
          rowSantri.push("");
          rowSantri.push("");
        }
      });
      aoa.push(rowSantri);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Styling slightly (setting column widths)
    const colWidths: any[] = [];
    halaqohsToExport.forEach(() => {
      colWidths.push({ wch: 5 }); // Width for 'No'
      colWidths.push({ wch: 25 }); // Width for 'Nama Lengkap'
    });
    ws['!cols'] = colWidths;

    // Creating workbook and saving
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Daftar_Santri_Halaqoh");
    XLSX.writeFile(wb, "Data_Penempatan_Halaqoh.xlsx");
    
    toast.success("Berhasil mengunduh Excel!");
  };

  // Santri Card Component
  const SantriCard = ({ s, fromHalaqohId }: { s: Santri, fromHalaqohId: string | null }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, s.id, fromHalaqohId)}
      onDragEnd={handleDragEnd}
      className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all cursor-grab active:cursor-grabbing flex items-start gap-2 group mb-1.5"
    >
      <div className="mt-0.5 text-slate-300 group-hover:text-emerald-500 transition-colors">
        <GripVertical className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="font-bold text-slate-800 text-xs truncate leading-tight">{s.namaLengkap}</p>
        {(s.jenjangSekolah || s.kelasSekolah) && (
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-md truncate">
              {s.jenjangSekolah ? s.jenjangSekolah : ''} {s.kelasSekolah ? `- Kelas ${s.kelasSekolah}` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-slate-50/50">
      
      {/* Header Area (Frozen/Sticky) */}
      <div className="p-4 md:px-6 md:py-5 flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-b border-slate-200 shadow-sm z-20 sticky top-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Manajemen Halaqoh</h1>
          <p className="text-slate-500 mt-1 text-sm md:text-base">Kelola kelompok belajar dan drag & drop santri untuk memindahkan.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <button 
            onClick={handleExportExcel}
            className="flex flex-1 sm:flex-none items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-semibold shadow-sm transition-colors justify-center border border-slate-300"
            title="Download ke Excel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M8 13h2"></path><path d="M14 13h2"></path><path d="M8 17h2"></path><path d="M14 17h2"></path></svg>
            <span className="hidden sm:inline">Export</span>
          </button>
          <button 
            onClick={() => {
              setEditingId(null);
              form.reset({ namaHalaqoh: "", namaPengajar: "", idSesiAbsensi: "" });
              setIsDialogOpen(true);
            }}
            className="flex flex-1 sm:flex-none items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-semibold shadow-sm transition-colors justify-center"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Tambah Halaqoh</span>
            <span className="sm:hidden">Tambah</span>
          </button>
        </div>
      </div>

      {/* Kanban Board Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 items-start">
          
          {/* Column: Unassigned Santri */}
          <div 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, null)}
            className="w-full flex flex-col bg-slate-100/80 rounded-2xl border border-slate-200/60 overflow-hidden"
          >
            <div className="p-3 border-b border-slate-200 bg-white/50">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  Belum Masuk Halaqoh
                </h3>
                <span className="bg-slate-200 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                  {data.unassigned.length}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Santri yang belum memiliki kelompok</p>
            </div>
            <div className="flex-1 p-2 min-h-[100px]">
              {data.unassigned.map(s => (
                <SantriCard key={s.id} s={s} fromHalaqohId={null} />
              ))}
              {data.unassigned.length === 0 && (
                <div className="h-20 flex items-center justify-center border-2 border-dashed border-slate-300 rounded-xl text-slate-400 text-xs">
                  Tidak ada santri
                </div>
              )}
            </div>
          </div>

          {/* Columns: Halaqohs */}
          {data.halaqohs.map(h => (
            <div 
              key={h.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, h.id)}
              className="w-full flex flex-col bg-emerald-50/30 rounded-2xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow transition-shadow"
            >
              <div className="p-3 border-b border-emerald-100 bg-white group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-emerald-900 text-base leading-tight">{h.namaHalaqoh}</h3>
                    <p className="text-xs font-medium text-emerald-600 flex items-center gap-1 mt-1">
                      <BookOpen className="w-3 h-3" /> {h.namaPengajar}
                    </p>
                    {h.sesi && (
                      <p className="text-[9px] font-semibold text-emerald-500/80 mt-1 uppercase tracking-wider">
                        {h.sesi.namaSesi} ({h.sesi.waktuMulaiMasuk} - {h.sesi.waktuMulaiPulang})
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {h.jumlahSantri} Santri
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(h)} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit Halaqoh">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(h.id)} className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors" title="Hapus Halaqoh">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-2 min-h-[100px]">
                {h.santri.map(s => (
                  <SantriCard key={s.id} s={s} fromHalaqohId={h.id} />
                ))}
                {h.santri.length === 0 && (
                  <div className="h-20 flex items-center justify-center border-2 border-dashed border-emerald-200 rounded-xl text-emerald-400/70 text-xs">
                    Tarik santri ke sini
                  </div>
                )}
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Modal Form */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? "Edit Halaqoh" : "Tambah Halaqoh Baru"}
              </h2>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Halaqoh</label>
                <input {...form.register("namaHalaqoh")} placeholder="Contoh: Kelas Abu Bakar" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                {form.formState.errors.namaHalaqoh && <span className="text-xs text-rose-500">{form.formState.errors.namaHalaqoh.message}</span>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ustadz Pengajar</label>
                <input {...form.register("namaPengajar")} placeholder="Contoh: Ust. Fulan, S.Pd.I" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                {form.formState.errors.namaPengajar && <span className="text-xs text-rose-500">{form.formState.errors.namaPengajar.message}</span>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jadwal Sesi Absensi</label>
                <select {...form.register("idSesiAbsensi")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white">
                  <option value="">-- Pilih Sesi (Opsional) --</option>
                  {initialData.sesiList.map(s => (
                    <option key={s.id} value={s.id}>{s.namaSesi}</option>
                  ))}
                </select>
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
                  {form.formState.isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import { Plus, Search, Edit2, Trash2, Camera, Upload, Download, GraduationCap, QrCode, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { createSantri, updateSantri, deleteSantri, importSantriBatch, jadikanAlumni, jadikanAlumniBatch, syncQRCodeBatch, updateHalaqoh, updateHalaqohBatch, updateSesiBatch } from "./actions";
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert";
import { RegisterWajahModal } from "./RegisterWajahModal";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import * as XLSX from "xlsx";
import QRCode from "qrcode";
const santriSchema = z.object({
  nomorInduk: z.string().optional(),
  namaLengkap: z.string().min(1, "Nama Lengkap wajib diisi"),
  idHalaqoh: z.string().optional(),
  idSesiAbsensi: z.string().optional(),
  kontakOrtu: z.string().min(1, "Kontak Wali wajib diisi"),
  statusSantri: z.string(),
  kodeQr: z.string().optional(),
  
  // Extended fields
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
  jenisKelamin: z.string().optional(),
  alamatLengkap: z.string().optional(),
  isAlamatDomisiliSama: z.boolean().optional(),
  alamatDomisili: z.string().optional(),
  jenjangSekolah: z.string().optional(),
  jenjangSekolahLainnya: z.string().optional(),
  namaSekolah: z.string().optional(),
  kelasSekolah: z.string().optional(),
  ikutLes: z.boolean().optional(),
  hariLes: z.string().optional(),
  jamLesMulai: z.string().optional(),
  jamLesSelesai: z.string().optional(),
  namaAyah: z.string().optional(),
  pekerjaanAyah: z.string().optional(),
  pekerjaanAyahLainnya: z.string().optional(),
  instansiAyah: z.string().optional(),
  namaIbu: z.string().optional(),
  pekerjaanIbu: z.string().optional(),
  pekerjaanIbuLainnya: z.string().optional(),
  instansiIbu: z.string().optional(),
});

type SantriFormValues = z.infer<typeof santriSchema>;

export function SantriClient({ santriList, halaqohList, sesiList }: { santriList: any[], halaqohList: any[], sesiList: any[] }) {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<"nomorInduk" | "namaLengkap" | "halaqoh">("namaLengkap");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [jumpPage, setJumpPage] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [faceRegistrationSantri, setFaceRegistrationSantri] = useState<{id: string, namaLengkap: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [batchHalaqoh, setBatchHalaqoh] = useState("");
  const [batchSesi, setBatchSesi] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<SantriFormValues>({
    resolver: zodResolver(santriSchema),
    defaultValues: {
      nomorInduk: "",
      namaLengkap: "",
      idHalaqoh: "",
      idSesiAbsensi: "",
      kontakOrtu: "",
      statusSantri: "aktif",
      tempatLahir: "",
      tanggalLahir: "",
      jenisKelamin: "",
      alamatLengkap: "",
      isAlamatDomisiliSama: true,
      alamatDomisili: "",
      jenjangSekolah: "",
      jenjangSekolahLainnya: "",
      namaSekolah: "",
      kelasSekolah: "",
      ikutLes: false,
      hariLes: "",
      jamLesMulai: "",
      jamLesSelesai: "",
      namaAyah: "",
      pekerjaanAyah: "",
      pekerjaanAyahLainnya: "",
      instansiAyah: "",
      namaIbu: "",
      pekerjaanIbu: "",
      pekerjaanIbuLainnya: "",
      instansiIbu: "",
    },
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  // Hanya tampilkan yang bukan alumni
  const nonAlumniList = santriList.filter(s => s.statusSantri !== "alumni");

  let filteredSantri = nonAlumniList.filter((s) => 
    s.namaLengkap.toLowerCase().includes(search.toLowerCase()) ||
    s.nomorInduk.toLowerCase().includes(search.toLowerCase())
  );

  // Sorting
  filteredSantri.sort((a, b) => {
    let aVal = a[sortField] || "";
    let bVal = b[sortField] || "";
    
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSantri.length / itemsPerPage) || 1;
  const paginatedSantri = filteredSantri.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field: "nomorInduk" | "namaLengkap" | "halaqoh") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPage);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setJumpPage("");
    }
  };

  const onSubmit = async (data: SantriFormValues) => {
    setIsLoading(true);
    try {
      if (editingId) {
        await updateSantri(editingId, data);
        showSuccess("Berhasil", "Data santri berhasil diperbarui");
      } else {
        await createSantri(data);
        showSuccess("Berhasil", "Santri baru berhasil ditambahkan");
      }
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
    } catch (error) {
      showError("Gagal", "Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (santri: any) => {
    setEditingId(santri.id);
    form.reset({
      nomorInduk: santri.nomorInduk,
      namaLengkap: santri.namaLengkap,
      idHalaqoh: santri.idHalaqoh || "",
      idSesiAbsensi: santri.idSesiAbsensi || "",
      kontakOrtu: santri.kontakOrtu,
      statusSantri: santri.statusSantri || "aktif",
      tempatLahir: santri.tempatLahir || "",
      tanggalLahir: santri.tanggalLahir || "",
      jenisKelamin: santri.jenisKelamin || "",
      alamatLengkap: santri.alamatLengkap || "",
      isAlamatDomisiliSama: santri.isAlamatDomisiliSama ?? true,
      alamatDomisili: santri.alamatDomisili || "",
      jenjangSekolah: santri.jenjangSekolah || "",
      jenjangSekolahLainnya: santri.jenjangSekolahLainnya || "",
      namaSekolah: santri.namaSekolah || "",
      kelasSekolah: santri.kelasSekolah || "",
      ikutLes: santri.ikutLes ?? false,
      hariLes: santri.hariLes || "",
      jamLesMulai: santri.jamLesMulai || "",
      jamLesSelesai: santri.jamLesSelesai || "",
      namaAyah: santri.namaAyah || "",
      pekerjaanAyah: santri.pekerjaanAyah || "",
      pekerjaanAyahLainnya: santri.pekerjaanAyahLainnya || "",
      instansiAyah: santri.instansiAyah || "",
      namaIbu: santri.namaIbu || "",
      pekerjaanIbu: santri.pekerjaanIbu || "",
      pekerjaanIbuLainnya: santri.pekerjaanIbuLainnya || "",
      instansiIbu: santri.instansiIbu || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const confirmed = await showConfirm("Apakah Anda yakin ingin menghapus santri ini?", "Semua data absensi dan poin akan ikut terhapus.");
    if (confirmed) {
      setIsLoading(true);
      try {
        await deleteSantri(id);
        setSelectedIds(prev => prev.filter(sid => sid !== id));
        showSuccess("Terhapus", "Data santri berhasil dihapus");
      } catch (error) {
        showError("Gagal", "Terjadi kesalahan saat menghapus data santri.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleJadikanAlumni = async (id: string) => {
    const confirmed = await showConfirm("Jadikan Alumni?", "Status santri akan berubah menjadi alumni dan pindah ke halaman Database Alumni.");
    if (confirmed) {
      setIsLoading(true);
      try {
        await jadikanAlumni(id);
        setSelectedIds(prev => prev.filter(sid => sid !== id));
        showSuccess("Berhasil", "Santri telah menjadi alumni.");
      } catch (error) {
        showError("Gagal", "Terjadi kesalahan sistem.");
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleJadikanAlumniBatch = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = await showConfirm("Jadikan Alumni?", `Anda yakin akan memindahkan ${selectedIds.length} santri ini ke Database Alumni?`);
    if (confirmed) {
      setIsLoading(true);
      try {
        await jadikanAlumniBatch(selectedIds);
        setSelectedIds([]);
        showSuccess("Berhasil", `${selectedIds.length} santri telah menjadi alumni.`);
      } catch (error) {
        showError("Gagal", "Terjadi kesalahan sistem.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredSantri.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleHalaqohChange = async (id: string, newIdHalaqoh: string) => {
    try {
      await updateHalaqoh(id, newIdHalaqoh === "" ? null : newIdHalaqoh);
      showSuccess("Berhasil", "Halaqoh santri berhasil diperbarui");
    } catch (err) {
      showError("Gagal", "Gagal memperbarui halaqoh santri");
    }
  };

  const handleHalaqohBatchChange = async () => {
    if (selectedIds.length === 0) {
      showError("Pilih Santri", "Pilih minimal 1 santri untuk dipindahkan halaqohnya.");
      return;
    }
    const confirmed = await showConfirm("Pindah Halaqoh?", `Anda yakin ingin memindahkan ${selectedIds.length} santri yang dipilih ke halaqoh tersebut?`);
    if (confirmed) {
      setIsLoading(true);
      try {
        await updateHalaqohBatch(selectedIds, batchHalaqoh === "" ? null : batchHalaqoh);
        showSuccess("Berhasil", `${selectedIds.length} santri berhasil dipindah halaqohnya.`);
        setSelectedIds([]);
      } catch (err) {
        showError("Gagal", "Gagal memperbarui halaqoh secara massal.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSesiBatchChange = async () => {
    if (selectedIds.length === 0) {
      showError("Pilih Santri", "Pilih minimal 1 santri untuk diatur sesinya.");
      return;
    }
    const confirmed = await showConfirm("Ubah Sesi?", `Anda yakin ingin mengubah sesi absensi ${selectedIds.length} santri yang dipilih?`);
    if (confirmed) {
      setIsLoading(true);
      try {
        await updateSesiBatch(selectedIds, batchSesi === "" ? null : batchSesi);
        showSuccess("Berhasil", `${selectedIds.length} santri berhasil diubah sesinya.`);
        setSelectedIds([]);
      } catch (err) {
        showError("Gagal", "Gagal memperbarui sesi secara massal.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const downloadQR = async (qrText: string, filename: string) => {
    try {
      const dataUrl = await QRCode.toDataURL(qrText, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 1200,     // Resolusi tinggi untuk cetak
        margin: 2,       // Jarak aman margin
        color: {
          dark: '#000000',
          light: '#FFFFFF' // Background putih murni agar aman saat dicetak
        }
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadQRSelected = async () => {
    if (selectedIds.length === 0) return;
    const selectedSantri = filteredSantri.filter(s => selectedIds.includes(s.id));
    for (const s of selectedSantri) {
      await downloadQR(s.kodeQr || s.nomorInduk, `QR_${s.nomorInduk}_${s.namaLengkap.replace(/\s+/g, '_')}`);
      // small delay to prevent browser from blocking multiple downloads
      await new Promise(res => setTimeout(res, 300));
    }
  };

  const handleDownloadQRAll = async () => {
    if (filteredSantri.length === 0) return;
    const confirmed = await showConfirm("Download Semua QR?", `Anda akan mengunduh ${filteredSantri.length} gambar QR Code. Lanjutkan?`);
    if (confirmed) {
      for (const s of filteredSantri) {
        await downloadQR(s.kodeQr || s.nomorInduk, `QR_${s.nomorInduk}_${s.namaLengkap.replace(/\s+/g, '_')}`);
        await new Promise(res => setTimeout(res, 300));
      }
    }
  };

  const handleSyncQR = async () => {
    const confirmed = await showConfirm("Sinkronisasi QR Lama?", "Ini akan memperbarui kode_qr semua santri agar menggunakan NIS. Lanjutkan?");
    if (confirmed) {
      setIsLoading(true);
      try {
        const res = await syncQRCodeBatch();
        showSuccess("Berhasil", `Tersinkronisasi ${res.count} data santri.`);
      } catch (error) {
        showError("Gagal", "Terjadi kesalahan saat sinkronisasi.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleExport = (all: boolean) => {
    let dataToExport = [];
    if (all) {
      dataToExport = filteredSantri;
    } else {
      if (selectedIds.length === 0) {
        showError("Pilih Data", "Pilih minimal 1 santri untuk diexport");
        return;
      }
      dataToExport = filteredSantri.filter(s => selectedIds.includes(s.id));
    }

    if (dataToExport.length === 0) {
      showError("Data Kosong", "Tidak ada data untuk diexport");
      return;
    }

    const exportData = dataToExport.map(s => ({
      NIS: s.nomorInduk,
      "Nama Lengkap": s.namaLengkap,
      Halaqoh: s.halaqoh || "",
      "Kontak Wali": s.kontakOrtu,
      Status: s.statusSantri,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Santri");
    XLSX.writeFile(wb, "Data_Santri.xlsx");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const res = await importSantriBatch(jsonData);
      if (res.success) {
        showSuccess("Import Berhasil", `${res.count} data santri baru berhasil ditambahkan. Data duplikat diabaikan.`);
      } else {
        showError("Import Gagal", "Terjadi kesalahan saat memproses data.");
      }
    } catch (err) {
      showError("Gagal", "Format file tidak valid. Pastikan Anda mengupload file .xlsx atau .xls");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">Database Santri</h1>
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <input
            type="file"
            accept=".xlsx, .xls"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImport}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
          
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => handleExport(false)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 shadow-sm rounded font-medium text-sm hover:text-emerald-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Pilihan
            </button>
            <button 
              onClick={() => handleExport(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white text-slate-700 shadow-sm rounded font-medium text-sm hover:text-emerald-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Semua
            </button>
          </div>

          <div className="flex gap-1 bg-indigo-50 p-1 rounded-lg">
            <button 
              onClick={handleDownloadQRSelected}
              className="flex items-center gap-2 px-3 py-1.5 bg-white text-indigo-700 shadow-sm rounded font-medium text-sm hover:text-indigo-900 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              QR Terpilih
            </button>
            <button 
              onClick={handleDownloadQRAll}
              className="flex items-center gap-2 px-3 py-1.5 bg-white text-indigo-700 shadow-sm rounded font-medium text-sm hover:text-indigo-900 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              Semua QR
            </button>
            <button 
              onClick={handleSyncQR}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-1.5 bg-white text-rose-600 shadow-sm rounded font-medium text-sm hover:text-rose-800 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              Sinkronisasi QR Lama
            </button>
          </div>

          <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-lg">
            <select
              value={batchHalaqoh}
              onChange={(e) => setBatchHalaqoh(e.target.value)}
              className="bg-white border border-amber-200 text-amber-900 text-sm rounded px-2 py-1.5 focus:ring-amber-500 focus:border-amber-500 max-w-[120px]"
            >
              <option value="">Pilih Halaqoh...</option>
              {halaqohList.map((h) => (
                <option key={h.id} value={h.id}>{h.namaHalaqoh}</option>
              ))}
            </select>
            <button 
              onClick={handleHalaqohBatchChange}
              disabled={isLoading || selectedIds.length === 0}
              className="px-3 py-1.5 bg-amber-600 text-white shadow-sm rounded font-medium text-sm hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              Pindah Massal
            </button>
          </div>

          <div className="flex items-center gap-1 bg-emerald-50 p-1 rounded-lg">
            <select
              value={batchSesi}
              onChange={(e) => setBatchSesi(e.target.value)}
              className="bg-white border border-emerald-200 text-emerald-900 text-sm rounded px-2 py-1.5 focus:ring-emerald-500 focus:border-emerald-500 max-w-[120px]"
            >
              <option value="">Pilih Sesi...</option>
              {sesiList?.map((s) => (
                <option key={s.id} value={s.id}>{s.namaSesi}</option>
              ))}
            </select>
            <button 
              onClick={handleSesiBatchChange}
              disabled={isLoading || selectedIds.length === 0}
              className="px-3 py-1.5 bg-emerald-600 text-white shadow-sm rounded font-medium text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              Ubah Sesi
            </button>
          </div>

          <button 
            onClick={() => {
              setEditingId(null);
              form.reset({ nomorInduk: "", namaLengkap: "", idHalaqoh: "", kontakOrtu: "", statusSantri: "aktif", kodeQr: "" });
              setIsDialogOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-5 h-5" />
            Tambah Santri
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Cari berdasarkan nama atau NIS..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 w-full sm:w-auto">
              <span className="text-sm font-medium text-amber-800">{selectedIds.length} Terpilih</span>
              <button 
                onClick={handleJadikanAlumniBatch}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded font-medium text-sm hover:bg-amber-700 transition-colors"
              >
                <GraduationCap className="w-4 h-4" />
                Jadikan Alumni
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.length === filteredSantri.length && filteredSantri.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="p-4 font-semibold text-slate-600 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleSort("nomorInduk")}>
                  <div className="flex items-center gap-1">
                    NIS
                    {sortField === "nomorInduk" && (sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </th>
                <th className="p-4 font-semibold text-slate-600 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleSort("namaLengkap")}>
                  <div className="flex items-center gap-1">
                    Nama Lengkap
                    {sortField === "namaLengkap" && (sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </th>
                <th className="p-4 font-semibold text-slate-600 text-sm cursor-pointer hover:bg-slate-100 transition-colors select-none" onClick={() => handleSort("halaqoh")}>
                  <div className="flex items-center gap-1">
                    Halaqoh
                    {sortField === "halaqoh" && (sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Kontak Wali</th>
                <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-slate-600 text-sm text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedSantri.length > 0 ? (
                paginatedSantri.map((s) => (
                  <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.includes(s.id) ? 'bg-emerald-50/50' : ''}`}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(s.id)}
                        onChange={() => handleSelect(s.id)}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="p-4 font-medium text-slate-900">{s.nomorInduk}</td>
                    <td className="p-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs">
                          {s.namaLengkap.charAt(0)}
                        </div>
                        {s.namaLengkap}
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      <select
                        value={s.idHalaqoh || ""}
                        onChange={(e) => handleHalaqohChange(s.id, e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded px-2 py-1 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">- Tidak Ada -</option>
                        {halaqohList.map((h) => (
                          <option key={h.id} value={h.id}>{h.namaHalaqoh}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      <div className="flex flex-col">
                        <span>{s.kontakOrtu}</span>
                        <span className="text-xs text-slate-400 font-mono mt-1">QR: {s.kodeQr || "Belum Ada"}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${s.statusSantri === 'aktif' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {s.statusSantri === 'aktif' ? 'Aktif' : 'Non-Aktif'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button 
                          onClick={() => handleJadikanAlumni(s.id)} 
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Jadikan Alumni"
                        >
                          <GraduationCap className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => downloadQR(s.kodeQr || s.nomorInduk, `QR_${s.nomorInduk}_${s.namaLengkap.replace(/\s+/g, '_')}`)}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Download QR"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setFaceRegistrationSantri({ id: s.id, namaLengkap: s.namaLengkap })}
                          className={`p-2 rounded-lg transition-colors ${s.hasFaceData ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                          title={s.hasFaceData ? "Wajah Sudah Terdaftar" : "Daftarkan Wajah"}
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleEdit(s)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.id)} 
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Belum ada data santri.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination UI */}
        {filteredSantri.length > 0 && (
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50">
            <div className="text-sm text-slate-500 font-medium">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredSantri.length)} dari {filteredSantri.length} data
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 transition-colors"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <span className="text-sm font-medium text-slate-700 min-w-[100px] text-center">
                Hal {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1 rounded hover:bg-slate-200 disabled:opacity-50 transition-colors"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
              
              <form onSubmit={handleJumpPage} className="flex items-center gap-1 ml-2 sm:ml-4 sm:border-l border-slate-300 sm:pl-4">
                <span className="text-sm text-slate-500 hidden sm:inline">Ke halaman:</span>
                <input 
                  type="text" 
                  value={jumpPage} 
                  onChange={(e) => setJumpPage(e.target.value)}
                  placeholder="#"
                  className="w-12 px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 text-center"
                />
                <button type="submit" className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-md transition-colors">
                  Go
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Dialog Overlay */}
      {isDialogOpen && (
        <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex-shrink-0 rounded-t-2xl">
              <h2 className="text-xl font-bold">{editingId ? "Edit Santri" : "Tambah Santri Baru"}</h2>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="santriForm" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* A. Identitas Santri */}
                <div>
                  <h4 className="font-bold text-emerald-700 border-b pb-2 mb-4">A. Identitas Santri</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nomor Induk Santri (NIS)</label>
                      {editingId ? (
                        <>
                          <input {...form.register("nomorInduk")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                          {form.formState.errors.nomorInduk && <span className="text-xs text-rose-500">{form.formState.errors.nomorInduk.message}</span>}
                        </>
                      ) : (
                        <input disabled value="Dibuat Otomatis (Tahun + Random)" className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500" />
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                      <input {...form.register("namaLengkap")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      {form.formState.errors.namaLengkap && <span className="text-xs text-rose-500">{form.formState.errors.namaLengkap.message}</span>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tempat Lahir</label>
                      <input {...form.register("tempatLahir")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
                      <input type="date" {...form.register("tanggalLahir")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Kelamin</label>
                      <select {...form.register("jenisKelamin")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                        <option value="">-- Pilih --</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap (Sesuai KK)</label>
                      <input {...form.register("alamatLengkap")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-1 mt-6">
                        <input type="checkbox" {...form.register("isAlamatDomisiliSama")} className="rounded text-emerald-600 focus:ring-emerald-500" />
                        <span>Alamat Domisili sama dengan KK</span>
                      </label>
                    </div>
                    {!form.watch("isAlamatDomisiliSama") && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Alamat Domisili</label>
                        <input {...form.register("alamatDomisili")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                    )}
                  </div>
                </div>

                {/* B. Pendidikan & Kegiatan */}
                <div>
                  <h4 className="font-bold text-emerald-700 border-b pb-2 mb-4">B. Pendidikan & Kegiatan</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Jenjang Sekolah</label>
                      <select {...form.register("jenjangSekolah")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                        <option value="">-- Pilih Jenjang --</option>
                        <option value="Belum Sekolah">Belum Sekolah</option>
                        <option value="TK">TK / PAUD</option>
                        <option value="SD/MI">SD / MI</option>
                        <option value="SMP/MTs">SMP / MTs</option>
                        <option value="SMA/MA">SMA / MA</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    {form.watch("jenjangSekolah") === "Lainnya" && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Sebutkan Jenjang</label>
                        <input {...form.register("jenjangSekolahLainnya")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nama Sekolah</label>
                      <input {...form.register("namaSekolah")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
                      <input {...form.register("kelasSekolah")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                    </div>
                    <div>
                      <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-1 mt-6">
                        <input type="checkbox" {...form.register("ikutLes")} className="rounded text-emerald-600 focus:ring-emerald-500" />
                        <span>Mengikuti Kegiatan Les/Ekskul Luar</span>
                      </label>
                    </div>
                    {form.watch("ikutLes") && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Hari Les</label>
                          <input {...form.register("hariLes")} placeholder="Contoh: Senin & Rabu" className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Jam Mulai</label>
                            <input type="time" {...form.register("jamLesMulai")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Jam Selesai</label>
                            <input type="time" {...form.register("jamLesSelesai")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* C. Identitas Orang Tua */}
                <div>
                  <h4 className="font-bold text-emerald-700 border-b pb-2 mb-4">C. Identitas Orang Tua</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Data Ayah */}
                    <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
                      <h5 className="font-semibold text-slate-700">Data Ayah</h5>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Ayah</label>
                        <input {...form.register("namaAyah")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pekerjaan Ayah</label>
                        <select {...form.register("pekerjaanAyah")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                          <option value="">-- Pilih --</option>
                          <option value="PNS">PNS / TNI / POLRI</option>
                          <option value="Pegawai Swasta">Pegawai Swasta</option>
                          <option value="Wiraswasta">Wiraswasta / Pengusaha</option>
                          <option value="Tenaga Medis">Tenaga Medis</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      {form.watch("pekerjaanAyah") === "Lainnya" && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Pekerjaan Lainnya</label>
                          <input {...form.register("pekerjaanAyahLainnya")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Instansi / Usaha</label>
                        <input {...form.register("instansiAyah")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                    </div>

                    {/* Data Ibu */}
                    <div className="space-y-4 p-4 border border-slate-200 rounded-lg">
                      <h5 className="font-semibold text-slate-700">Data Ibu</h5>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Ibu</label>
                        <input {...form.register("namaIbu")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pekerjaan Ibu</label>
                        <select {...form.register("pekerjaanIbu")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                          <option value="">-- Pilih --</option>
                          <option value="Ibu Rumah Tangga">Ibu Rumah Tangga</option>
                          <option value="PNS">PNS / TNI / POLRI</option>
                          <option value="Pegawai Swasta">Pegawai Swasta</option>
                          <option value="Wiraswasta">Wiraswasta / Pengusaha</option>
                          <option value="Tenaga Medis">Tenaga Medis</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      {form.watch("pekerjaanIbu") === "Lainnya" && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Pekerjaan Lainnya</label>
                          <input {...form.register("pekerjaanIbuLainnya")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nama Instansi / Usaha</label>
                        <input {...form.register("instansiIbu")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-emerald-700 mb-1">Nomor WhatsApp Wali Aktif</label>
                      <input {...form.register("kontakOrtu")} placeholder="0812..." className="w-full px-3 py-2 rounded-lg border border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
                      {form.formState.errors.kontakOrtu && <span className="text-xs text-rose-500">{form.formState.errors.kontakOrtu.message}</span>}
                    </div>
                  </div>
                </div>

                {/* D. Data Internal */}
                <div>
                  <h4 className="font-bold text-emerald-700 border-b pb-2 mb-4">D. Data Internal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Halaqoh</label>
                      <select {...form.register("idHalaqoh")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                        <option value="">-- Pilih Halaqoh --</option>
                        {halaqohList.map((h) => (
                          <option key={h.id} value={h.id}>{h.namaHalaqoh}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Jadwal Sesi Absensi</label>
                      <select {...form.register("idSesiAbsensi")} className="w-full px-3 py-2 rounded-lg border border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-emerald-50/30">
                        <option value="">-- Pilih Sesi --</option>
                        {sesiList?.map((s) => (
                          <option key={s.id} value={s.id}>{s.namaSesi}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Status Santri</label>
                      <select {...form.register("statusSantri")} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500">
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Non-Aktif</option>
                      </select>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 flex-shrink-0 rounded-b-2xl">
              <button type="button" onClick={() => setIsDialogOpen(false)} disabled={isLoading} className="px-4 py-2 text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg font-medium transition-colors">
                Batal
              </button>
              <button type="submit" form="santriForm" disabled={isLoading} className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50">
                {isLoading ? "Menyimpan..." : (editingId ? "Simpan Perubahan" : "Tambah Santri")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pendaftaran Wajah */}
      {faceRegistrationSantri && (
        <RegisterWajahModal 
          isOpen={faceRegistrationSantri !== null}
          santri={faceRegistrationSantri}
          onClose={() => setFaceRegistrationSantri(null)}
        />
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Plus, Users, UserCheck, UserX, Wallet, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table/data-table";
import { getSantriPrivatColumns, type SantriPrivat } from "./columns";
import {
  createSantriPrivat,
  updateSantriPrivat,
  deleteSantriPrivat,
} from "./actions";
import { formatRp } from "@/lib/utils";
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const formSchema = z.object({
  namaLengkap: z
    .string()
    .trim()
    .min(1, "Nama lengkap santri wajib diisi")
    .max(150, "Nama santri maksimal 150 karakter"),
  nomorInduk: z
    .string()
    .trim()
    .max(50, "Nomor Induk maksimal 50 karakter")
    .optional(),
  kontakOrtu: z
    .string()
    .trim()
    .min(1, "Nomor kontak orang tua/wali wajib diisi")
    .max(30, "Nomor kontak maksimal 30 karakter"),
  password: z
    .string()
    .trim()
    .max(100, "Password maksimal 100 karakter")
    .optional(),
  jenisTagihan: z.enum(["bulanan", "per_pertemuan"]),
  nominalTagihanBulanan: z
    .number()
    .min(0, "Nominal tagihan tidak boleh bernilai negatif"),
  tarifPerPertemuan: z
    .number()
    .min(0, "Tarif per pertemuan tidak boleh negatif"),
  statusSantri: z.enum(["aktif", "nonaktif"]),
});

type FormValues = z.infer<typeof formSchema>;

interface SantriPrivatClientProps {
  initialData: SantriPrivat[];
}

export function SantriPrivatClient({ initialData }: SantriPrivatClientProps) {
  const [data, setData] = useState<SantriPrivat[]>(initialData);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSantri, setEditingSantri] = useState<SantriPrivat | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayNominal, setDisplayNominal] = useState<string>("");
  const [displayTarif, setDisplayTarif] = useState<string>("");

  // Keep local state in sync when initialData changes from server revalidation
  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      namaLengkap: "",
      nomorInduk: "",
      kontakOrtu: "",
      password: "",
      jenisTagihan: "bulanan",
      nominalTagihanBulanan: 0,
      tarifPerPertemuan: 0,
      statusSantri: "aktif",
    },
  });

  // Reset or populate form when modal opens
  useEffect(() => {
    if (isModalOpen) {
      if (editingSantri) {
        const nominal = editingSantri.nominalTagihanBulanan ?? 0;
        const tarif = editingSantri.tarifPerPertemuan ?? 0;
        setDisplayNominal(
          nominal > 0 ? new Intl.NumberFormat("id-ID").format(nominal) : "0"
        );
        setDisplayTarif(
          tarif > 0 ? new Intl.NumberFormat("id-ID").format(tarif) : "0"
        );
        form.reset({
          namaLengkap: editingSantri.namaLengkap,
          nomorInduk: editingSantri.nomorInduk || "",
          kontakOrtu: editingSantri.kontakOrtu,
          password: editingSantri.password || "",
          jenisTagihan: (editingSantri.jenisTagihan as any) || "bulanan",
          nominalTagihanBulanan: nominal,
          tarifPerPertemuan: tarif,
          statusSantri:
            editingSantri.statusSantri === "nonaktif" ? "nonaktif" : "aktif",
        });
      } else {
        setDisplayNominal("");
        setDisplayTarif("");
        form.reset({
          namaLengkap: "",
          nomorInduk: "",
          kontakOrtu: "",
          password: "",
          jenisTagihan: "bulanan",
          nominalTagihanBulanan: 0,
          tarifPerPertemuan: 0,
          statusSantri: "aktif",
        });
      }
    }
  }, [isModalOpen, editingSantri, form]);

  // Real-time Indonesian Rupiah dot-formatting input handler
  const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "");
    if (!rawDigits) {
      setDisplayNominal("");
      form.setValue("nominalTagihanBulanan", 0, { shouldValidate: true });
    } else {
      const parsed = parseInt(rawDigits, 10);
      setDisplayNominal(new Intl.NumberFormat("id-ID").format(parsed));
      form.setValue("nominalTagihanBulanan", parsed, { shouldValidate: true });
    }
  };

  const handleNominalBlur = () => {
    if (!displayNominal || displayNominal.trim() === "") {
      setDisplayNominal("0");
      form.setValue("nominalTagihanBulanan", 0, { shouldValidate: true });
    }
  };

  const handleTarifChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, "");
    if (!rawDigits) {
      setDisplayTarif("");
      form.setValue("tarifPerPertemuan", 0, { shouldValidate: true });
    } else {
      const parsed = parseInt(rawDigits, 10);
      setDisplayTarif(new Intl.NumberFormat("id-ID").format(parsed));
      form.setValue("tarifPerPertemuan", parsed, { shouldValidate: true });
    }
  };

  const handleTarifBlur = () => {
    if (!displayTarif || displayTarif.trim() === "") {
      setDisplayTarif("0");
      form.setValue("tarifPerPertemuan", 0, { shouldValidate: true });
    }
  };

  // Summary Metrics
  const totalSantri = data.length;
  const santriAktif = data.filter((s) => s.statusSantri === "aktif").length;
  const santriNonAktif = data.filter((s) => s.statusSantri !== "aktif").length;
  const totalEstimasiTagihan = data
    .filter((s) => s.statusSantri === "aktif")
    .reduce((sum, s) => sum + (s.nominalTagihanBulanan || 0), 0);

  const handleCreate = () => {
    setEditingSantri(null);
    setIsModalOpen(true);
  };

  const handleEdit = (santri: SantriPrivat) => {
    setEditingSantri(santri);
    setIsModalOpen(true);
  };

  const handleDelete = async (santri: SantriPrivat) => {
    const confirmed = await showConfirm(
      "Hapus Santri Privat?",
      `Apakah Anda yakin ingin menghapus data "${santri.namaLengkap}"? Data tidak dapat dipulihkan.`,
      "Ya, Hapus",
      true
    );

    if (!confirmed) return;

    try {
      const res = await deleteSantriPrivat(santri.id);
      if (res.success) {
        setData((prev) => prev.filter((item) => item.id !== santri.id));
        await showSuccess(
          "Berhasil Dihapus",
          `Data santri "${santri.namaLengkap}" telah dihapus.`
        );
      } else {
        await showError(
          "Gagal Menghapus",
          res.error || "Terjadi kesalahan saat menghapus data."
        );
      }
    } catch {
      await showError("Kesalahan Server", "Tidak dapat terhubung ke server.");
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (editingSantri) {
        const res = await updateSantriPrivat(editingSantri.id, {
          namaLengkap: values.namaLengkap,
          nomorInduk: values.nomorInduk || null,
          kontakOrtu: values.kontakOrtu,
          password: values.password || null,
          jenisTagihan: values.jenisTagihan,
          nominalTagihanBulanan: values.nominalTagihanBulanan,
          tarifPerPertemuan: values.tarifPerPertemuan,
          statusSantri: values.statusSantri,
        });

        if (res.success) {
          setData((prev) =>
            prev.map((item) =>
              item.id === editingSantri.id
                ? {
                    ...item,
                    namaLengkap: values.namaLengkap,
                    nomorInduk: values.nomorInduk || null,
                    kontakOrtu: values.kontakOrtu,
                    password: values.password || null,
                    jenisTagihan: values.jenisTagihan,
                    nominalTagihanBulanan: values.nominalTagihanBulanan,
                    tarifPerPertemuan: values.tarifPerPertemuan,
                    statusSantri: values.statusSantri,
                  }
                : item
            )
          );
          setIsModalOpen(false);
          await showSuccess(
            "Berhasil Diperbarui",
            `Data santri "${values.namaLengkap}" berhasil diperbarui.`
          );
        } else {
          await showError(
            "Gagal Memperbarui",
            res.error || "Terjadi kesalahan saat memperbarui data."
          );
        }
      } else {
        const res = await createSantriPrivat({
          namaLengkap: values.namaLengkap,
          nomorInduk: values.nomorInduk || null,
          kontakOrtu: values.kontakOrtu,
          password: values.password || null,
          jenisTagihan: values.jenisTagihan,
          nominalTagihanBulanan: values.nominalTagihanBulanan,
          tarifPerPertemuan: values.tarifPerPertemuan,
          statusSantri: values.statusSantri,
        });

        if (res.success && res.id) {
          const newSantri: SantriPrivat = {
            id: res.id,
            namaLengkap: values.namaLengkap,
            nomorInduk: values.nomorInduk || null,
            kontakOrtu: values.kontakOrtu,
            password: values.password || null,
            jenisTagihan: values.jenisTagihan,
            nominalTagihanBulanan: values.nominalTagihanBulanan,
            tarifPerPertemuan: values.tarifPerPertemuan,
            statusSantri: values.statusSantri,
            createdAt: new Date(),
          };
          setData((prev) => [newSantri, ...prev]);
          setIsModalOpen(false);
          await showSuccess(
            "Berhasil Ditambahkan",
            `Santri privat "${values.namaLengkap}" berhasil didaftarkan.`
          );
        } else {
          await showError(
            "Gagal Menambahkan",
            res.error || "Terjadi kesalahan saat menambahkan santri baru."
          );
        }
      }
    } catch {
      await showError("Kesalahan Server", "Tidak dapat terhubung ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Manajemen Santri Privat
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data pendaftaran, kontak wali, dan tagihan bulanan santri kelas privat Al-Qur&apos;an.
          </p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-xs transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Santri Privat
        </Button>
      </div>

      {/* Summary Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Santri
            </span>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{totalSantri}</div>
          <span className="text-xs text-slate-400 mt-1 block">Total terdaftar</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              Santri Aktif
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{santriAktif}</div>
          <span className="text-xs text-emerald-600/70 mt-1 block">Mengikuti sesi</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">
              Non-Aktif
            </span>
            <div className="p-2 bg-rose-50 text-rose-500 rounded-lg">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{santriNonAktif}</div>
          <span className="text-xs text-rose-400 mt-1 block">Cuti / nonaktif</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
              Estimasi Tagihan
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">
            {formatRp(totalEstimasiTagihan)}
          </div>
          <span className="text-xs text-indigo-500 mt-1 block">Per bulan (santri aktif)</span>
        </div>
      </div>

      {/* Tablecn Data Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
        <DataTable
          columns={getSantriPrivatColumns({
            onEdit: handleEdit,
            onDelete: handleDelete,
          })}
          data={data}
          searchKey="namaLengkap"
          searchPlaceholder="Cari nama santri privat..."
          sortColumn="createdAt"
          rowSelection={rowSelection}
          onRowSelectionChange={setRowSelection}
          toolbarActions={(table) => {
            const selectedRows = table.getSelectedRowModel().rows;
            return (
              <div className="flex items-center gap-2">
                <select
                  value={(table.getColumn("statusSantri")?.getFilterValue() as string) ?? ""}
                  onChange={(e) => table.getColumn("statusSantri")?.setFilterValue(e.target.value)}
                  className="h-9 px-3 py-1 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-emerald-500 text-slate-700 shadow-xs"
                >
                  <option value="">Semua Status</option>
                  <option value="aktif">Aktif</option>
                  <option value="nonaktif">Non-Aktif</option>
                </select>
                {selectedRows.length > 0 && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                    {selectedRows.length} Terpilih
                  </span>
                )}
              </div>
            );
          }}
        />
      </div>

      {/* Modal Dialog Form for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingSantri ? "Edit Data Santri Privat" : "Tambah Santri Privat Baru"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi formulir pendaftaran santri kelas privat Al-Qur&apos;an.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Nama Lengkap */}
              <div>
                <label
                  htmlFor="namaLengkap"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Nama Lengkap Santri <span className="text-rose-500">*</span>
                </label>
                <input
                  id="namaLengkap"
                  type="text"
                  placeholder="Contoh: Muhammad Al-Fatih"
                  {...form.register("namaLengkap")}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                />
                {form.formState.errors.namaLengkap && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    {form.formState.errors.namaLengkap.message}
                  </p>
                )}
              </div>

              {/* NIS (Nomor Induk) */}
              <div>
                <label
                  htmlFor="nomorInduk"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Nomor Induk Santri (NIS) <span className="text-xs text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  id="nomorInduk"
                  type="text"
                  placeholder="Contoh: PRV-2026-001"
                  {...form.register("nomorInduk")}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-mono"
                />
                {form.formState.errors.nomorInduk && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    {form.formState.errors.nomorInduk.message}
                  </p>
                )}
              </div>

              {/* Kontak Wali */}
              <div>
                <label
                  htmlFor="kontakOrtu"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Kontak WhatsApp Wali/Orang Tua <span className="text-rose-500">*</span>
                </label>
                <input
                  id="kontakOrtu"
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  {...form.register("kontakOrtu")}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-mono"
                />
                {form.formState.errors.kontakOrtu && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    {form.formState.errors.kontakOrtu.message}
                  </p>
                )}
              </div>

              {form.watch("jenisTagihan") === "bulanan" ? (
                <div>
                  <label
                    htmlFor="nominalTagihanBulanan"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Nominal Tagihan Bulanan (Flat-rate) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <span className="text-slate-500 font-semibold text-sm">Rp</span>
                    </div>
                    <input
                      id="nominalTagihanBulanan"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={displayNominal}
                      onChange={handleNominalChange}
                      onBlur={handleNominalBlur}
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                  {form.formState.errors.nominalTagihanBulanan && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">
                      {form.formState.errors.nominalTagihanBulanan.message}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">
                    Nominal tagihan tetap yang akan digenerate otomatis setiap bulan untuk santri ini.
                  </p>
                </div>
              ) : null}
\n
              {/* Password Portal Santri */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Password (Opsional untuk login Portal Santri)
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <input
                    id="password"
                    type="text"
                    {...form.register("password")}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                {form.formState.errors.password && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              {/* Jenis Tagihan */}
              <div>
                <label
                  htmlFor="jenisTagihan"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Jenis Tagihan <span className="text-rose-500">*</span>
                </label>
                <select
                  id="jenisTagihan"
                  {...form.register("jenisTagihan")}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="bulanan">Bulanan (Flat-rate per bulan)</option>
                  <option value="per_pertemuan">Per Pertemuan (Dihitung berdasarkan kehadiran)</option>
                </select>
                {form.formState.errors.jenisTagihan && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    {form.formState.errors.jenisTagihan.message}
                  </p>
                )}
              </div>

              {/* Tarif Per Pertemuan (Conditionally rendered or always shown but styled differently) */}
              {form.watch("jenisTagihan") === "per_pertemuan" ? (
                <div>
                  <label
                    htmlFor="tarifPerPertemuan"
                    className="block text-sm font-semibold text-slate-700 mb-1"
                  >
                    Tarif Per Pertemuan <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative rounded-xl shadow-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                      <span className="text-slate-500 font-semibold text-sm">Rp</span>
                    </div>
                    <input
                      id="tarifPerPertemuan"
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={displayTarif}
                      onChange={handleTarifChange}
                      onBlur={handleTarifBlur}
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                  {form.formState.errors.tarifPerPertemuan && (
                    <p className="text-xs text-rose-500 mt-1 font-medium">
                      {form.formState.errors.tarifPerPertemuan.message}
                    </p>
                  )}
                </div>
              ) : null}
{/* Status Santri */}
              <div>
                <label
                  htmlFor="statusSantri"
                  className="block text-sm font-semibold text-slate-700 mb-1"
                >
                  Status Keaktifan Santri
                </label>
                <select
                  id="statusSantri"
                  {...form.register("statusSantri")}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                >
                  <option value="aktif">Aktif (Mengikuti Sesi Privat)</option>
                  <option value="nonaktif">Non-Aktif (Cuti / Selesai)</option>
                </select>
                {form.formState.errors.statusSantri && (
                  <p className="text-xs text-rose-500 mt-1 font-medium">
                    {form.formState.errors.statusSantri.message}
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-xl px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2 text-sm font-semibold shadow-xs"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingSantri ? "Simpan Perubahan" : "Tambah Santri"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

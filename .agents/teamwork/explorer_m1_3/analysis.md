# Analysis: Form Validation, Real-Time Currency Formatting & Navigation (Milestone 1)

## Executive Summary
This analysis outlines the exact implementation strategy for the frontend interaction layer of **Milestone 1 (Manajemen Data Santri Privat)**, specifically:
1. **Zod Schema & Modal Form** in `SantriPrivatClient.tsx` for Create & Update operations.
2. **Real-Time Indonesian Rupiah (IDR) Dot-Formatting Input** for `nominalTagihanBulanan` adhering to GEMINI.md standards (auto-formatting dots while typing, storing pure integer).
3. **SweetAlert2 Notifications & Confirmations** integrated via `@/lib/sweetalert` (`showConfirm`, `showSuccess`, `showError`).
4. **Sidebar Navigation Integration** in `src/components/Sidebar.tsx` under the Database group with the `Users` icon.
5. **Strict Compliance** with AGENTS.md (zero TypeScript errors, no implicit any) and GEMINI.md (WIB timezone, IDR dot formatting, Tablecn standardization).

---

## 1. Zod Validation Schema

The data model in `src/db/schema.ts` (`santriPrivat`) contains:
- `id`: `text('id').primaryKey()`
- `namaLengkap`: `text('nama_lengkap').notNull()`
- `nomorInduk`: `text('nomor_induk')` (optional)
- `kontakOrtu`: `text('kontak_ortu').notNull()`
- `statusSantri`: `text('status_santri').notNull().default('aktif')` (`'aktif' | 'nonaktif'`)
- `nominalTagihanBulanan`: `integer('nominal_tagihan_bulanan').notNull().default(0)`
- `createdAt`: `integer('created_at', { mode: 'timestamp' })`

### Schema Definition
```typescript
import { z } from "zod";

export const santriPrivatSchema = z.object({
  namaLengkap: z
    .string()
    .trim()
    .min(1, "Nama lengkap santri wajib diisi")
    .max(100, "Nama santri maksimal 100 karakter"),
  nomorInduk: z
    .string()
    .trim()
    .max(50, "Nomor Induk maksimal 50 karakter")
    .optional()
    .or(z.literal("")),
  kontakOrtu: z
    .string()
    .trim()
    .min(1, "Nomor kontak orang tua/wali wajib diisi")
    .regex(/^[0-9+\-\s]{8,20}$/, "Format nomor kontak tidak valid (minimal 8 angka)"),
  nominalTagihanBulanan: z
    .number({ invalid_type_error: "Nominal tagihan harus berupa angka" })
    .min(0, "Nominal tagihan tidak boleh bernilai negatif"),
  statusSantri: z.enum(["aktif", "nonaktif"], {
    errorMap: () => ({ message: "Status santri harus aktif atau nonaktif" }),
  }),
});

export type SantriPrivatFormValues = z.infer<typeof santriPrivatSchema>;
```

### Type Invariants & Constraints
- `nomorInduk` is optional. Empty string `""` is coerced to `undefined` or `null` before passing to server actions if desired.
- `kontakOrtu` must be valid numeric/phone formatting (supports Indonesian international prefix `+62` or local `08...`).
- `nominalTagihanBulanan` must be non-negative integer.

---

## 2. Real-Time Indonesian Rupiah Dot-Formatting Input

### GEMINI.md Rule Requirements
1. **Format Tampilan**: Wajib menggunakan tanda titik (`.`) sebagai pemisah ribuan (contoh: `1.000` atau `250.000`).
2. **Format Input (Form)**: Saat pengguna mengetik nominal di form, angka harus otomatis diformat dengan tanda titik ribuan (*auto-formatting*) agar mencegah salah ketik.
3. **Database Value**: Nilai asli yang dikirim ke database wajib berupa angka murni (*integer/number*) tanpa tanda baca.

### Implementation Pattern
To avoid cursor jump and backspacing traps (e.g. typing Backspace on `0`), the form maintains:
1. `displayNominal`: local string state with thousand separators (e.g. `"250.000"`).
2. `form.setValue("nominalTagihanBulanan", parsedInteger)`: sets pure integer into `react-hook-form`.

```typescript
const [displayNominal, setDisplayNominal] = useState<string>("");

// Handler triggered on every keystroke
const handleNominalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // Strip non-digit characters
  const rawDigits = e.target.value.replace(/\D/g, "");
  
  if (!rawDigits) {
    setDisplayNominal("");
    form.setValue("nominalTagihanBulanan", 0, { shouldValidate: true });
  } else {
    const parsed = parseInt(rawDigits, 10);
    // Format with Indonesian locale dot thousand separator
    setDisplayNominal(new Intl.NumberFormat("id-ID").format(parsed));
    form.setValue("nominalTagihanBulanan", parsed, { shouldValidate: true });
  }
};

// Handler for blur event to ensure neat display if empty
const handleNominalBlur = () => {
  if (!displayNominal || displayNominal.trim() === "") {
    setDisplayNominal("0");
    form.setValue("nominalTagihanBulanan", 0, { shouldValidate: true });
  }
};
```

### Modal Population during Edit / Add
```typescript
useEffect(() => {
  if (editingSantri) {
    const nominal = editingSantri.nominalTagihanBulanan ?? 0;
    setDisplayNominal(nominal > 0 ? new Intl.NumberFormat("id-ID").format(nominal) : "0");
    form.reset({
      namaLengkap: editingSantri.namaLengkap,
      nomorInduk: editingSantri.nomorInduk || "",
      kontakOrtu: editingSantri.kontakOrtu,
      nominalTagihanBulanan: nominal,
      statusSantri: (editingSantri.statusSantri as "aktif" | "nonaktif") || "aktif",
    });
  } else {
    setDisplayNominal("");
    form.reset({
      namaLengkap: "",
      nomorInduk: "",
      kontakOrtu: "",
      nominalTagihanBulanan: 0,
      statusSantri: "aktif",
    });
  }
}, [editingSantri, isOpen]);
```

### Form Input JSX
```tsx
<div>
  <label htmlFor="nominalTagihanBulanan" className="block text-sm font-semibold text-slate-700 mb-1.5">
    Nominal Tagihan Bulanan (Flat-rate) <span className="text-rose-500">*</span>
  </label>
  <div className="relative rounded-xl shadow-xs">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
      <span className="text-slate-500 font-semibold text-sm">Rp</span>
    </div>
    <input
      type="text"
      id="nominalTagihanBulanan"
      inputMode="numeric"
      placeholder="0"
      value={displayNominal}
      onChange={handleNominalChange}
      onBlur={handleNominalBlur}
      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
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
```

---

## 3. SweetAlert2 Notifications & Confirmations

The application centralizes SweetAlert2 configurations in `src/lib/sweetalert.ts`.

### 1. Delete Confirmation
```typescript
import { showConfirm, showSuccess, showError } from "@/lib/sweetalert";

const handleDelete = async (santri: SantriPrivat) => {
  const isConfirmed = await showConfirm(
    "Hapus Santri Privat?",
    `Apakah Anda yakin ingin menghapus data "${santri.namaLengkap}"? Data tagihan dan riwayat absensi terkait mungkin terpengaruh.`,
    "Ya, Hapus Santri",
    true // isDestructive = true triggers rose-500 confirm button
  );

  if (!isConfirmed) return;

  try {
    const res = await deleteSantriPrivat(santri.id);
    if (res.success) {
      await showSuccess(
        "Berhasil Dihapus",
        `Data santri "${santri.namaLengkap}" telah berhasil dihapus dari sistem.`
      );
      // Trigger table refresh / optimistic state update
    } else {
      await showError(
        "Gagal Menghapus",
        res.error || "Terjadi kesalahan saat menghapus data santri privat."
      );
    }
  } catch (err: any) {
    await showError("Gagal Menghapus", err.message || "Terjadi kesalahan koneksi ke server.");
  }
};
```

### 2. Form Submission (Create & Update)
```typescript
const onSubmit = async (values: SantriPrivatFormValues) => {
  setIsSubmitting(true);
  try {
    if (editingSantri) {
      const res = await updateSantriPrivat(editingSantri.id, {
        namaLengkap: values.namaLengkap,
        nomorInduk: values.nomorInduk || undefined,
        kontakOrtu: values.kontakOrtu,
        nominalTagihanBulanan: values.nominalTagihanBulanan,
        statusSantri: values.statusSantri,
      });

      if (res.success) {
        setIsModalOpen(false);
        await showSuccess(
          "Berhasil Diperbarui",
          `Data santri "${values.namaLengkap}" berhasil diperbarui.`
        );
        onSuccess?.();
      } else {
        await showError(
          "Gagal Memperbarui",
          res.error || "Terjadi kesalahan saat memperbarui data santri."
        );
      }
    } else {
      const res = await createSantriPrivat({
        namaLengkap: values.namaLengkap,
        nomorInduk: values.nomorInduk || undefined,
        kontakOrtu: values.kontakOrtu,
        nominalTagihanBulanan: values.nominalTagihanBulanan,
        statusSantri: values.statusSantri,
      });

      if (res.success) {
        setIsModalOpen(false);
        await showSuccess(
          "Berhasil Ditambahkan",
          `Santri privat "${values.namaLengkap}" berhasil didaftarkan.`
        );
        onSuccess?.();
      } else {
        await showError(
          "Gagal Menambahkan",
          res.error || "Terjadi kesalahan saat menambahkan santri baru."
        );
      }
    }
  } catch (err: any) {
    await showError("Gagal Menyimpan", err.message || "Terjadi kesalahan pada sistem.");
  } finally {
    setIsSubmitting(false);
  }
};
```

---

## 4. Sidebar Navigation Integration

File: `src/components/Sidebar.tsx`

### Location
Under `navGroups`, within the `"Database"` group object (lines 36-44):

```typescript
    {
      title: "Database",
      icon: Users,
      items: [
        { name: "Hasil PSB", href: "/admin-psb", icon: Users },
        { name: "Database Santri", href: "/santri", icon: Users },
        { name: "Santri Privat", href: "/admin/santri-privat", icon: Users }, // NEW ENTRY
        { name: "Database Alumni", href: "/alumni", icon: GraduationCap },
        { name: "Data Pengurus/Guru", href: "/admin-guru", icon: Briefcase },
      ]
    },
```

### Automatic Active State & Expand Behavior
- `Sidebar.tsx` has an `useEffect` tracking `pathname`.
- When navigating to `/admin/santri-privat`, `isChildActive` matches `item.href === "/admin/santri-privat"`.
- The `"Database"` section automatically expands.
- The item receives the active styling: `bg-orange-500/10 text-orange-400 font-semibold` with orange indicator dot.

---

## 5. Modal Dialog Architecture & UI/UX Standards

The modal can be implemented as a dedicated sub-component (`SantriPrivatModal.tsx`) or embedded directly within `SantriPrivatClient.tsx`.

### Visual Structure
- **Backdrop**: `fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6`
- **Dialog Container**: `relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200`
- **Header**: Icon badge with `UserPlus` or `Edit3`, Title "Tambah Santri Privat Baru" or "Edit Data Santri Privat", Subtitle, and Close (X) button.
- **Body Fields**:
  1. `namaLengkap`: text input
  2. `nomorInduk`: text input (NIS, optional)
  3. `kontakOrtu`: phone input with phone icon
  4. `nominalTagihanBulanan`: auto-formatting IDR currency input with "Rp" prefix
  5. `statusSantri`: select dropdown ("Aktif" / "Non-Aktif")
- **Footer**: Cancel button (`Batal`), Submit button (`Tambah Santri` / `Simpan Perubahan`) with `Loader2` spinner when `isSubmitting` is true.

---

## 6. Verification and Compliance Checklist

| Rule | Source | Requirement | Strategy |
|---|---|---|---|
| Strict TypeScript | AGENTS.md | No implicit any, clean compile | Strict interfaces for `SantriPrivat`, `SantriPrivatFormValues`, `SantriPrivatModalProps` |
| Dead Code | AGENTS.md | Remove unused imports and vars | Code cleanliness, zero unused symbols |
| Type Check Verification | AGENTS.md | `npx tsc --noEmit` must pass with 0 errors | Pre-verified workspace (0 errors), verified types |
| Currency Display | GEMINI.md | Dot thousand separator (`1.000`) | `formatRp` / `new Intl.NumberFormat('id-ID')` |
| Currency Input | GEMINI.md | Auto-format with dots while typing, store raw integer | `handleNominalChange` with regex `/\D/g` and `id-ID` formatting |
| Date & Timezone | GEMINI.md | `DD:MM:YYYY` with colon separator, `Asia/Jakarta` | Format helper using `Intl.DateTimeFormat` with colon delimiter |
| Tablecn Standard | GEMINI.md | `@tanstack/react-table` wrapper in `@/components/ui/data-table/` | Integrated with Explorer 2's `DataTable` and columns |
| Route Integrity | GEMINI.md | No infinite redirect loops | Public route check verified in `AppLayout.tsx` |

# TEST_INFRA — E2E Test Infrastructure & Test Strategy

**Project**: Private Quran/Hafalan Student Management System (`santri_privat`, `absensi_privat`, `keuangan_privat`)  
**Scope**: Opaque-box, requirement-driven E2E test suite covering Tiers 1–4  
**Author**: E2E Test Writer (`test_writer_e2e_1`)  
**Target Root**: `tests/e2e/privat/`  

---

## 1. Test Architecture & Runner

### 1.1. Execution Engine
- **Runtime**: Node.js v26.4.0 with TypeScript runtime via `tsx` (v4.23.13) & Node.js Native Test Runner (`node:test`, `node:assert`).
- **Type Checking**: Strict TypeScript validation complying with `AGENTS.md` via `npx tsc --noEmit` (0 errors required).
- **Timezone & Locale Standards**: Emulates `Asia/Jakarta` (WIB GMT+7), enforcing `GEMINI.md` constraints:
  - Dates: `DD:MM:YYYY` with colon separator (e.g., `28:03:2026`).
  - Times: `HH:mm` 24-hour format.
  - Currencies: Indonesian Rupiah with dot separator for thousands (e.g., `Rp 350.000`), stored as integers.

### 1.2. Runner Commands
```bash
# Run the entire E2E test suite (Tiers 1-4) with consolidated reporting:
npx tsx tests/e2e/privat/runner.ts

# Run individual test tiers:
npx tsx tests/e2e/privat/tier1-feature-coverage.test.ts
npx tsx tests/e2e/privat/tier2-boundary-corner.test.ts
npx tsx tests/e2e/privat/tier3-cross-feature.test.ts
npx tsx tests/e2e/privat/tier4-real-world.test.ts

# Run with Node.js native test runner:
npx tsx --test tests/e2e/privat/*.test.ts

# Validate TypeScript zero-error compliance:
npx tsc --noEmit
```

### 1.3. Directory Structure
```
tests/e2e/privat/
├── harness.ts                    # Test fixtures, DB connection, GEMINI.md compliance helpers & contracts
├── tier1-feature-coverage.test.ts# Tier 1: Isolated feature coverage (>=5 test cases per feature)
├── tier2-boundary-corner.test.ts # Tier 2: Boundary, validation, and corner cases (>=5 per feature)
├── tier3-cross-feature.test.ts   # Tier 3: Cross-feature pairwise interactions & state transitions
├── tier4-real-world.test.ts      # Tier 4: Real-world student lifecycle scenarios & GEMINI.md checks
└── runner.ts                     # Unified test runner and reporting CLI
```

---

## 2. 4-Tier Test Strategy

### Tier 1: Feature Coverage (Isolation)
Tests each core feature independently against its interface contract and data persistence requirements.  
**Requirement**: Minimum 5 test cases per feature in isolation.

1. **Feature 1: CRUD Santri Privat** (`santri_privat`)
   - `TC1.1`: Create external student without NIS (mandatory fields: `namaLengkap`, `kontakOrtu`, `nominalTagihanBulanan`).
   - `TC1.2`: Create active regular student with NIS (`nomorInduk`).
   - `TC1.3`: Read student list and retrieve single student by ID.
   - `TC1.4`: Update student details (contact number, tuition amount, name).
   - `TC1.5`: Status toggle transition (`aktif` ↔ `nonaktif`).
   - `TC1.6`: Delete student record cleanly.

2. **Feature 2: Flat-Rate Monthly Billing Generator** (`keuangan_privat`)
   - `TC1.7`: Generate monthly bills for all active private students for a specified month/year.
   - `TC1.8`: Verify generated bill amount exactly matches student's `nominalTagihanBulanan`.
   - `TC1.9`: Skip inactive (`nonaktif`) students during generation.
   - `TC1.10`: Query billing list with month, year, and status filters (`belum_lunas` vs `lunas`).
   - `TC1.11`: Calculate billing summary metrics (`totalTagihan`, `totalLunas`, `totalBelumLunas`, `persentaseLunas`).

3. **Feature 3: Payment Recording & History** (`keuangan_privat`)
   - `TC1.12`: Mark bill as paid (`lunas`) with timestamp.
   - `TC1.13`: Record payment timestamp in `Asia/Jakarta` WIB timezone.
   - `TC1.14`: Cancel/revert payment (`batalkanPembayaranPrivat`) back to `belum_lunas` with cleared `tanggalLunas`.
   - `TC1.15`: Idempotent payment recording handling.
   - `TC1.16`: Verify financial summary metrics recalculate accurately upon payment toggles.

4. **Feature 4: Attendance & Memorization Progress Logging** (`absensi_privat`)
   - `TC1.17`: Record attendance session with status `hadir` and memorization progress note (`capaianHafalan`).
   - `TC1.18`: Record attendance session with status `izin` and reason note.
   - `TC1.19`: Record attendance session with status `alpa`.
   - `TC1.20`: Query attendance history filtered by `idSantriPrivat`.
   - `TC1.21`: Delete attendance session log cleanly.

---

### Tier 2: Boundary & Corner Cases
Tests system resilience, validation rules, extreme inputs, and integrity constraints.  
**Requirement**: Minimum 5 test cases per feature boundary.

1. **Boundary 1: Nominal & Financial Edge Cases**
   - `TC2.1`: Rejection/handling of negative nominal tuition (`nominalTagihanBulanan < 0`).
   - `TC2.2`: Zero nominal fee handled cleanly (e.g., scholarship/beasiswa).
   - `TC2.3`: Decimal/float nominal handling (enforce integer IDR).
   - `TC2.4`: Large integer nominal values (e.g., Rp 100.000.000) without integer overflow.
   - `TC2.5`: Currency input string auto-formatting parse checks (strip dots and non-digits).

2. **Boundary 2: Student Identification & Contact Boundaries**
   - `TC2.6`: Optional NIS handling (empty string vs `null` vs `undefined`).
   - `TC2.7`: Whitespace-only names and trimming.
   - `TC2.8`: Contact number formatting (WhatsApp number with special characters, prefixes `+62`, `08`, dashes).
   - `TC2.9`: Extremely long student names and contacts.
   - `TC2.10`: Special characters and emoji handling in student name.

3. **Boundary 3: Monthly Billing Generation & Date Boundaries**
   - `TC2.11`: Duplicate billing prevention: second generation for identical `bulan` + `tahun` + `idSantriPrivat` skipped.
   - `TC2.12`: Month boundary validation: `bulan < 1` or `bulan > 12` rejected.
   - `TC2.13`: Year boundary validation: realistic 4-digit years (e.g. 2026, 2027).
   - `TC2.14`: Generating bills when zero active students exist (returns 0 generated without error).
   - `TC2.15`: Partial student generation: some students already billed, only remaining unbilled active students get generated.

4. **Boundary 4: Attendance & Progress Text Boundaries**
   - `TC2.16`: Invalid attendance status rejected (only `hadir`, `izin`, `alpa` allowed).
   - `TC2.17`: Extremely long `capaianHafalan` text (e.g. 2,000+ characters).
   - `TC2.18`: Empty / missing `capaianHafalan` on `izin` / `alpa`.
   - `TC2.19`: Invalid/future/past timestamp boundaries for `waktuSesi`.
   - `TC2.20`: Foreign key validation: logging attendance for non-existent `idSantriPrivat` rejected.

---

### Tier 3: Cross-Feature Interactions
Tests multi-feature workflows and state transitions across student registration, billing, payments, and attendance.

1. `TC3.1`: **Full Lifecycle - Active Santri**:
   - Register active regular student (`nomorInduk` populated) -> Generate monthly bill -> Pay bill -> Record attendance sessions -> Verify financial & attendance consistency.
2. `TC3.2`: **Full Lifecycle - External Santri**:
   - Register external private-only student (no `nomorInduk`) -> Generate flat-rate bill -> Pay bill -> Record attendance sessions with progressive hafalan notes -> Verify consistency.
3. `TC3.3`: **Status Deactivation Cascade**:
   - Deactivate student (`statusSantri = 'nonaktif'`) -> Verify next month's bill generation excludes them -> Verify past billing history and past attendance logs remain intact.
4. `TC3.4`: **Tuition Modification Mid-Cycle**:
   - Update `nominalTagihanBulanan` from Rp 300.000 to Rp 400.000 -> Verify already generated bills for past months retain historical rate -> Verify subsequent month generation uses new rate.
5. `TC3.5`: **Multi-Month Staggered Payments**:
   - Generate bills across 3 consecutive months -> Pay Month 1, cancel and re-pay Month 2, leave Month 3 unpaid -> Verify summary cards report exact total tagihan, total lunas, and unearned balances.
6. `TC3.6`: **Attendance & Billing Reconciliation**:
   - Verify relationship between attendance frequency and billing status (audit check between attended sessions and billing records).
7. `TC3.7`: **Data Integrity & Deletion Protections**:
   - Verify student deletion behavior when active bills or attendance records exist (orphaning protection / cascade verification).

---

### Tier 4: Real-World Scenarios & Strict Compliance
Validates end-to-end user journeys modeled on actual Rumah Qur'an operations, plus strict GEMINI.md compliance.

1. `TC4.1`: **External Student Ahmad Fauzi (Tahfiz Privat)**:
   - Ahmad Fauzi registers as external student (Nominal Rp 350.000).
   - Generate bills for October & November 2026.
   - Pay October 2026 bill on 01:10:2026.
   - Record 4 attendance sessions with progressive notes:
     - Session 1: "Surah An-Naba ayat 1-15 (Lancar)"
     - Session 2: "Surah An-Naba ayat 16-30 (Perlu perbaikan makhraj)"
     - Session 3: "Surah An-Naba ayat 31-40 & Mutabaah juz 30"
     - Session 4: "Izin (Sakit demam)"
   - Verify complete report card, payment status, and history view.
2. `TC4.2`: **Active Santri Siti Aisyah (Mengaji Privat)**:
   - Siti Aisyah (regular santri with NIS RQ-2026-088) registers for private jilid recitation (Nominal Rp 200.000).
   - Monthly bill generated and paid on 05:10:2026.
   - 8 recitation sessions logged across 4 weeks with progressive Iqro jilid notes.
3. `TC4.3`: **Batch Academic Semester Run**:
   - 5 private students with varying tuition packages (Rp 150.000 to Rp 500.000).
   - Bulk bill generation across 6 months.
   - Mixed payment flows (partial, paid, cancelled, pending).
   - Financial recap totals match exact sum-product calculations.
4. `TC4.4`: **Strict GEMINI.md Formatting & Localization Compliance**:
   - **Timezone**: Dates and timestamps generated and displayed in `Asia/Jakarta` (WIB GMT+7).
   - **Date Format**: Explicit colon separator `DD:MM:YYYY` (e.g. `28:03:2026`), zero slashes (`/`), zero hyphens (`-`).
   - **Time Format**: Explicit 24-hour `HH:mm` (e.g. `14:30`).
   - **Currency Format**: IDR currency with dot separator for thousands (`Rp 350.000`), raw integers in database.
   - **Session & Redirect Stability**: Zero infinite redirect loops.

---

## 3. Coverage Summary Matrix

| Tier | Focus Area | Minimum Cases | Planned Cases | Status |
|:---:|---|:---:|:---:|:---:|
| **Tier 1** | Feature Coverage (CRUD, Billing, Payments, Attendance) | 20 (>=5 / feature) | 21 | Ready |
| **Tier 2** | Boundary & Corner Cases (Nominal, NIS, Dupes, Limits) | 20 (>=5 / feature) | 20 | Ready |
| **Tier 3** | Cross-Feature Pairwise Interactions & State Cascades | 5 | 7 | Ready |
| **Tier 4** | Real-World End-to-End User Scenarios & GEMINI.md Compliance | 4 | 4 | Ready |
| **Total** | **Comprehensive E2E Coverage** | **49** | **52** | **Ready** |

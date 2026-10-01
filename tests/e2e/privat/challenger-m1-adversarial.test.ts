/**
 * Challenger 1 Adversarial & Empirical Test Suite for Milestone 1
 * Targets the REAL implementation in src/app/admin/santri-privat/actions.ts
 * and src/lib/date-utils.ts.
 */

import "dotenv/config";
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import { db } from "@/db";
import { santriPrivat, absensiPrivat, keuanganPrivat } from "@/db/schema";
import {
  createSantriPrivat,
  updateSantriPrivat,
  deleteSantriPrivat,
  getSantriPrivatList,
  getSantriPrivatById,
} from "@/app/admin/santri-privat/actions";
import { formatDateWIB, formatTimeWIB, formatDateTimeWIB } from "@/lib/date-utils";
import { TestRegistry } from "./harness";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

describe("Milestone 1 Adversarial & Stress Testing", () => {
  const createdIds: string[] = [];

  before(async () => {
    await TestRegistry.initDatabaseSchema();
  });

  after(async () => {
    // Clean up all records created during adversarial tests
    for (const id of createdIds) {
      await db.delete(absensiPrivat).where(eq(absensiPrivat.idSantriPrivat, id)).catch(() => {});
      await db.delete(keuanganPrivat).where(eq(keuanganPrivat.idSantriPrivat, id)).catch(() => {});
      await db.delete(santriPrivat).where(eq(santriPrivat.id, id)).catch(() => {});
    }
  });

  // =========================================================================
  // Challenge 1: Invalid & Malformed Inputs on createSantriPrivat
  // =========================================================================
  describe("Challenge 1: Input Validation on createSantriPrivat", () => {
    test("ADV1.1: Rejects empty or whitespace-only student name", async () => {
      const resEmpty = await createSantriPrivat({
        namaLengkap: "",
        kontakOrtu: "081234567890",
        nominalTagihanBulanan: , tarifPerPertemuan: 0
        statusSantri: "aktif",
      });
      assert.equal(resEmpty.success, false, "Should reject empty name");
      assert.ok(resEmpty.error?.toLowerCase().includes("nama"), "Error should mention nama");

      const resWhitespace = await createSantriPrivat({
        namaLengkap: "     ",
        kontakOrtu: "081234567890",
        nominalTagihanBulanan: , tarifPerPertemuan: 0
        statusSantri: "aktif",
      });
      assert.equal(resWhitespace.success, false, "Should reject whitespace-only name");
    });

    test("ADV1.2: Rejects oversized student name (> 150 chars)", async () => {
      const longName = "A".repeat(151);
      const res = await createSantriPrivat({
        namaLengkap: longName,
        kontakOrtu: "081234567890",
        nominalTagihanBulanan: , tarifPerPertemuan: 0
        statusSantri: "aktif",
      });
      assert.equal(res.success, false, "Should reject name > 150 chars");
      assert.ok(res.error?.toLowerCase().includes("150"), "Error should specify 150 max chars");
    });

    test("ADV1.3: Rejects negative nominal fees", async () => {
      const resNeg = await createSantriPrivat({
        namaLengkap: "Santri Negatif Test",
        kontakOrtu: "081234567890",
        nominalTagihanBulanan: , tarifPerPertemuan: 0
        statusSantri: "aktif",
      });
      assert.equal(resNeg.success, false, "Should reject negative fee");
      assert.ok(
        resNeg.error?.toLowerCase().includes("negatif") ||
          resNeg.error?.toLowerCase().includes("nominal"),
        "Error should note negative nominal"
      );
    });

    test("ADV1.4: Rejects empty or whitespace-only contact number", async () => {
      const res = await createSantriPrivat({
        namaLengkap: "Santri No Contact",
        kontakOrtu: "    ",
        nominalTagihanBulanan: , tarifPerPertemuan: 0
        statusSantri: "aktif",
      });
      assert.equal(res.success, false, "Should reject blank contact");
      assert.ok(res.error?.toLowerCase().includes("kontak"));
    });

    test("ADV1.5: Rejects oversized contact (> 30 chars)", async () => {
      const res = await createSantriPrivat({
        namaLengkap: "Santri Long Contact",
        kontakOrtu: "081234567890123456789012345678901",
        nominalTagihanBulanan: , tarifPerPertemuan: 0
        statusSantri: "aktif",
      });
      assert.equal(res.success, false, "Should reject contact > 30 chars");
    });

    test("ADV1.6: Rejects invalid enum values for statusSantri", async () => {
      const res = await createSantriPrivat({
        namaLengkap: "Santri Invalid Status",
        kontakOrtu: "081234567890",
        nominalTagihanBulanan: , tarifPerPertemuan: 0
        statusSantri: "pending" as unknown as "aktif",
      });
      assert.equal(res.success, false, "Should reject invalid status enum");
    });
  });

  // =========================================================================
  // Challenge 2: SQL Injection & XSS Payloads
  // =========================================================================
  describe("Challenge 2: Injection & Security Payloads", () => {
    test("ADV2.1: Handles SQL injection string safely without crashing or leaking", async () => {
      const sqlPayload = "Robert'); DROP TABLE santri_privat;--";
      const res = await createSantriPrivat({
        namaLengkap: sqlPayload,
        kontakOrtu: "081299998888",
        nominalTagihanBulanan: , tarifPerPertemuan: 0
        statusSantri: "aktif",
      });

      assert.equal(res.success, true, `Parametrized query should safely insert without executing SQL: ${res.error}`);
      assert.ok(res.id);
      createdIds.push(res.id);

      const fetched = await getSantriPrivatById(res.id);
      assert.equal(fetched?.namaLengkap, sqlPayload, "Payload stored literally without executing");

      // Verify santri_privat table still exists
      const list = await getSantriPrivatList();
      assert.ok(list.length > 0, "Table must remain intact");
    });

    test("ADV2.2: Handles HTML/XSS script tags safely without server error", async () => {
      const xssPayload = `<script>alert('pwned')</script>`;
      const res = await createSantriPrivat({
        namaLengkap: xssPayload,
        kontakOrtu: "081299998888",
        nominalTagihanBulanan: , tarifPerPertemuan: 0
        statusSantri: "aktif",
      });

      assert.equal(res.success, true, `Should safely store XSS payload without error: ${res.error}`);
      assert.ok(res.id);
      createdIds.push(res.id);

      const fetched = await getSantriPrivatById(res.id);
      assert.equal(fetched?.namaLengkap, xssPayload);
    });
  });

  // =========================================================================
  // Challenge 3: Referential Integrity & Deletion Protection
  // =========================================================================
  describe("Challenge 3: Referential Integrity on Deletion", () => {
    let studentWithAbsensiId: string;
    let studentWithKeuanganId: string;
    let standaloneStudentId: string;

    before(async () => {
      // 1. Create student with attendance
      const s1 = await createSantriPrivat({
        namaLengkap: "Santri With Attendance History",
        nomorInduk: "NIS-ATT-01",
        kontakOrtu: "0811223344",
        nominalTagihanBulanan: , tarifPerPertemuan: 0
        statusSantri: "aktif",
      });
      studentWithAbsensiId = s1.id!;
      createdIds.push(studentWithAbsensiId);

      await db.insert(absensiPrivat).values({
        id: uuidv4(),
        idSantriPrivat: studentWithAbsensiId,
        idGuru: "guru_01",
        waktuSesi: new Date(),
        statusKehadiran: "hadir",
        capaianHafalan: "Surah Al-Mulk ayat 1-10",
        createdAt: new Date(),
      });

      // 2. Create student with billing record
      const s2 = await createSantriPrivat({
        namaLengkap: "Santri With Bill History",
        nomorInduk: "NIS-BILL-01",
        kontakOrtu: "0811223355",
        nominalTagihanBulanan: , tarifPerPertemuan: 0
        statusSantri: "aktif",
      });
      studentWithKeuanganId = s2.id!;
      createdIds.push(studentWithKeuanganId);

      await db.insert(keuanganPrivat).values({
        id: uuidv4(),
        idSantriPrivat: studentWithKeuanganId,
        bulan: 10,
        tahun: 2026,
        nominalTagihan: 300000,
        status: "belum_lunas",
      });

      // 3. Create standalone student with zero dependencies
      const s3 = await createSantriPrivat({
        namaLengkap: "Santri Standalone Deletable",
        nomorInduk: "NIS-DEL-01",
        kontakOrtu: "0811223366",
        nominalTagihanBulanan: , tarifPerPertemuan: 0
        statusSantri: "aktif",
      });
      standaloneStudentId = s3.id!;
      createdIds.push(standaloneStudentId);
    });

    test("ADV3.1: Rejects deletion if santri has linked attendance records", async () => {
      const res = await deleteSantriPrivat(studentWithAbsensiId);
      assert.equal(res.success, false, "Must reject delete when attendance exists");
      assert.ok(
        res.error?.toLowerCase().includes("absensi"),
        "Error message should mention absensi"
      );

      // Verify student still exists in database
      const student = await getSantriPrivatById(studentWithAbsensiId);
      assert.ok(student, "Student should not have been deleted");
    });

    test("ADV3.2: Rejects deletion if santri has linked billing records", async () => {
      const res = await deleteSantriPrivat(studentWithKeuanganId);
      assert.equal(res.success, false, "Must reject delete when bill exists");
      assert.ok(
        res.error?.toLowerCase().includes("tagihan") ||
          res.error?.toLowerCase().includes("keuangan"),
        "Error message should mention tagihan / keuangan"
      );

      // Verify student still exists in database
      const student = await getSantriPrivatById(studentWithKeuanganId);
      assert.ok(student, "Student should not have been deleted");
    });

    test("ADV3.3: Allows deletion of standalone student without dependencies", async () => {
      const res = await deleteSantriPrivat(standaloneStudentId);
      assert.equal(res.success, true, `Must successfully delete standalone student: ${res.error}`);

      const student = await getSantriPrivatById(standaloneStudentId);
      assert.equal(student, null, "Student should be completely removed from database");
    });

    test("ADV3.4: Rejects delete of non-existent or invalid ID gracefully", async () => {
      const nonExistent = await deleteSantriPrivat("non-existent-uuid-12345");
      assert.equal(nonExistent.success, false);
      assert.ok(nonExistent.error?.includes("tidak ditemukan"));

      const blankId = await deleteSantriPrivat("   ");
      assert.equal(blankId.success, false);
      assert.ok(blankId.error?.includes("tidak valid"));
    });
  });

  // =========================================================================
  // Challenge 4: Updates & Partial Mutability
  // =========================================================================
  describe("Challenge 4: Updates & Partial Mutability", () => {
    let studentId: string;

    before(async () => {
      const s = await createSantriPrivat({
        namaLengkap: "Santri For Update Testing",
        nomorInduk: "NIS-UPD-01",
        kontakOrtu: "081987654321",
        nominalTagihanBulanan: , tarifPerPertemuan: 0
        statusSantri: "aktif",
      });
      studentId = s.id!;
      createdIds.push(studentId);
    });

    test("ADV4.1: Partial update only modifies specified fields", async () => {
      const res = await updateSantriPrivat(studentId, {
        kontakOrtu: "089999888877",
      });
      assert.equal(res.success, true, `Update should succeed: ${res.error}`);

      const fetched = await getSantriPrivatById(studentId);
      assert.equal(fetched?.kontakOrtu, "089999888877");
      assert.equal(fetched?.namaLengkap, "Santri For Update Testing");
      assert.equal(fetched?.nominalTagihanBulanan, 275000);
      assert.equal(fetched?.statusSantri, "aktif");
    });

    test("ADV4.2: Update rejects invalid negative fee", async () => {
      const res = await updateSantriPrivat(studentId, {
        nominalTagihanBulanan: , tarifPerPertemuan: 0
      });
      assert.equal(res.success, false);
    });

    test("ADV4.3: Update non-existent student returns error", async () => {
      const res = await updateSantriPrivat("uuid-not-found-9999", {
        namaLengkap: "Changed Name",
      });
      assert.equal(res.success, false);
      assert.ok(res.error?.includes("tidak ditemukan"));
    });
  });

  // =========================================================================
  // Challenge 5: Strict GEMINI.md Date & Time Formatting
  // =========================================================================
  describe("Challenge 5: Strict GEMINI.md Formatting", () => {
    test("ADV5.1: formatDateWIB strictly uses colon (:) separator, never slashes or dashes", () => {
      const testDate = new Date("2026-03-28T14:30:00+07:00");
      const formatted = formatDateWIB(testDate);

      assert.equal(formatted, "28:03:2026");
      assert.ok(!formatted.includes("/"), "Must not contain slashes");
      assert.ok(!formatted.includes("-"), "Must not contain dashes");
      assert.match(formatted, /^\d{2}:\d{2}:\d{4}$/, "Must match DD:MM:YYYY exactly");
    });

    test("ADV5.2: formatDateWIB converts UTC to Asia/Jakarta (WIB GMT+7)", () => {
      // 2026-09-30 23:00:00 UTC is 2026-10-01 06:00:00 in WIB
      const utcDate = new Date("2026-09-30T23:00:00Z");
      const formatted = formatDateWIB(utcDate);

      assert.equal(formatted, "01:10:2026", "WIB date should cross over to next day");
    });

    test("ADV5.3: formatTimeWIB strictly uses 24-hour HH:mm format in Asia/Jakarta", () => {
      const testDate = new Date("2026-10-01T14:05:00+07:00");
      const timeStr = formatTimeWIB(testDate);

      assert.equal(timeStr, "14:05");
      assert.match(timeStr, /^\d{2}:\d{2}$/, "Must match HH:mm exactly");
    });

    test("ADV5.4: formatDateTimeWIB combines date, time, and WIB suffix", () => {
      const testDate = new Date("2026-10-01T14:05:00+07:00");
      const dtStr = formatDateTimeWIB(testDate);

      assert.equal(dtStr, "01:10:2026 14:05 WIB");
    });

    test("ADV5.5: Gracefully handles null, undefined, or invalid dates", () => {
      assert.equal(formatDateWIB(null), "-");
      assert.equal(formatDateWIB(undefined), "-");
      assert.equal(formatDateWIB("invalid-date-string"), "-");
      assert.equal(formatTimeWIB(null), "-");
      assert.equal(formatDateTimeWIB(null), "-");
    });
  });
});

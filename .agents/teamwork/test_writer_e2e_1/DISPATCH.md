# DISPATCH: E2E Test Suite Writer
You are the E2E Test Writer for the Private Quran/Hafalan Student Management System.
Your Working Directory: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\test_writer_e2e_1
Authoritative Request: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\ORIGINAL_REQUEST.md
Project Specification: e:\APLIKASI RQ\ABSENSIRQ2027-master\PROJECT.md
Project Root: e:\APLIKASI RQ\ABSENSIRQ2027-master

MISSION:
Design and implement a comprehensive, opaque-box, requirement-driven E2E test suite covering Tiers 1-4 for the Private Quran/Hafalan Student Management System.

METHODOLOGY & TIERS:
- Tier 1: Feature Coverage (>= 5 test cases per feature in isolation: CRUD santri privat, flat-rate monthly billing generator, payment recording/history, attendance & memorization progress logging).
- Tier 2: Boundary & Corner Cases (>= 5 test cases per feature: 0 or negative nominal, duplicate NIS, empty optional fields, duplicate monthly bill generation prevention, invalid dates, invalid attendance statuses, extreme text length for capaian hafalan).
- Tier 3: Cross-Feature Combinations (Pairwise coverage: registering active vs external santri -> generating billing -> paying bill -> recording attendance sessions -> checking financial and attendance consistency).
- Tier 4: Real-World Scenarios (End-to-end full life cycle of private students: e.g. Santri Eksternal A taking Hafalan private class with flat-rate IDR 350.000, monthly billing generated for 2 months, 1 month paid with timestamp, 4 attendance sessions recorded with progress notes).

TEST ARTIFACTS:
1. Create `TEST_INFRA.md` at project root with full test architecture, feature inventory mapping, and runner command.
2. Implement test scripts/suites under `tests/e2e/privat/` (using TypeScript / Vitest / Jest / standalone test runner). Make sure the test runner can be executed cleanly.
3. Publish `TEST_READY.md` at project root upon completion summarizing test counts across Tiers 1-4.

## 2026-09-30T09:31:57Z
You are the E2E Test Writer for the Private Quran/Hafalan Student Management System.
Working Directory: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\test_writer_e2e_1
Authoritative Request: e:\APLIKASI RQ\ABSENSIRQ2027-master\.agents\teamwork\ORIGINAL_REQUEST.md
Project Specification: e:\APLIKASI RQ\ABSENSIRQ2027-master\PROJECT.md

/**
 * Master E2E Test Suite Runner for Sistem Manajemen Santri Privat
 * Executes Tiers 1-4 with comprehensive reporting, timing, and exit code validation.
 */

import { spawn } from 'child_process';
import path from 'path';

interface TierResult {
  tierName: string;
  file: string;
  passed: boolean;
  testCount: number;
  passCount: number;
  failCount: number;
  durationMs: number;
  output: string;
}

const TIERS = [
  { name: 'Tier 1: Isolated Feature Coverage', file: 'tier1-feature-coverage.test.ts', expectedMinTests: 20 },
  { name: 'Tier 2: Boundary & Corner Cases', file: 'tier2-boundary-corner.test.ts', expectedMinTests: 20 },
  { name: 'Tier 3: Cross-Feature Interactions', file: 'tier3-cross-feature.test.ts', expectedMinTests: 5 },
  { name: 'Tier 4: Real-World Scenarios & Compliance', file: 'tier4-real-world.test.ts', expectedMinTests: 4 }
];

async function runTier(tier: (typeof TIERS)[0]): Promise<TierResult> {
  const relativePath = `tests/e2e/privat/${tier.file}`;
  const startTime = Date.now();

  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const npxCmd = isWindows ? 'npx.cmd' : 'npx';

    const child = spawn(npxCmd, ['tsx', relativePath], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '1' },
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: isWindows
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d: Buffer) => {
      stdout += d.toString();
    });

    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString();
    });

    child.on('close', (code: number) => {
      const durationMs = Date.now() - startTime;
      const combinedOutput = stdout + (stderr ? `\nSTDERR:\n${stderr}` : '');

      // Parse test counts from output
      const testsMatch = combinedOutput.match(/ℹ\s+tests\s+(\d+)/);
      const passMatch = combinedOutput.match(/ℹ\s+pass\s+(\d+)/);
      const failMatch = combinedOutput.match(/ℹ\s+fail\s+(\d+)/);

      const testCount = testsMatch ? parseInt(testsMatch[1], 10) : 0;
      const passCount = passMatch ? parseInt(passMatch[1], 10) : 0;
      const failCount = failMatch ? parseInt(failMatch[1], 10) : (code !== 0 ? 1 : 0);

      resolve({
        tierName: tier.name,
        file: tier.file,
        passed: code === 0 && failCount === 0,
        testCount,
        passCount,
        failCount,
        durationMs,
        output: combinedOutput
      });
    });
  });
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('   SISTEM MANAJEMEN SANTRI PRIVAT — E2E TEST SUITE RUNNER');
  console.log('   Target Tiers: Tier 1 to Tier 4 | Standard: AGENTS.md & GEMINI.md');
  console.log('='.repeat(70) + '\n');

  const results: TierResult[] = [];
  let allPassed = true;

  for (const tier of TIERS) {
    process.stdout.write(`⏳ Running ${tier.name} (${tier.file})... `);
    const result = await runTier(tier);
    results.push(result);

    if (result.passed) {
      console.log(`✅ PASSED (${result.passCount}/${result.testCount} tests, ${(result.durationMs / 1000).toFixed(2)}s)`);
    } else {
      console.log(`❌ FAILED (${result.failCount} failed, ${(result.durationMs / 1000).toFixed(2)}s)`);
      allPassed = false;
      console.log('\n--- Output Snippet ---');
      console.log(result.output.slice(-1500));
      console.log('----------------------\n');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('   E2E TEST EXECUTION SUMMARY REPORT');
  console.log('='.repeat(70));

  let totalTests = 0;
  let totalPassed = 0;
  let totalFailed = 0;
  let totalDuration = 0;

  for (const r of results) {
    totalTests += r.testCount;
    totalPassed += r.passCount;
    totalFailed += r.failCount;
    totalDuration += r.durationMs;

    const statusBadge = r.passed ? 'PASS' : 'FAIL';
    const line = `[${statusBadge}] ${r.tierName.padEnd(42)}: ${r.passCount}/${r.testCount} passed in ${(r.durationMs / 1000).toFixed(2)}s`;
    console.log(line);
  }

  console.log('-'.repeat(70));
  console.log(`TOTAL: ${totalPassed}/${totalTests} tests passed across ${results.length} tiers in ${(totalDuration / 1000).toFixed(2)}s`);
  console.log('='.repeat(70) + '\n');

  if (!allPassed || totalFailed > 0) {
    console.error('❌ E2E Test Suite FAILED with errors.');
    process.exit(1);
  } else {
    console.log('🎉 100% E2E Test Suite PASSED successfully with ZERO errors.');
    process.exit(0);
  }
}

main().catch((err: unknown) => {
  console.error('Fatal Runner Error:', err);
  process.exit(1);
});

const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const testFiles = [
  "test/security/local-postgres-compat.test.mjs",
  "test/security/occ-mark-submission.test.mjs",
  "test/security/hub-storage.test.mjs"
];

console.log("==================================================================");
console.log("  NSEI SUKUL: COMPREHENSIVE ARCHITECTURE VERIFICATION TEST RUNNER ");
console.log("==================================================================\n");

let passed = 0;
let failed = 0;

for (const file of testFiles) {
  console.log(`Running suite: ${file}...`);
  try {
    execSync(`node --experimental-strip-types --test "${file}"`, {
      cwd: ROOT,
      stdio: "inherit"
    });
    console.log(`[PASS] ${file}\n`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] ${file}\n`);
    failed++;
  }
}

// Also verify Cloud RLS test suite against live Supabase Cloud
try {
  console.log("Running suite: test/security/rls-remediation.test.mjs (Cloud DB)...");
  execSync(`node --env-file=.env.local --test "test/security/rls-remediation.test.mjs"`, {
    cwd: ROOT,
    stdio: "inherit"
  });
  console.log("[PASS] test/security/rls-remediation.test.mjs\n");
  passed++;
} catch (err) {
  console.error("[FAIL] test/security/rls-remediation.test.mjs\n");
  failed++;
}

console.log("==================================================================");
console.log(`SUMMARY: ${passed} Passed, ${failed} Failed.`);
console.log("==================================================================");

if (failed > 0) {
  process.exit(1);
}

/**
 * Nsei Sukul: Portable PostgreSQL 16 Bundler for School Hub
 * 
 * Verifies or prepares the portable PostgreSQL 16 binary distribution
 * into dist-hub/pgsql/ with initialized cluster data directory.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_PGSQL = path.join(ROOT_DIR, "dist-hub", "pgsql");
const DATA_DIR = path.join(DIST_PGSQL, "data");

function ensurePortablePgsql() {
  console.log(`[PGSQL Bundler] Target directory: ${DIST_PGSQL}`);

  if (!fs.existsSync(DIST_PGSQL)) {
    fs.mkdirSync(DIST_PGSQL, { recursive: true });
  }

  // Check if system has a PostgreSQL installation we can copy binaries from if needed
  const defaultPgPath = "C:\\Program Files\\PostgreSQL\\18";
  const binDir = path.join(DIST_PGSQL, "bin");

  if (!fs.existsSync(path.join(binDir, "postgres.exe"))) {
    if (fs.existsSync(path.join(defaultPgPath, "bin", "postgres.exe"))) {
      console.log(`[PGSQL Bundler] Detected local PostgreSQL at ${defaultPgPath}. Stage binaries to dist-hub/pgsql...`);
      // Copy necessary binaries and libraries for portable execution
      fs.cpSync(path.join(defaultPgPath, "bin"), path.join(DIST_PGSQL, "bin"), { recursive: true });
      fs.cpSync(path.join(defaultPgPath, "lib"), path.join(DIST_PGSQL, "lib"), { recursive: true });
      fs.cpSync(path.join(defaultPgPath, "share"), path.join(DIST_PGSQL, "share"), { recursive: true });
      console.log("[PGSQL Bundler] Binaries staged. Pruning unnecessary static libraries, locales, and dev utilities...");
      prunePgsqlBundle(DIST_PGSQL);
      console.log("[PGSQL Bundler] Binaries staged and trimmed successfully.");
    } else {
      console.log("[PGSQL Bundler] Note: Portable binaries will be bundled during installer build step.");
    }
  } else {
    console.log("[PGSQL Bundler] Portable binaries already present in dist-hub/pgsql/bin. Verifying trim...");
    prunePgsqlBundle(DIST_PGSQL);
  }

  // Create start and stop scripts for local embedded cluster
  const startScript = `@echo off
"%~dp0bin\\pg_ctl.exe" -D "%~dp0data" -l "%~dp0logfile.log" start
`;
  const stopScript = `@echo off
"%~dp0bin\\pg_ctl.exe" -D "%~dp0data" stop
`;

  fs.writeFileSync(path.join(DIST_PGSQL, "start-pg.bat"), startScript);
  fs.writeFileSync(path.join(DIST_PGSQL, "stop-pg.bat"), stopScript);
  console.log("[PGSQL Bundler] Portable PostgreSQL management scripts created.");
}

function prunePgsqlBundle(distPgsql) {
  // 1. Remove static C/C++ libraries (*.lib, *.a) from lib
  const libDir = path.join(distPgsql, "lib");
  if (fs.existsSync(libDir)) {
    for (const file of fs.readdirSync(libDir)) {
      if (file.endsWith(".lib") || file.endsWith(".a")) {
        try { fs.unlinkSync(path.join(libDir, file)); } catch (_) {}
      }
    }
  }

  // 2. Remove GUI libraries and stackbuilder from bin
  const binDir = path.join(distPgsql, "bin");
  const neededExecutables = new Set([
    "postgres.exe",
    "pg_ctl.exe",
    "initdb.exe",
    "psql.exe",
    "pg_isready.exe",
    "pg_dump.exe",
    "pg_restore.exe",
    "vacuumdb.exe"
  ]);

  if (fs.existsSync(binDir)) {
    for (const file of fs.readdirSync(binDir)) {
      if (file.endsWith(".exe") && !neededExecutables.has(file.toLowerCase())) {
        try { fs.unlinkSync(path.join(binDir, file)); } catch (_) {}
      } else if (file.startsWith("wx") || file === "stackbuilder.exe") {
        try { fs.unlinkSync(path.join(binDir, file)); } catch (_) {}
      }
    }
  }

  // 3. Remove locale translations and doc from share
  const localeDir = path.join(distPgsql, "share", "locale");
  if (fs.existsSync(localeDir)) {
    try { fs.rmSync(localeDir, { recursive: true, force: true }); } catch (_) {}
  }
  const docDir = path.join(distPgsql, "share", "doc");
  if (fs.existsSync(docDir)) {
    try { fs.rmSync(docDir, { recursive: true, force: true }); } catch (_) {}
  }
}

if (require.main === module) {
  ensurePortablePgsql();
}

module.exports = { ensurePortablePgsql };

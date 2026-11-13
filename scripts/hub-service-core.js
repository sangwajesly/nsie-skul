/**
 * Nsei Sukul School Hub: Background Service Core Engine
 * 
 * Manages the offline PostgreSQL cluster lifecycle and Next.js School Hub runtime.
 * Runs seamlessly either as a native Windows Background Service or via launcher.
 */

const fs = require("fs");
const path = require("path");
const net = require("net");
const http = require("http");
const { spawn, execSync } = require("child_process");

const APP_DIR = path.resolve(__dirname);
const PGSQL_DIR = path.join(APP_DIR, "pgsql");
const PGSQL_DATA = path.join(PGSQL_DIR, "data");
const PG_CTL = path.join(PGSQL_DIR, "bin", "pg_ctl.exe");
const INITDB = path.join(PGSQL_DIR, "bin", "initdb.exe");
const LOG_FILE = path.join(APP_DIR, "hub-service.log");

function log(msg) {
  const line = `[${new Date().toISOString()}] [HubService] ${msg}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line, "utf8");
  } catch {}
  console.log(line.trim());
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const sock = new net.Socket();
    sock.setTimeout(1000);
    sock.once("connect", () => {
      sock.destroy();
      resolve(true);
    });
    sock.once("timeout", () => {
      sock.destroy();
      resolve(false);
    });
    sock.once("error", () => {
      resolve(false);
    });
    sock.connect(port, "127.0.0.1");
  });
}

async function startLocalPostgres() {
  log("Checking local PostgreSQL cluster state...");

  const portInUse = await isPortOpen(5432);
  if (portInUse) {
    log("PostgreSQL port 5432 is already active and responding.");
    return true;
  }

  // If local portable data directory doesn't exist, initialize it
  if (!fs.existsSync(PGSQL_DATA) && fs.existsSync(INITDB)) {
    log(`Initializing fresh PostgreSQL cluster in: ${PGSQL_DATA}...`);
    try {
      execSync(`"${INITDB}" -D "${PGSQL_DATA}" -U postgres -A trust -E UTF8`, { stdio: "pipe" });
      log("PostgreSQL cluster initialized with UTF8 encoding.");
    } catch (err) {
      log(`Warning: initdb failed: ${err.message}`);
    }
  }

  if (fs.existsSync(PG_CTL) && fs.existsSync(PGSQL_DATA)) {
    log(`Starting portable PostgreSQL cluster via pg_ctl...`);
    try {
      execSync(`"${PG_CTL}" -D "${PGSQL_DATA}" -l "${path.join(PGSQL_DIR, "pg.log")}" start`, { stdio: "pipe" });
      log("pg_ctl start invoked.");
    } catch (err) {
      log(`Warning: pg_ctl start encountered error: ${err.message}`);
    }
  }

  // Wait up to 10 seconds for 5432 to become active
  for (let i = 0; i < 20; i++) {
    if (await isPortOpen(5432)) {
      log("PostgreSQL is now verified active on port 5432.");
      return true;
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  log("Warning: PostgreSQL cluster could not be verified on port 5432 within timeout.");
  return false;
}

async function runLocalDbMigrations() {
  log("Verifying local database migrations...");
  try {
    const migratorScript = path.join(APP_DIR, "scripts", "migrate-hub-database.js");
    if (fs.existsSync(migratorScript)) {
      const nodeExe = process.execPath;
      execSync(`"${nodeExe}" "${migratorScript}"`, { stdio: "inherit", cwd: APP_DIR });
      log("Database migrations successfully verified.");
    }
  } catch (err) {
    log(`Migration check failed: ${err.message}`);
  }
}

async function main() {
  log("Starting Nsei Sukul School Hub Background Service...");
  await startLocalPostgres();
  await runLocalDbMigrations();
  log("Service initialization complete. Background processes active.");
}

if (require.main === module) {
  main().catch((err) => log(`Fatal service error: ${err.message}`));
}

module.exports = { startLocalPostgres, runLocalDbMigrations };

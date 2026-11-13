/**
 * Nsei Sukul: Standalone School Hub Packager
 * 
 * Bundles Next.js standalone output, public assets, embedded Node.js runtime,
 * launcher engine, and native Windows executable launcher into dist-hub/
 * ready for Inno Setup compilation.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist-hub");
const INSTALLER_DIR = path.join(ROOT_DIR, "installer");

console.log("======================================================");
console.log("  NSEI SUKUL: PACKAGING STANDALONE SCHOOL HUB (.EXE)  ");
console.log("======================================================\n");

// 1. Generate multi-resolution app icons
console.log("1. Generating branded app icons (app-icon.ico)...");
try {
  execSync("node scripts/generate-app-icon.js", { stdio: "inherit", cwd: ROOT_DIR });
} catch (e) {
  console.warn("Warning: Could not run generate-app-icon.js:", e.message);
}

// 2. Compile native C# Windows executable launcher (NseiSukulHub.exe)
console.log("2. Compiling native Windows launcher (NseiSukulHub.exe)...");
const cscPath = "C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe";
const csSource = path.join(INSTALLER_DIR, "NseiSukulHub.cs");
const iconPath = path.join(INSTALLER_DIR, "app-icon.ico");
const exeTarget = path.join(INSTALLER_DIR, "NseiSukulHub.exe");

if (fs.existsSync(cscPath) && fs.existsSync(csSource)) {
  const cscCmd = `"${cscPath}" /nologo /target:winexe /win32icon:"${iconPath}" /out:"${exeTarget}" "${csSource}"`;
  execSync(cscCmd, { stdio: "inherit", cwd: INSTALLER_DIR });
  console.log("Successfully compiled native launcher:", exeTarget);
} else {
  console.warn("CSC compiler or source not found; skipping native compilation.");
}

// 3. Build fresh standalone Next.js production bundle
const shouldSkipBuild = process.argv.includes("--skip-build");
const standaloneDir = path.join(ROOT_DIR, ".next", "standalone");
if (!shouldSkipBuild || !fs.existsSync(standaloneDir)) {
  console.log("3. Compiling fresh Next.js standalone production build...");
  execSync("npm run build", { stdio: "inherit", cwd: ROOT_DIR });
} else {
  console.log("3. Using existing .next/standalone bundle (--skip-build requested).");
}

// 4. Prepare clean distribution directory
console.log("4. Preparing distribution directory:", DIST_DIR);
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Helper to copy directory recursively
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      try {
        const target = fs.readlinkSync(srcPath);
        fs.symlinkSync(target, destPath);
      } catch {}
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 5. Copy standalone server files
console.log("5. Copying standalone production server files...");
copyDirSync(standaloneDir, DIST_DIR);

// 6. Copy static assets (.next/static into dist-hub/.next/static)
const staticSrc = path.join(ROOT_DIR, ".next", "static");
const staticDest = path.join(DIST_DIR, ".next", "static");
if (fs.existsSync(staticSrc)) {
  console.log("6. Copying .next/static client bundles...");
  copyDirSync(staticSrc, staticDest);
}

// 7. Copy public directory assets (excluding public/downloads to avoid recursive bloat)
const publicSrc = path.join(ROOT_DIR, "public");
const publicDest = path.join(DIST_DIR, "public");
if (fs.existsSync(publicSrc)) {
  console.log("7. Copying public web assets...");
  copyDirSync(publicSrc, publicDest);
  const recursiveDownloads = path.join(publicDest, "downloads");
  if (fs.existsSync(recursiveDownloads)) {
    fs.rmSync(recursiveDownloads, { recursive: true, force: true });
  }
}

// 8. Bundle portable Node.js runtime into dist-hub/runtime/node.exe
console.log("8. Bundling portable Node.js runtime...");
const runtimeDir = path.join(DIST_DIR, "runtime");
fs.mkdirSync(runtimeDir, { recursive: true });
const hostNode = process.execPath;
const destNode = path.join(runtimeDir, "node.exe");
if (fs.existsSync(hostNode)) {
  fs.copyFileSync(hostNode, destNode);
  console.log(`Bundled node runtime (${Math.round(fs.statSync(destNode).size / 1024 / 1024)} MB) to runtime/node.exe`);
} else {
  console.warn("Could not find host node.exe to bundle!");
}

// 9. Copy native executable launcher and launcher engine
console.log("9. Installing launcher engine and executables...");
if (fs.existsSync(exeTarget)) {
  fs.copyFileSync(exeTarget, path.join(DIST_DIR, "NseiSukulHub.exe"));
}
fs.copyFileSync(path.join(ROOT_DIR, "scripts", "launcher.js"), path.join(DIST_DIR, "launcher.js"));
if (fs.existsSync(iconPath)) {
  fs.copyFileSync(iconPath, path.join(DIST_DIR, "app-icon.ico"));
}

// 10. Create production environment template (.env.production)
const envContent = [
  "# Nsei Sukul School Hub Production Configuration",
  "NODE_ENV=production",
  "PORT=3000",
  "NEXT_PUBLIC_HUB_MODE=true",
  "HUB_MODE=true",
  "HUB_NAME=School LAN Hub",
  "CLOUD_SYNC_URL=https://nsei-sukul.klarifypath.com/api/v1/hub/sync",
  "",
].join("\n");
fs.writeFileSync(path.join(DIST_DIR, ".env.production"), envContent, "utf8");

// 11. Create diagnostic batch launcher for manual console view
const consoleBat = [
  "@echo off",
  "title Nsei Sukul School Hub (Diagnostic Console)",
  "cd /d \"%~dp0\"",
  "runtime\\node.exe launcher.js",
  "pause",
].join("\r\n");
fs.writeFileSync(path.join(DIST_DIR, "debug-console.bat"), consoleBat, "utf8");

// 11b. Stage portable PostgreSQL cluster into dist-hub/pgsql/
console.log("11b. Staging portable PostgreSQL 16 binaries...");
try {
  const { ensurePortablePgsql } = require("./bundle-hub-pgsql");
  ensurePortablePgsql();
} catch (e) {
  console.warn("Warning: Could not bundle portable PostgreSQL:", e.message);
}

// 12. Locate Inno Setup Compiler and compile NseiSukulHubSetup.exe
const isccCandidates = [
  path.join(require("os").tmpdir(), "is_install", "bin", "ISCC.exe"),
  "C:\\Program Files\\Inno Setup 7\\ISCC.exe",
  "C:\\Program Files (x86)\\Inno Setup 6\\ISCC.exe",
  "C:\\Program Files\\Inno Setup 6\\ISCC.exe",
];

let foundIscc = null;
for (const p of isccCandidates) {
  if (fs.existsSync(p)) {
    foundIscc = p;
    break;
  }
}

if (foundIscc) {
  console.log("\n12. Compiling Windows Installer (NseiSukulHubSetup.exe) via Inno Setup...");
  const issFile = path.join(INSTALLER_DIR, "NseiSukulHubSetup.iss");
  try {
    execSync(`"${foundIscc}" "${issFile}"`, { stdio: "inherit", cwd: INSTALLER_DIR });
    const finalInstaller = path.join(ROOT_DIR, "public", "downloads", "NseiSukulHubSetup.exe");
    if (fs.existsSync(finalInstaller)) {
      const sizeMb = (fs.statSync(finalInstaller).size / 1024 / 1024).toFixed(2);
      console.log(`\nInstaller compilation SUCCESS: ${finalInstaller} (${sizeMb} MB)`);
    }
  } catch (err) {
    console.error("Warning: Inno Setup compilation failed:", err.message);
  }
} else {
  console.log("\n12. Inno Setup (ISCC.exe) not found; skipping .exe installer compilation.");
}

console.log("\n======================================================");
console.log("  STANDALONE SCHOOL HUB PACKAGE READY IN: dist-hub/");
console.log("======================================================");
console.log("Direct Native Launcher: dist-hub/NseiSukulHub.exe");
console.log("Diagnostic Launcher:   dist-hub/debug-console.bat");
console.log("Compiled Installer:    public/downloads/NseiSukulHubSetup.exe\n");

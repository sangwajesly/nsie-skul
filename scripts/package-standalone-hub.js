/**
 * Nsei Sukul: Standalone School Hub Packager
 * 
 * Bundles Next.js standalone output, public assets, and Windows service runner
 * into a production distribution folder (dist-hub/) ready for installer wrapping.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist-hub");

console.log("======================================================");
console.log("  NSEI SUKUL: PACKAGING STANDALONE SCHOOL HUB (.EXE)  ");
console.log("======================================================\n");

// 1. Verify build exists or trigger build
const standaloneDir = path.join(ROOT_DIR, ".next", "standalone");
if (!fs.existsSync(standaloneDir)) {
  console.log("Running Next.js standalone production build...");
  execSync("npm run build", { stdio: "inherit", cwd: ROOT_DIR });
} else {
  console.log("Found existing .next/standalone bundle.");
}

// 2. Prepare clean distribution directory
console.log("Preparing distribution directory:", DIST_DIR);
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Helper to copy directory recursively with symlink safety
function copyDirSync(src, dest) {
  try {
    fs.cpSync(src, dest, { recursive: true, verbatimSymlinks: true, errorOnExist: false });
  } catch {
    // Fallback iteration
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      try {
        if (entry.isDirectory()) {
          copyDirSync(srcPath, destPath);
        } else if (entry.isSymbolicLink()) {
          const target = fs.readlinkSync(srcPath);
          try { fs.symlinkSync(target, destPath); } catch {}
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      } catch {
        // Skip uncopyable symlink metadata
      }
    }
  }
}

// 3. Copy standalone server files
console.log("Copying standalone production server files...");
copyDirSync(standaloneDir, DIST_DIR);

// 4. Copy static assets (.next/static into dist-hub/.next/static)
const staticSrc = path.join(ROOT_DIR, ".next", "static");
const staticDest = path.join(DIST_DIR, ".next", "static");
if (fs.existsSync(staticSrc)) {
  console.log("Copying .next/static client bundles...");
  copyDirSync(staticSrc, staticDest);
}

// 5. Copy public directory assets
const publicSrc = path.join(ROOT_DIR, "public");
const publicDest = path.join(DIST_DIR, "public");
if (fs.existsSync(publicSrc)) {
  console.log("Copying public web assets...");
  copyDirSync(publicSrc, publicDest);
}

// 6. Create production environment template (.env.production)
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

// 7. Create silent Windows Background Runner (VBScript to avoid black command prompt)
const vbsRunner = [
  'Set WshShell = CreateObject("WScript.Shell")',
  'WshShell.CurrentDirectory = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)',
  'WshShell.Run "cmd /c node server.js", 0, False',
].join("\r\n");
fs.writeFileSync(path.join(DIST_DIR, "run-silent.vbs"), vbsRunner, "utf8");

// 8. Create Windows Service & Launcher Batch
const launcherBat = [
  "@echo off",
  "title Nsei Sukul School Hub",
  "cd /d \"%~dp0\"",
  "set PORT=3000",
  "set NODE_ENV=production",
  "set NEXT_PUBLIC_HUB_MODE=true",
  "node server.js",
].join("\r\n");
fs.writeFileSync(path.join(DIST_DIR, "start-server.bat"), launcherBat, "utf8");

console.log("\n======================================================");
console.log("  STANDALONE SCHOOL HUB PACKAGE READY IN: dist-hub/");
console.log("======================================================");
console.log("To launch the server locally: node dist-hub/server.js");
console.log("To package into .exe: Run Inno Setup on installer/NseiSukulHubSetup.iss\n");

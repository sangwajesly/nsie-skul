const fs = require("fs");
const path = require("path");
const net = require("net");
const http = require("http");
const os = require("os");
const { spawn, exec } = require("child_process");

const APP_DIR = path.resolve(__dirname);
const LOG_FILE = path.join(APP_DIR, "hub.log");
const STATUS_FILE = path.join(APP_DIR, "hub-status.json");
const ENV_LOCAL = path.join(APP_DIR, ".env.local");

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(LOG_FILE, line, "utf8");
  } catch {}
  console.log(msg);
}

function getLanIps() {
  const ifaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push({ name, address: iface.address });
      }
    }
  }
  return ips;
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "0.0.0.0");
  });
}

function checkHttp(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, { timeout: 2000 }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

function openBrowser(url) {
  try {
    exec(`start "" "${url}"`, { shell: true });
  } catch (err) {
    log("Failed to launch browser: " + err.message);
  }
}

function showWindowsPopup(title, message, isError = false) {
  try {
    const iconType = isError ? 16 : 64; // 16 = Error, 64 = Information
    const escapedMsg = message.replace(/"/g, '""').replace(/\n/g, '" & vbCrLf & "');
    const escapedTitle = title.replace(/"/g, '""');
    const vbs = `MsgBox "${escapedMsg}", ${iconType}, "${escapedTitle}"`;
    const tempVbs = path.join(os.tmpdir(), `nsei_hub_msg_${Date.now()}.vbs`);
    fs.writeFileSync(tempVbs, vbs, "utf8");
    exec(`wscript //nologo "${tempVbs}"`, () => {
      try { fs.unlinkSync(tempVbs); } catch {}
    });
  } catch {}
}

async function main() {
  log("==========================================");
  log("  NSEI SUKUL SCHOOL HUB LAUNCHER STARTING ");
  log("==========================================");
  log(`App Directory: ${APP_DIR}`);

  // 1. Check if an instance is already responding on port 3000
  const is3000Running = await checkHttp(3000);
  if (is3000Running) {
    log("Existing Nsei Sukul Hub service detected on port 3000. Opening browser...");
    openBrowser("http://localhost:3000");
    return;
  }

  // 2. Resolve port (preferred 3000, fallback to 3001..3010)
  let chosenPort = 3000;
  for (let p = 3000; p <= 3010; p++) {
    const available = await isPortAvailable(p);
    if (available) {
      chosenPort = p;
      break;
    }
  }
  log(`Resolved server listening port: ${chosenPort}`);

  // 3. Load extra environment variables from .env.local if present
  const extraEnv = {};
  if (fs.existsSync(ENV_LOCAL)) {
    try {
      const content = fs.readFileSync(ENV_LOCAL, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          extraEnv[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, "");
        }
      }
    } catch (e) {
      log(`Warning loading .env.local: ${e.message}`);
    }
  }

  // 4. Determine node executable
  let nodeBin = process.execPath;
  const bundledNode = path.join(APP_DIR, "runtime", "node.exe");
  if (fs.existsSync(bundledNode)) {
    nodeBin = bundledNode;
  }
  log(`Using Node runtime: ${nodeBin}`);

  const serverJs = path.join(APP_DIR, "server.js");
  if (!fs.existsSync(serverJs)) {
    const err = `Fatal: server.js not found in ${APP_DIR}`;
    log(err);
    showWindowsPopup("Nsei Sukul Hub Error", err, true);
    return;
  }

  // 5. Spawn server process
  const env = {
    ...process.env,
    PORT: String(chosenPort),
    NODE_ENV: "production",
    NEXT_PUBLIC_HUB_MODE: "true",
    HUB_MODE: "true",
    ...extraEnv,
  };

  log(`Spawning server.js with PORT=${chosenPort}...`);
  const child = spawn(nodeBin, ["server.js"], {
    cwd: APP_DIR,
    env,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (data) => {
    const msg = data.toString().trim();
    if (msg) log(`[Server stdout] ${msg}`);
  });

  child.stderr.on("data", (data) => {
    const msg = data.toString().trim();
    if (msg) log(`[Server stderr] ${msg}`);
  });

  child.on("exit", (code, signal) => {
    log(`Server process exited with code ${code}, signal ${signal}`);
  });

  child.unref();

  // 6. Poll for server readiness
  log("Waiting for server to become ready...");
  let ready = false;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 600));
    ready = await checkHttp(chosenPort);
    if (ready) break;
  }

  const lanIps = getLanIps();
  const lanUrls = lanIps.map((i) => `http://${i.address}:${chosenPort} (${i.name})`);

  if (ready) {
    log(`Nsei Sukul Hub is ONLINE at http://localhost:${chosenPort}`);
    if (lanUrls.length > 0) {
      log(`LAN / Wi-Fi Access URLs:\n  ${lanUrls.join("\n  ")}`);
    }

    // Save status
    try {
      fs.writeFileSync(
        STATUS_FILE,
        JSON.stringify(
          {
            status: "online",
            port: chosenPort,
            localUrl: `http://localhost:${chosenPort}`,
            lanUrls: lanIps.map((i) => `http://${i.address}:${chosenPort}`),
            pid: child.pid,
            updatedAt: new Date().toISOString(),
          },
          null,
          2
        ),
        "utf8"
      );
    } catch {}

    // Open user's default browser
    openBrowser(`http://localhost:${chosenPort}`);

    // Show friendly Windows popup notification
    const bannerMsg =
      `Nsei Sukul School Hub is running!\n\n` +
      `Local URL: http://localhost:${chosenPort}\n` +
      (lanUrls.length > 0 ? `Wi-Fi / LAN Hotspot URL:\n${lanUrls.join("\n")}\n\n` : "\n") +
      `Other teachers on this Wi-Fi network or hotspot can open the Wi-Fi link on their phones or laptops.`;

    showWindowsPopup("Nsei Sukul School Hub", bannerMsg, false);
  } else {
    const err =
      `School Hub started but did not respond within 18 seconds.\n\n` +
      `Check ${LOG_FILE} for detailed startup messages.`;
    log(err);
    showWindowsPopup("Nsei Sukul Hub Startup Warning", err, true);
  }
}

main().catch((err) => {
  log(`Fatal error in launcher: ${err.stack || err.message}`);
  showWindowsPopup("Nsei Sukul Hub Fatal Error", err.message, true);
  process.exit(1);
});

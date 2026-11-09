const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

async function generateIco() {
  const svgPath = path.resolve(__dirname, "..", "src", "app", "icon.svg");
  const svgBuffer = fs.readFileSync(svgPath);

  const sizes = [16, 24, 32, 48, 64, 128, 256];
  const pngBuffers = [];

  for (const size of sizes) {
    const png = await sharp(svgBuffer)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    pngBuffers.push({ size, data: png });
  }

  // Build ICO header + directory
  const count = pngBuffers.length;
  const headerLength = 6;
  const dirEntryLength = 16;
  let currentOffset = headerLength + count * dirEntryLength;

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // Number of images

  const dirEntries = [];
  for (const item of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 0); // Width
    entry.writeUInt8(item.size >= 256 ? 0 : item.size, 1); // Height
    entry.writeUInt8(0, 2); // Colors
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(item.data.length, 8); // Image size
    entry.writeUInt32LE(currentOffset, 12); // Offset
    dirEntries.push(entry);
    currentOffset += item.data.length;
  }

  const icoBuffer = Buffer.concat([
    header,
    ...dirEntries,
    ...pngBuffers.map((p) => p.data),
  ]);

  const dests = [
    path.resolve(__dirname, "..", "installer", "app-icon.ico"),
    path.resolve(__dirname, "..", "public", "app-icon.ico"),
    path.resolve(__dirname, "..", "public", "favicon.ico"),
    path.resolve(__dirname, "..", "src", "app", "favicon.ico"),
  ];

  for (const dest of dests) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, icoBuffer);
    console.log("Wrote app icon to:", dest, `(${icoBuffer.length} bytes)`);
  }

  // Also write 256x256 PNG for web app manifest / assets
  const png256 = pngBuffers.find((p) => p.size === 256).data;
  fs.writeFileSync(path.resolve(__dirname, "..", "public", "app-icon.png"), png256);
  console.log("Wrote 256x256 PNG icon to public/app-icon.png");
}

generateIco().catch((err) => {
  console.error(err);
  process.exit(1);
});

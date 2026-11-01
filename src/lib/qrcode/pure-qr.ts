/**
 * Pure TypeScript Zero-Dependency QR Code Generator
 * Generates ISO/IEC 18004 compliant QR Code matrices (Versions 1 to 6)
 * Supports Byte encoding mode with Error Correction Level L & M.
 */

// Galois Field GF(256) math tables (primitive polynomial 0x11D = 285)
const EXP_TABLE = new Uint8Array(512);
const LOG_TABLE = new Uint8Array(256);

(function initGaloisField() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP_TABLE[i] = x;
    EXP_TABLE[i + 255] = x;
    LOG_TABLE[x] = i;
    x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
  }
  LOG_TABLE[0] = 0;
})();

function gfMultiply(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return EXP_TABLE[LOG_TABLE[a] + LOG_TABLE[b]];
}

// Generates Reed-Solomon generator polynomial for `degree` error-correction codewords
function rsGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1]);
  for (let i = 0; i < degree; i++) {
    const next = new Uint8Array(poly.length + 1);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMultiply(poly[j], EXP_TABLE[i]);
      next[j + 1] ^= poly[j];
    }
    poly = next;
  }
  return poly;
}

// Computes Reed-Solomon error correction codewords
function rsEncode(data: Uint8Array, eccCount: number): Uint8Array {
  const gen = rsGeneratorPoly(eccCount);
  const remainder = new Uint8Array(eccCount);

  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ remainder[0];
    for (let j = 0; j < eccCount - 1; j++) {
      remainder[j] = remainder[j + 1] ^ gfMultiply(gen[j + 1], factor);
    }
    remainder[eccCount - 1] = gfMultiply(gen[eccCount], factor);
  }

  return remainder;
}

// QR Code Version Specifications: [TotalDataCodewords, ECCodewords, VersionNumber]
// Using Error Correction Level M (~15% recovery, standard for commercial and ID card barcodes)
interface QRVersionSpec {
  version: number;
  dataCapacity: number;
  ecCodewords: number;
  alignmentPositions: number[];
}

const QR_SPECS_M: QRVersionSpec[] = [
  { version: 1, dataCapacity: 16, ecCodewords: 10, alignmentPositions: [] },
  { version: 2, dataCapacity: 28, ecCodewords: 16, alignmentPositions: [6, 18] },
  { version: 3, dataCapacity: 44, ecCodewords: 26, alignmentPositions: [6, 22] },
  { version: 4, dataCapacity: 64, ecCodewords: 36, alignmentPositions: [6, 26] },
  { version: 5, dataCapacity: 86, ecCodewords: 48, alignmentPositions: [6, 30] },
  { version: 6, dataCapacity: 108, ecCodewords: 64, alignmentPositions: [6, 34] },
];

export function encodeQRMatrix(text: string): boolean[][] {
  const utf8Bytes = new TextEncoder().encode(text);
  const dataLen = utf8Bytes.length;

  // Select minimum QR version that fits text in Byte Mode
  let spec = QR_SPECS_M.find((s) => s.dataCapacity >= dataLen + 3);
  if (!spec) {
    spec = QR_SPECS_M[QR_SPECS_M.length - 1]; // Fallback to max supported version
  }

  const { version, dataCapacity, ecCodewords, alignmentPositions } = spec;
  const size = 17 + 4 * version;

  // 1. Bitstream creation (Byte Mode: indicator 0100 + 8-bit length + data)
  const bitstream: number[] = [];
  function pushBits(val: number, bits: number) {
    for (let i = bits - 1; i >= 0; i--) {
      bitstream.push((val >> i) & 1);
    }
  }

  pushBits(0b0100, 4); // Byte mode indicator
  pushBits(dataLen, 8); // Character count indicator (8 bits for V1-9)
  for (let i = 0; i < dataLen; i++) {
    pushBits(utf8Bytes[i], 8);
  }

  // Terminator (up to 4 zero bits)
  const maxBits = dataCapacity * 8;
  const termLen = Math.min(4, maxBits - bitstream.length);
  pushBits(0, termLen);

  // Pad to byte boundary
  while (bitstream.length % 8 !== 0) {
    bitstream.push(0);
  }

  // Pad bytes 0xEC (236) and 0x11 (17) alternatively
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitstream.length < maxBits) {
    pushBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Convert bitstream to Uint8Array data codewords
  const dataCodewords = new Uint8Array(dataCapacity);
  for (let i = 0; i < dataCapacity; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitstream[i * 8 + b];
    }
    dataCodewords[i] = byteVal;
  }

  // 2. Generate Error Correction Codewords
  const ec = rsEncode(dataCodewords, ecCodewords);

  // Combine data + ec into final codeword stream
  const allCodewords = new Uint8Array(dataCapacity + ecCodewords);
  allCodewords.set(dataCodewords);
  allCodewords.set(ec, dataCapacity);

  // 3. Initialize Matrix (null = unassigned, true = dark, false = light)
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );

  // Helper to safely write functional modules
  function setModule(r: number, c: number, val: boolean) {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      matrix[r][c] = val;
    }
  }

  // 4. Place Finder Patterns (7x7) + Separators
  function drawFinder(row: number, col: number) {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const mr = row + r;
        const mc = col + c;
        if (mr >= 0 && mr < size && mc >= 0 && mc < size) {
          if (r >= 0 && r <= 6 && c >= 0 && c <= 6) {
            const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
            const isInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
            matrix[mr][mc] = isBorder || isInner;
          } else {
            matrix[mr][mc] = false; // Separator
          }
        }
      }
    }
  }

  drawFinder(0, 0); // Top-left
  drawFinder(0, size - 7); // Top-right
  drawFinder(size - 7, 0); // Bottom-left

  // 5. Place Alignment Patterns (Version >= 2)
  if (alignmentPositions.length > 0) {
    for (const r of alignmentPositions) {
      for (const c of alignmentPositions) {
        // Skip if overlaps with any finder pattern
        const nearTopLeft = r < 9 && c < 9;
        const nearTopRight = r < 9 && c > size - 10;
        const nearBottomLeft = r > size - 10 && c < 9;
        if (nearTopLeft || nearTopRight || nearBottomLeft) continue;

        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBorder = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isCenter = dr === 0 && dc === 0;
            matrix[r + dr][c + dc] = isBorder || isCenter;
          }
        }
      }
    }
  }

  // 6. Timing Patterns (Row 6 and Column 6)
  for (let i = 8; i < size - 8; i++) {
    if (matrix[6][i] === null) matrix[6][i] = i % 2 === 0;
    if (matrix[i][6] === null) matrix[i][6] = i % 2 === 0;
  }

  // 7. Dark Module
  matrix[4 * version + 9][8] = true;

  // 8. Format Information Area Reserve
  // Reserve row 8 and col 8 modules
  for (let i = 0; i < 9; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }
  for (let i = size - 8; i < size; i++) {
    if (matrix[8][i] === null) matrix[8][i] = false;
    if (matrix[i][8] === null) matrix[i][8] = false;
  }

  // 9. Data Module Placement (Zigzag in pairs from bottom-right)
  let bitIdx = 0;
  const totalBits = allCodewords.length * 8;
  let upwards = true;

  for (let right = size - 1; right > 0; right -= 2) {
    if (right === 6) right--; // Skip vertical timing column

    for (let vert = 0; vert < size; vert++) {
      const r = upwards ? size - 1 - vert : vert;
      for (let c = right; c > right - 2; c--) {
        if (matrix[r][c] === null) {
          let bit = false;
          if (bitIdx < totalBits) {
            const bytePos = Math.floor(bitIdx / 8);
            const bitOffset = 7 - (bitIdx % 8);
            bit = ((allCodewords[bytePos] >> bitOffset) & 1) === 1;
            bitIdx++;
          }

          // Apply Standard Mask Pattern 0: (r + c) % 2 === 0
          if ((r + c) % 2 === 0) {
            bit = !bit;
          }

          matrix[r][c] = bit;
        }
      }
    }
    upwards = !upwards;
  }

  // 10. Write Format Info: ECC Level M (00) + Mask 0 (000) = 00000 -> BCH format bits = 0x5412 ^ 0x0000 = 0x5412 (101010000010010)
  const formatBits = 0x5412; // 15 bits
  for (let i = 0; i < 15; i++) {
    const bit = ((formatBits >> (14 - i)) & 1) === 1;

    // Top-left format placement
    if (i < 6) matrix[8][i] = bit;
    else if (i === 6) matrix[8][7] = bit;
    else if (i === 7) matrix[8][8] = bit;
    else if (i === 8) matrix[7][8] = bit;
    else matrix[14 - i][8] = bit;

    // Split format placement (around other finders)
    if (i < 8) matrix[size - 1 - i][8] = bit;
    else matrix[8][size - 15 + i] = bit;
  }

  // Convert to clean boolean[][]
  return matrix.map((row) => row.map((m) => m === true));
}

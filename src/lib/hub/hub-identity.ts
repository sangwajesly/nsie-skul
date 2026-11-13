import crypto from "crypto";
import fs from "fs";
import path from "path";

const KEYS_DIR = path.resolve(process.cwd(), ".hub-keys");
const PRIVATE_KEY_FILE = path.join(KEYS_DIR, "ed25519_node_private.pem");
const PUBLIC_KEY_FILE = path.join(KEYS_DIR, "ed25519_node_public.pem");

export interface HubKeyPair {
  publicKeyPem: string;
  privateKeyPem: string;
}

/**
 * Loads or automatically generates the local Hub station's Ed25519 asymmetric identity.
 */
export function getOrCreateHubKeyPair(): HubKeyPair {
  if (fs.existsSync(PRIVATE_KEY_FILE) && fs.existsSync(PUBLIC_KEY_FILE)) {
    return {
      publicKeyPem: fs.readFileSync(PUBLIC_KEY_FILE, "utf8"),
      privateKeyPem: fs.readFileSync(PRIVATE_KEY_FILE, "utf8"),
    };
  }

  if (!fs.existsSync(KEYS_DIR)) {
    fs.mkdirSync(KEYS_DIR, { recursive: true });
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }) as string;
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;

  fs.writeFileSync(PRIVATE_KEY_FILE, privateKeyPem, "utf8");
  fs.writeFileSync(PUBLIC_KEY_FILE, publicKeyPem, "utf8");

  return { publicKeyPem, privateKeyPem };
}

/**
 * Signs a canonical JSON payload using the local Hub's Ed25519 private key.
 */
export function signHubPayload(payload: any, privateKeyPem?: string): string {
  const privKey = privateKeyPem || getOrCreateHubKeyPair().privateKeyPem;
  const canonicalString = typeof payload === "string" ? payload : JSON.stringify(payload);
  const data = Buffer.from(canonicalString, "utf8");

  const signature = crypto.sign(null, data, crypto.createPrivateKey(privKey));
  return signature.toString("base64");
}

/**
 * Verifies an Ed25519 signature against an expected public key.
 */
export function verifyHubSignature(
  payload: any,
  signatureBase64: string,
  publicKeyPem: string
): boolean {
  try {
    const canonicalString = typeof payload === "string" ? payload : JSON.stringify(payload);
    const data = Buffer.from(canonicalString, "utf8");
    const signature = Buffer.from(signatureBase64, "base64");

    return crypto.verify(null, data, crypto.createPublicKey(publicKeyPem), signature);
  } catch (err) {
    console.error("[HubIdentity] Signature verification error:", err);
    return false;
  }
}

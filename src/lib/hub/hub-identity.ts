import crypto from "crypto";
import fs from "fs";
import path from "path";

function getKeysDir(): string {
  const cwdKeys = path.resolve(process.cwd(), ".hub-keys");
  try {
    if (!fs.existsSync(cwdKeys)) fs.mkdirSync(cwdKeys, { recursive: true });
    fs.accessSync(cwdKeys, fs.constants.W_OK);
    return cwdKeys;
  } catch {}

  const baseDir = process.env.PROGRAMDATA || process.env.ALLUSERSPROFILE || process.env.LOCALAPPDATA || process.cwd();
  const dir = path.join(baseDir, "NseiSukulHub", ".hub-keys");
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true }); } catch {}
  }
  return dir;
}

export interface HubKeyPair {
  publicKeyPem: string;
  privateKeyPem: string;
}

/**
 * Loads or automatically generates the local Hub station's Ed25519 asymmetric identity.
 */
export function getOrCreateHubKeyPair(): HubKeyPair {
  const keysDir = getKeysDir();
  const privateKeyFile = path.join(keysDir, "ed25519_node_private.pem");
  const publicKeyFile = path.join(keysDir, "ed25519_node_public.pem");

  if (fs.existsSync(privateKeyFile) && fs.existsSync(publicKeyFile)) {
    return {
      publicKeyPem: fs.readFileSync(publicKeyFile, "utf8"),
      privateKeyPem: fs.readFileSync(privateKeyFile, "utf8"),
    };
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }) as string;
  const privateKeyPem = privateKey.export({ type: "pkcs8", format: "pem" }) as string;

  try {
    fs.writeFileSync(privateKeyFile, privateKeyPem, "utf8");
    fs.writeFileSync(publicKeyFile, publicKeyPem, "utf8");
  } catch (err) {
    console.warn("[HubIdentity] Could not write keys to disk:", err);
  }

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

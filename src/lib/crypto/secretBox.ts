import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
} from "crypto";

/**
 * Authenticated symmetric encryption (AES-256-GCM) for secrets stored at rest,
 * e.g. a user's bring-your-own Gemini API key.
 *
 * The 32-byte key is derived (SHA-256) from `ENCRYPTION_KEY` if set, otherwise
 * from `NEXTAUTH_SECRET` — so it works with zero extra config, while still
 * allowing a dedicated key. NOTE: rotating that secret makes existing encrypted
 * values undecryptable (users would simply re-enter their key).
 *
 * Stored format: `enc:v1:<iv>:<authTag>:<ciphertext>` (each base64). Base64
 * never contains ":", so the value splits cleanly. Values not in this format
 * are treated as legacy plaintext and returned as-is on decrypt (so existing
 * keys keep working until they're next set/migrated).
 */

const FORMAT = "enc:v1";

function getKey(): Buffer {
  const dedicated = process.env.ENCRYPTION_KEY;
  // A weak ENCRYPTION_KEY defeats the purpose — fail fast so a low-entropy value
  // can't be used by accident. Generate one with `openssl rand -base64 32`.
  if (dedicated && dedicated.length < 16) {
    throw new Error(
      "ENCRYPTION_KEY is too short — use a high-entropy random value, e.g. `openssl rand -base64 32`.",
    );
  }
  const secret = dedicated || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "ENCRYPTION_KEY or NEXTAUTH_SECRET must be set to encrypt secrets.",
    );
  }
  return createHash("sha256").update(secret).digest(); // 32-byte AES key
}

/** True if a stored value is in our encrypted format (vs. legacy plaintext). */
export function isEncrypted(value: string): boolean {
  return typeof value === "string" && value.startsWith(`${FORMAT}:`);
}

/** Encrypt a UTF-8 string. Returns `enc:v1:<iv>:<tag>:<ciphertext>`. */
export function encryptSecret(plain: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit nonce (GCM standard)
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plain, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    FORMAT,
    iv.toString("base64"),
    tag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":");
}

/**
 * Decrypt a value produced by encryptSecret. A value that isn't in the
 * `enc:v1` format is assumed to be legacy plaintext and returned unchanged.
 * Throws only if a properly-formatted value fails authentication (tampered or
 * wrong key).
 */
export function decryptSecret(stored: string): string {
  if (!stored) return "";
  const parts = stored.split(":");
  if (parts.length !== 5 || parts[0] !== "enc" || parts[1] !== "v1") {
    return stored; // legacy plaintext / not our format
  }
  const key = getKey();
  const iv = Buffer.from(parts[2], "base64");
  const tag = Buffer.from(parts[3], "base64");
  const ciphertext = Buffer.from(parts[4], "base64");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

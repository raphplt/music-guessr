import "server-only";
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes } from "node:crypto";

/**
 * Sealed tokens: AES-256-GCM encrypted JSON, base64url encoded.
 * The client can hold a round token without being able to read the answer.
 */
const secret = () =>
  process.env.APP_SECRET ??
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("APP_SECRET is required in production");
      })()
    : "dev-secret-change-me-please-0123456789");

const key = () => createHash("sha256").update(secret()).digest();

export function seal(payload: unknown): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, data]).toString("base64url");
}

export function open<T>(token: string): T | null {
  try {
    const buf = Buffer.from(token, "base64url");
    const iv = buf.subarray(0, 12);
    const tag = buf.subarray(12, 28);
    const data = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Stable, non-invertible public key for a track (used for "seen" lists + audio cache). */
export function roundKeyFor(trackId: string): string {
  return createHmac("sha256", secret()).update(trackId).digest("base64url").slice(0, 22);
}

export function randomId(bytes = 16): string {
  return randomBytes(bytes).toString("base64url");
}

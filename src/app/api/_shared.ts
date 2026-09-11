import "server-only";
import { getSession, getTaste, getTastePool } from "@/lib/spotify";
import type { CatalogueTrack } from "@/lib/catalogue-shared";

export const ok = (data: unknown, init?: ResponseInit) =>
  Response.json({ code: 0, message: "ok", data }, { headers: { "cache-control": "no-store" }, ...init });

export const fail = (message: string, status = 400) =>
  Response.json({ code: -1, message }, { status, headers: { "cache-control": "no-store" } });

/** Personal pool for the signed-in Spotify listener, or null. */
export async function personalPool(): Promise<CatalogueTrack[] | null> {
  const session = await getSession();
  if (!session) return null;
  try {
    const taste = await getTaste(session);
    return await getTastePool(taste);
  } catch {
    return null;
  }
}

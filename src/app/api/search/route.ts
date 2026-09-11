import { searchTracks, collectionBySlug, type CatalogueTrack } from "@/lib/catalogue";
import { ok, personalPool } from "../_shared";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const term = (q.get("q") ?? "").slice(0, 80);
  const limit = Math.min(12, Math.max(1, Number(q.get("limit") ?? 8)));
  const collection = q.get("collection");
  const source = q.get("source");

  let scope: ((t: CatalogueTrack) => boolean) | undefined;
  let extra: CatalogueTrack[] | undefined;

  if (collection && !collection.startsWith("spotify:")) {
    const c = collectionBySlug(collection);
    if (c) scope = c.filter;
  }
  if (source === "spotify" || collection?.startsWith("spotify:")) {
    const pool = (await personalPool()) ?? [];
    extra = collection?.startsWith("spotify:") ? pool.filter((t) => t.artistSlug === collection) : pool;
    if (collection?.startsWith("spotify:")) scope = () => false;
  }
  return ok(searchTracks(term, { limit, scope, extra }));
}

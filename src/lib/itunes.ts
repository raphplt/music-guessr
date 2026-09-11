import "server-only";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  difficultyFor,
  eraForYear,
  normalizeGenre,
  type CatalogueTrack,
} from "@/lib/catalogue-shared";
import { fold } from "@/lib/catalogue";

/**
 * Server-side iTunes lookups used to turn a Spotify artist list into playable
 * tracks (30-second previews). Results are cached in memory and on disk
 * (.cache/itunes) so a taste profile only costs a handful of API calls once.
 */
const CACHE_DIR = join(process.cwd(), ".cache", "itunes");
const memory = new Map<string, CatalogueTrack[]>();
const inflight = new Map<string, Promise<CatalogueTrack[]>>();
const TTL_MS = 1000 * 60 * 60 * 24 * 14;

const JUNK = /\b(live|karaoke|instrumental|commentary|sped up|slowed|demo|interlude|skit|megamix|medley|tribute)\b|remix|mix\)|edit\)|version\)|8d audio/i;

type ITunesResult = {
  wrapperType: string;
  kind: string;
  trackId: number;
  artistName: string;
  collectionName?: string;
  trackName: string;
  trackViewUrl?: string;
  previewUrl?: string;
  artworkUrl100?: string;
  releaseDate?: string;
  primaryGenreName?: string;
  trackTimeMillis?: number;
  isStreamable?: boolean;
};

export function spotifyArtistSlug(name: string) {
  return `spotify:${fold(name).replace(/\s+/g, "-")}`;
}

function cachePath(slug: string) {
  return join(CACHE_DIR, `${slug.replace(/[^a-z0-9-]/g, "_")}.json`);
}

function readDisk(slug: string): CatalogueTrack[] | null {
  try {
    const p = cachePath(slug);
    if (!existsSync(p)) return null;
    const { at, tracks } = JSON.parse(readFileSync(p, "utf8")) as { at: number; tracks: CatalogueTrack[] };
    if (Date.now() - at > TTL_MS) return null;
    return tracks;
  } catch {
    return null;
  }
}

function writeDisk(slug: string, tracks: CatalogueTrack[]) {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(cachePath(slug), JSON.stringify({ at: Date.now(), tracks }));
  } catch {
    /* read-only filesystem (e.g. serverless) — memory cache still works */
  }
}

async function search(term: string, country: string, limit: number): Promise<ITunesResult[]> {
  const url = `https://itunes.apple.com/search?${new URLSearchParams({ term, entity: "song", media: "music", attribute: "artistTerm", limit: String(limit), country })}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { "user-agent": "music-guessr/1.0" }, cache: "no-store" });
    if (res.status === 429 || res.status === 403 || res.status >= 500) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }
    if (!res.ok) throw new Error(`iTunes ${res.status}`);
    const json = (await res.json()) as { results: ITunesResult[] };
    return json.results ?? [];
  }
  throw new Error("iTunes rate limited");
}

/**
 * Resolve an artist name (from Spotify) to playable tracks.
 * `tier` drives the difficulty split inside the artist's discography.
 */
export async function tracksForArtist(name: string, opts: { limit?: number; country?: string; tier?: 1 | 2 | 3 | 4 } = {}): Promise<CatalogueTrack[]> {
  const slug = spotifyArtistSlug(name);
  const cached = memory.get(slug) ?? readDisk(slug);
  if (cached) {
    memory.set(slug, cached);
    return cached;
  }
  const running = inflight.get(slug);
  if (running) return running;

  const task = (async () => {
    const limit = opts.limit ?? 30;
    let results = await search(name, opts.country ?? "US", limit);
    const wanted = fold(name);
    const filt = (r: ITunesResult) => {
      if (r.wrapperType !== "track" || r.kind !== "song" || !r.previewUrl) return false;
      const artist = fold(r.artistName);
      return artist === wanted || artist.startsWith(wanted + " ") || artist.split(" and ")[0] === wanted;
    };
    let good = results.filter(filt);
    if (good.length < 4) {
      results = await search(name, opts.country === "FR" ? "US" : "FR", limit);
      const alt = results.filter(filt);
      if (alt.length > good.length) good = alt;
    }
    const seen = new Set<string>();
    const tracks: CatalogueTrack[] = [];
    let rank = 0;
    for (const r of good) {
      const title = r.trackName.replace(/\s+/g, " ").trim();
      if (JUNK.test(title)) continue;
      const key = fold(title).replace(/\s*(feat .*|from .*|bonus track|deluxe|single version|radio edit|album version)\s*$/, "");
      if (seen.has(key)) continue;
      seen.add(key);
      const year = r.releaseDate ? Number(r.releaseDate.slice(0, 4)) : 0;
      tracks.push({
        id: `sp-${r.trackId}`,
        title,
        artist: r.artistName,
        artistSlug: slug,
        album: (r.collectionName ?? "").trim(),
        artworkUrl: (r.artworkUrl100 ?? "").replace(/100x100bb/, "600x600bb"),
        previewUrl: r.previewUrl!,
        trackUrl: r.trackViewUrl ?? "",
        year,
        era: eraForYear(year || 2024),
        genre: normalizeGenre(r.primaryGenreName ?? ""),
        rawGenre: r.primaryGenreName ?? "",
        difficulty: difficultyFor(opts.tier ?? 1, rank),
        tier: opts.tier ?? 1,
        rank,
        durationMs: r.trackTimeMillis ?? 0,
      });
      rank++;
    }
    // Only persist real results: an empty list is usually iTunes throttling, not an unknown artist.
    if (tracks.length > 0) {
      memory.set(slug, tracks);
      writeDisk(slug, tracks);
    }
    return tracks;
  })().finally(() => inflight.delete(slug));

  inflight.set(slug, task);
  return task;
}

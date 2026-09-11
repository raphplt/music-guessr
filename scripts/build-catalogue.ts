
/**
 * Builds src/data/catalogue.json from the iTunes Search API.
 *
 *   npm run build:catalogue            # full rebuild
 *   npm run build:catalogue -- --resume  # keep artists already present
 *
 * Every track keeps a 30-second preview URL (m4a) served by Apple, which the
 * game streams through /api/audio so the answer never leaks to the client.
 */
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { ARTISTS, type ArtistSeed } from "../src/data/artists";
import {
  normalizeGenre,
  eraForYear,
  difficultyFor,
  type CatalogueTrack,
} from "../src/lib/catalogue-shared";

const OUT = "src/data/catalogue.json";
const LIMIT = 40;
const RESUME = process.argv.includes("--resume");

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
  trackExplicitness?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const JUNK =
  /\b(live|karaoke|instrumental|commentary|sped up|slowed|remaster(ed)?|demo|rehearsal|interlude|skit|intro|outro|megamix|medley|a cappella|acapella|tribute|cover)\b|remix|mix\)|edit\)|version\)|\(feat\.[^)]*\)\s*\[|8d audio/i;

async function fetchJson(url: string, attempt = 0): Promise<{ results: ITunesResult[] }> {
  const res = await fetch(url, { headers: { "user-agent": "music-guessr/1.0" } });
  if (res.status === 403 || res.status === 429 || res.status >= 500) {
    if (attempt > 6) throw new Error(`iTunes ${res.status} for ${url}`);
    const wait = 2000 * 2 ** attempt;
    console.log(`  rate limited (${res.status}), waiting ${wait}ms`);
    await sleep(wait);
    return fetchJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`iTunes ${res.status} for ${url}`);
  return (await res.json()) as { results: ITunesResult[] };
}

async function searchArtist(seed: ArtistSeed, country: string) {
  const term = seed.term ?? seed.name;
  const url = `https://itunes.apple.com/search?${new URLSearchParams({
    term,
    entity: "song",
    media: "music",
    attribute: "artistTerm",
    limit: String(LIMIT),
    country,
  })}`;
  let { results } = await fetchJson(url);
  if (results.length === 0) {
    // iTunes occasionally answers an empty list while throttling — retry once.
    await sleep(3000);
    results = (await fetchJson(url)).results;
  }
  const strip = (s: string) => s.replace(/^the /, "");
  const wanted = strip(fold(term));
  return results.filter((r) => {
    if (r.wrapperType !== "track" || r.kind !== "song") return false;
    const artist = strip(fold(r.artistName));
    return artist === wanted || artist.startsWith(wanted + " ") || artist.split(" and ")[0] === wanted || artist.split(" & ")[0] === wanted;
  });
}

function toTrack(r: ITunesResult, seed: ArtistSeed, rank: number): CatalogueTrack | null {
  if (!r.previewUrl || r.isStreamable === false) return null;
  const year = r.releaseDate ? Number(r.releaseDate.slice(0, 4)) : 0;
  if (!year) return null;
  const title = r.trackName.replace(/\s+/g, " ").trim();
  if (JUNK.test(title)) return null;
  return {
    id: String(r.trackId),
    title,
    artist: r.artistName,
    artistSlug: seed.slug,
    album: (r.collectionName ?? "").trim(),
    artworkUrl: (r.artworkUrl100 ?? "").replace(/100x100bb/, "600x600bb"),
    previewUrl: r.previewUrl,
    trackUrl: r.trackViewUrl ?? "",
    year,
    era: eraForYear(year),
    genre: normalizeGenre(r.primaryGenreName ?? ""),
    rawGenre: r.primaryGenreName ?? "",
    difficulty: difficultyFor(seed.tier, rank),
    tier: seed.tier,
    rank,
    durationMs: r.trackTimeMillis ?? 0,
  };
}

async function main() {
  let existing: CatalogueTrack[] = [];
  if (RESUME && existsSync(OUT)) {
    existing = JSON.parse(readFileSync(OUT, "utf8")).tracks as CatalogueTrack[];
  }
  const done = new Set(existing.map((t) => t.artistSlug));
  const tracks: CatalogueTrack[] = [...existing];
  const seen = new Set(existing.map((t) => `${fold(t.artist)}::${fold(t.title)}`));

  const queue = ARTISTS.filter((s) => !done.has(s.slug));
  console.log(`${queue.length} artists to fetch (${existing.length} tracks kept)`);

  let i = 0;
  const worker = async () => {
    while (i < queue.length) {
      const seed = queue[i++];
      try {
        let results = await searchArtist(seed, seed.country ?? "US");
        if (results.length < 5 && seed.country !== "FR") {
          await sleep(350);
          const fr = await searchArtist(seed, "FR");
          if (fr.length > results.length) results = fr;
        } else if (results.length < 5 && seed.country === "FR") {
          await sleep(350);
          const us = await searchArtist(seed, "US");
          if (us.length > results.length) results = us;
        }
        let rank = 0;
        let added = 0;
        for (const r of results) {
          const key = `${fold(r.artistName)}::${fold(r.trackName).replace(/\s*(taylor s version|feat .*|from .*|bonus track|deluxe|single version|radio edit|album version|explicit)\s*$/g, "").trim()}`;
          if (seen.has(key)) continue;
          const t = toTrack(r, seed, rank);
          if (!t) continue;
          seen.add(key);
          tracks.push(t);
          rank++;
          added++;
        }
        console.log(`✓ ${seed.name.padEnd(28)} ${String(added).padStart(2)} tracks`);
        if (tracks.length % 25 === 0) save(tracks);
      } catch (e) {
        console.log(`✗ ${seed.name}: ${(e as Error).message}`);
      }
      await sleep(400);
    }
  };
  await Promise.all([worker(), worker()]);
  save(tracks);
  summary(tracks);
}

function save(tracks: CatalogueTrack[]) {
  writeFileSync(
    OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), tracks }, null, 0),
  );
}

function summary(tracks: CatalogueTrack[]) {
  const count = (k: keyof CatalogueTrack) =>
    Object.entries(
      tracks.reduce<Record<string, number>>((acc, t) => {
        const v = String(t[k]);
        acc[v] = (acc[v] ?? 0) + 1;
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1]);
  console.log(`\n${tracks.length} tracks`);
  console.log("difficulty", count("difficulty"));
  console.log("era", count("era"));
  console.log("genre", count("genre"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

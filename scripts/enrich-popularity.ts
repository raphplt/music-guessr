/**
 * Improves the difficulty split using Deezer's per-artist "top tracks"
 * (real popularity ordering) instead of the iTunes result order.
 *
 * For each artist in the catalogue: Deezer artist search → /artist/{id}/top
 * → tracks matched by folded title get rank = position in that list; the
 * others are treated as deep cuts (rank 60+). Then difficulty is recomputed.
 *
 *   npm run enrich:catalogue
 */
import { readFileSync, writeFileSync } from "node:fs";
import { difficultyFor, type CatalogueTrack } from "../src/lib/catalogue-shared";
import { ARTISTS } from "../src/data/artists";

const FILE = "src/data/catalogue.json";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\((feat|with|ft|from|remaster|version|edit|mix|mono|stereo|single|album|live|deluxe|bonus|radio|original|explicit|clean)[^)]*\)|\[[^\]]*\]|\s-\s.*$/g, "")
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

type DzTrack = { title: string; title_short?: string; rank: number };

async function deezer<T>(path: string, attempt = 0): Promise<T | null> {
  const res = await fetch(`https://api.deezer.com${path}`);
  if (res.status === 429 || res.status >= 500) {
    if (attempt > 4) return null;
    await sleep(1500 * 2 ** attempt);
    return deezer(path, attempt + 1);
  }
  if (!res.ok) return null;
  const json = (await res.json()) as T & { error?: { code: number } };
  if (json.error) {
    if (json.error.code === 4 && attempt < 5) {
      await sleep(2500);
      return deezer(path, attempt + 1);
    }
    return null;
  }
  return json;
}

async function topTitles(name: string): Promise<string[] | null> {
  const search = await deezer<{ data: { id: number; name: string; nb_fan?: number }[] }>(`/search/artist?q=${encodeURIComponent(name)}&limit=8`);
  const wanted = fold(name);
  // several Deezer entries can share a name (duplicates / tributes): keep the most followed one
  const exact = (search?.data ?? []).filter((a) => fold(a.name) === wanted).sort((a, b) => (b.nb_fan ?? 0) - (a.nb_fan ?? 0));
  const artist = exact[0] ?? search?.data[0];
  if (!artist) return null;
  const top = await deezer<{ data: DzTrack[] }>(`/artist/${artist.id}/top?limit=100`);
  if (!top) return null;
  return top.data.map((t) => fold(t.title_short ?? t.title));
}

async function main() {
  const json = JSON.parse(readFileSync(FILE, "utf8")) as { generatedAt: string; tracks: CatalogueTrack[] };
  const bySlug = new Map<string, CatalogueTrack[]>();
  for (const t of json.tracks) bySlug.set(t.artistSlug, [...(bySlug.get(t.artistSlug) ?? []), t]);
  const seeds = new Map(ARTISTS.map((a) => [a.slug, a]));
  let done = 0;
  let matchedTotal = 0;
  const slugs = [...bySlug.keys()];
  let i = 0;
  const worker = async () => {
    while (i < slugs.length) {
      const slug = slugs[i++];
      const tracks = bySlug.get(slug)!;
      const seed = seeds.get(slug);
      const name = seed?.term ?? seed?.name ?? tracks[0].artist;
      const titles = await topTitles(name);
      if (titles) {
        const pos = new Map<string, number>();
        titles.forEach((t, idx) => {
          if (!pos.has(t)) pos.set(t, idx);
        });
        let matched = 0;
        for (const t of tracks) {
          t.itunesRank ??= t.rank >= 60 ? t.rank - 60 : t.rank;
          const k = fold(t.title);
          const p = pos.get(k);
          if (p !== undefined) {
            t.rank = p;
            matched++;
          } else {
            t.rank = 60 + t.itunesRank;
          }
          t.difficulty = difficultyFor(t.tier, t.rank);
        }
        matchedTotal += matched;
        console.log(`✓ ${name.padEnd(28)} ${String(matched).padStart(2)}/${tracks.length} matched`);
      } else {
        for (const t of tracks) t.itunesRank ??= t.rank >= 60 ? t.rank - 60 : t.rank;
        console.log(`✗ ${name} (no Deezer match, keeping iTunes order)`);
      }
      done++;
      await sleep(120);
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  writeFileSync(FILE, JSON.stringify(json));
  const count = Object.entries(json.tracks.reduce<Record<string, number>>((a, t) => ((a[t.difficulty] = (a[t.difficulty] ?? 0) + 1), a), {}));
  console.log(`\n${done} artists, ${matchedTotal}/${json.tracks.length} tracks matched to Deezer top lists`);
  console.log("difficulty", count);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

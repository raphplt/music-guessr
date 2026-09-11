import "server-only";
import raw from "@/data/catalogue.json";
import { ARTISTS, type ArtistSeed } from "@/data/artists";
import {
  DIFFICULTIES,
  ERAS,
  ERA_LABELS,
  genreLabel,
  type CatalogueTrack,
  type Difficulty,
  type Era,
} from "@/lib/catalogue-shared";
import { roundKeyFor } from "@/lib/token";

export type { CatalogueTrack, Difficulty, Era };

export type TrackFilters = {
  difficulty: Difficulty;
  era: Era | "any";
  genre: string;
  artist: string; // artist slug | "any"
};

type CatalogueFile = { generatedAt: string; tracks: CatalogueTrack[] };

const data = raw as CatalogueFile;

export const TRACKS: CatalogueTrack[] = data.tracks;
const byId = new Map(TRACKS.map((t) => [t.id, t]));
const keyById = new Map<string, string>();
const idByKey = new Map<string, string>();

export function trackById(id: string) {
  return byId.get(id) ?? null;
}

export function roundKey(trackId: string) {
  let k = keyById.get(trackId);
  if (!k) {
    k = roundKeyFor(trackId);
    keyById.set(trackId, k);
    idByKey.set(k, trackId);
  }
  return k;
}

export function trackIdForKey(key: string) {
  if (idByKey.size === 0) for (const t of TRACKS) roundKey(t.id);
  return idByKey.get(key) ?? null;
}

export const ARTIST_BY_SLUG = new Map(ARTISTS.map((a) => [a.slug, a]));
export const FEATURED_ARTISTS: ArtistSeed[] = ARTISTS.filter((a) => a.featured);

export function matchesFilters(t: CatalogueTrack, f: Omit<TrackFilters, "difficulty"> & { difficulty?: Difficulty }) {
  if (f.difficulty && t.difficulty !== f.difficulty) return false;
  if (f.era !== "any" && t.era !== f.era) return false;
  if (f.genre !== "any" && t.genre !== f.genre) return false;
  if (f.artist !== "any" && t.artistSlug !== f.artist) return false;
  return true;
}

/** Fold accents/case/punctuation for search + matching. */
export function fold(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const searchIndex = TRACKS.map((t) => ({
  t,
  title: fold(t.title),
  artist: fold(t.artist),
}));

export type Suggestion = { id: string; title: string; artistName: string; artworkUrl: string };

export function searchTracks(
  q: string,
  opts: { limit?: number; scope?: (t: CatalogueTrack) => boolean; extra?: CatalogueTrack[] } = {},
): Suggestion[] {
  const needle = fold(q);
  if (!needle) return [];
  const limit = opts.limit ?? 8;
  const scored: { s: number; t: CatalogueTrack }[] = [];
  const pool = opts.extra
    ? [...searchIndex, ...opts.extra.map((t) => ({ t, title: fold(t.title), artist: fold(t.artist) }))]
    : searchIndex;
  const seen = new Set<string>();
  for (const e of pool) {
    if (opts.scope && !opts.scope(e.t)) continue;
    if (seen.has(e.t.id)) continue;
    let s = 0;
    if (e.title === needle) s = 100;
    else if (e.title.startsWith(needle)) s = 80;
    else if (e.title.split(" ").some((w) => w.startsWith(needle))) s = 60;
    else if (e.title.includes(needle)) s = 45;
    else if (e.artist.startsWith(needle)) s = 40;
    else if (e.artist.includes(needle)) s = 30;
    else if (`${e.artist} ${e.title}`.includes(needle) || `${e.title} ${e.artist}`.includes(needle)) s = 25;
    if (!s) continue;
    // famous tracks first inside the same tier
    s -= e.t.rank * 0.05 + (e.t.tier - 1) * 0.5;
    seen.add(e.t.id);
    scored.push({ s, t: e.t });
  }
  scored.sort((a, b) => b.s - a.s || a.t.title.localeCompare(b.t.title));
  return scored.slice(0, limit).map(({ t }) => ({
    id: t.id,
    title: t.title,
    artistName: t.artist,
    artworkUrl: t.artworkUrl,
  }));
}

/** Genre options (with counts) available for the given era/artist filter. */
export function genreOptions(f: { era: Era | "any"; artist: string }) {
  const counts = new Map<string, number>();
  for (const t of TRACKS) {
    if (f.era !== "any" && t.era !== f.era) continue;
    if (f.artist !== "any" && t.artistSlug !== f.artist) continue;
    counts.set(t.genre, (counts.get(t.genre) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([g, c]) => c >= 20 && g !== "other")
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, label: genreLabel(value), count }));
}

export const ERA_OPTIONS = ERAS.map((value) => ({ value, label: ERA_LABELS[value] }));
export const DIFFICULTY_LIST = DIFFICULTIES;

/* ---------------- Collections (music quizzes) ---------------- */

export type CollectionKind = "genre" | "decade" | "artist";
export type Collection = {
  kind: CollectionKind;
  slug: string;
  label: string;
  total: number;
  filter: (t: CatalogueTrack) => boolean;
};

const GENRE_COLLECTIONS = ["pop", "rock", "hip-hop", "r-and-b", "k-pop", "electronic", "dance", "latin", "country", "alternative", "metal", "chanson"];
const DECADE_COLLECTIONS: Era[] = ["classic", "1980s", "1990s", "2000s", "2010s", "2020s"];

let collectionsCache: Collection[] | null = null;
export function collections(): Collection[] {
  if (collectionsCache) return collectionsCache;
  const out: Collection[] = [];
  for (const g of GENRE_COLLECTIONS) {
    const filter = (t: CatalogueTrack) => t.genre === g;
    const total = TRACKS.filter(filter).length;
    if (total >= 20) out.push({ kind: "genre", slug: g, label: genreLabel(g), total, filter });
  }
  for (const e of DECADE_COLLECTIONS) {
    const filter = (t: CatalogueTrack) => t.era === e;
    out.push({ kind: "decade", slug: e, label: ERA_LABELS[e], total: TRACKS.filter(filter).length, filter });
  }
  for (const a of ARTISTS) {
    const filter = (t: CatalogueTrack) => t.artistSlug === a.slug;
    const total = TRACKS.filter(filter).length;
    if (total >= 8) out.push({ kind: "artist", slug: a.slug, label: a.name, total, filter });
  }
  collectionsCache = out;
  return out;
}

export function collectionBySlug(slug: string) {
  return collections().find((c) => c.slug === slug) ?? null;
}

export function catalogueStats() {
  return {
    tracks: TRACKS.length,
    artists: new Set(TRACKS.map((t) => t.artistSlug)).size,
    generatedAt: data.generatedAt,
  };
}

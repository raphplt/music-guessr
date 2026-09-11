import "server-only";
import { seal, open, randomId } from "@/lib/token";
import {
  TRACKS,
  matchesFilters,
  roundKey,
  trackById,
  trackIdForKey,
  collectionBySlug,
  type CatalogueTrack,
  type Difficulty,
  type Era,
} from "@/lib/catalogue";
import { DIFFICULTIES, ERAS } from "@/lib/catalogue-shared";

/** Clip lengths per stage — identical to songspot.co. */
export const STAGE_SECONDS = [0.1, 0.5, 2, 8, 15] as const;
export const STAGE_LABELS = ["0.1s", "0.5s", "2s", "8s", "15s"] as const;
/** Points awarded when the track is solved at a given stage. */
export const STAGE_SCORES = [1000, 800, 600, 400, 200] as const;
/** Previews are 30 s; random starts must leave room for the longest clip. */
export const PREVIEW_SECONDS = 30;
const ROUND_TTL_MS = 1000 * 60 * 60 * 6;

export type PlaybackMode = "start" | "random";
export type Source = "catalogue" | "spotify";
export type Mode = "practice" | "daily";

export type RoundPayload = {
  v: 1;
  id: string;
  trackId: string;
  /** Full track when it doesn't live in the static catalogue (Spotify taste pool). */
  track?: CatalogueTrack;
  stage: number;
  mistakes: number;
  offset: number;
  playback: PlaybackMode;
  difficulty: Difficulty;
  era: Era | "any";
  genre: string;
  artist: string;
  source: Source;
  mode: Mode;
  date?: string;
  exp: number;
};

export type RoundPublic = {
  roundToken: string;
  roundKey: string;
  stage: number;
  clipSeconds: number;
  offsetSeconds: number;
  playback: PlaybackMode;
  difficulty: Difficulty;
  era: Era | "any";
  genre: string;
  artist: string;
  mistakes: number;
  playable: boolean;
  source: Source;
  mode: Mode;
  date?: string;
  collectionKey: string;
};

export type Reveal = {
  title: string;
  artistName: string;
  albumName: string;
  artworkUrl: string;
  trackUrl: string;
  year: number;
  score: number;
  clipSeconds: number;
  guessedStage: number | null;
  mistakes: number;
};

export type Outcome = "active" | "correct" | "failed";

export type TransitionResult =
  | { outcome: "active"; roundToken: string; stage: number; clipSeconds: number; mistakes: number }
  | { outcome: "correct" | "failed"; reveal: Reveal };

export function parseDifficulty(v: string | null): Difficulty {
  return (DIFFICULTIES as readonly string[]).includes(v ?? "") ? (v as Difficulty) : "easy";
}
export function parseEra(v: string | null): Era | "any" {
  return (ERAS as readonly string[]).includes(v ?? "") ? (v as Era) : "any";
}

function toPublic(p: RoundPayload, token: string): RoundPublic {
  return {
    roundToken: token,
    roundKey: roundKey(p.trackId),
    stage: p.stage,
    clipSeconds: STAGE_SECONDS[p.stage],
    offsetSeconds: p.offset,
    playback: p.playback,
    difficulty: p.difficulty,
    era: p.era,
    genre: p.genre,
    artist: p.artist,
    mistakes: p.mistakes,
    playable: true,
    source: p.source,
    mode: p.mode,
    date: p.date,
    collectionKey: p.artist !== "any" ? p.artist : "general",
  };
}

/** Deterministic PRNG (mulberry32) for daily rounds. */
function seeded(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function utcDateString(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export type CreateRoundOptions = {
  difficulty: Difficulty;
  era: Era | "any";
  genre: string;
  artist: string;
  playback: PlaybackMode;
  excludeKeys: string[];
  collection?: string | null;
  source: Source;
  /** Extra pool (Spotify taste) merged with / replacing the catalogue. */
  pool?: CatalogueTrack[] | null;
  mode?: Mode;
  date?: string;
};

export function createRound(o: CreateRoundOptions): { round: RoundPublic } | { error: string } {
  const mode = o.mode ?? "practice";
  let candidates: CatalogueTrack[];

  if (mode === "daily") {
    const rng = seeded(`daily:${o.date}`);
    const pool = TRACKS.filter((t) => t.difficulty === "easy" || t.difficulty === "medium");
    const track = pool[Math.floor(rng() * pool.length)];
    const offset = o.playback === "random" ? Math.round(rng() * (PREVIEW_SECONDS - 15) * 10) / 10 : 0;
    return { round: sealRound(track, { ...o, offset, mode, date: o.date }) };
  }

  if (o.source === "spotify") {
    if (!o.pool || o.pool.length === 0) return { error: "Connect Spotify to play your library" };
    candidates = o.pool.filter((t) => matchesFilters(t, { difficulty: o.difficulty, era: o.era, genre: o.genre, artist: "any" }));
    if (o.artist !== "any") candidates = candidates.filter((t) => t.artistSlug === o.artist);
  } else if (o.collection) {
    const c = collectionBySlug(o.collection);
    if (!c) return { error: "Unknown collection" };
    candidates = TRACKS.filter((t) => c.filter(t) && t.difficulty === o.difficulty);
  } else if (o.artist.startsWith("spotify:")) {
    candidates = (o.pool ?? []).filter((t) => t.artistSlug === o.artist && t.difficulty === o.difficulty);
  } else {
    candidates = TRACKS.filter((t) => matchesFilters(t, o));
  }

  const excluded = new Set(o.excludeKeys);
  let fresh = candidates.filter((t) => !excluded.has(roundKey(t.id)));
  if (fresh.length === 0 && candidates.length > 0 && excluded.size > 0) fresh = candidates; // pool exhausted: allow repeats
  if (fresh.length === 0) return { error: "No unseen tracks match these filters" };

  const track = fresh[Math.floor(Math.random() * fresh.length)];
  const offset = o.playback === "random" ? Math.round(Math.random() * (PREVIEW_SECONDS - 15) * 10) / 10 : 0;
  return { round: sealRound(track, { ...o, offset, mode }) };
}

function sealRound(
  track: CatalogueTrack,
  o: { difficulty: Difficulty; era: Era | "any"; genre: string; artist: string; playback: PlaybackMode; source: Source; offset: number; mode: Mode; date?: string },
): RoundPublic {
  const inCatalogue = !!trackById(track.id);
  const payload: RoundPayload = {
    v: 1,
    id: randomId(8),
    trackId: track.id,
    track: inCatalogue ? undefined : track,
    stage: 0,
    mistakes: 0,
    offset: o.offset,
    playback: o.playback,
    difficulty: o.difficulty,
    era: o.era,
    genre: o.genre,
    artist: o.artist,
    source: o.source,
    mode: o.mode,
    date: o.date,
    exp: Date.now() + ROUND_TTL_MS,
  };
  return toPublic(payload, seal(payload));
}

export function openRound(token: string | null | undefined): RoundPayload | null {
  if (!token) return null;
  const p = open<RoundPayload>(token);
  if (!p || p.v !== 1 || p.exp < Date.now()) return null;
  return p;
}

export function roundTrack(p: RoundPayload): CatalogueTrack | null {
  return p.track ?? trackById(p.trackId);
}

function reveal(p: RoundPayload, t: CatalogueTrack, correct: boolean): Reveal {
  return {
    title: t.title,
    artistName: t.artist,
    albumName: t.album,
    artworkUrl: t.artworkUrl,
    trackUrl: t.trackUrl,
    year: t.year,
    score: correct ? STAGE_SCORES[p.stage] : 0,
    clipSeconds: STAGE_SECONDS[p.stage],
    guessedStage: correct ? p.stage : null,
    mistakes: p.mistakes,
  };
}

export function applyGuess(p: RoundPayload, candidateId: string): TransitionResult | { error: string } {
  const t = roundTrack(p);
  if (!t) return { error: "Round is no longer active" };
  if (candidateId === p.trackId) return { outcome: "correct", reveal: reveal(p, t, true) };
  return advance(p, t, true);
}

export function applySkip(p: RoundPayload): TransitionResult | { error: string } {
  const t = roundTrack(p);
  if (!t) return { error: "Round is no longer active" };
  return advance(p, t, false);
}

function advance(p: RoundPayload, t: CatalogueTrack, mistake: boolean): TransitionResult {
  const mistakes = p.mistakes + (mistake ? 1 : 0);
  if (p.stage >= STAGE_SECONDS.length - 1) {
    return { outcome: "failed", reveal: reveal({ ...p, mistakes }, t, false) };
  }
  const next: RoundPayload = { ...p, stage: p.stage + 1, mistakes };
  return {
    outcome: "active",
    roundToken: seal(next),
    stage: next.stage,
    clipSeconds: STAGE_SECONDS[next.stage],
    mistakes,
  };
}

export { trackIdForKey };

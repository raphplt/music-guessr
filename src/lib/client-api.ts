/** Browser-side helpers for the JSON API (`{ code, message, data }` envelope). */

export type ApiEnvelope<T> = { code: number; message: string; data: T };

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    /* non-JSON */
  }
  if (!res.ok || !body || body.code !== 0) {
    throw new ApiError(body?.message ?? `Request failed (${res.status})`, res.status);
  }
  return body.data;
}

export function getJson<T>(url: string, init?: RequestInit) {
  return fetch(url, { cache: "no-store", ...init }).then((r) => unwrap<T>(r));
}

export function postJson<T>(url: string, body: unknown) {
  return fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  }).then((r) => unwrap<T>(r));
}

/* ---- shared API types (mirror src/lib/game.ts, kept dependency-free for the client) ---- */

export type Difficulty = "easy" | "medium" | "hard" | "expert" | "impossible";
export type Era = "classic" | "1980s" | "1990s" | "2000s" | "2010s" | "2020s";
export type PlaybackMode = "start" | "random";
export type Source = "catalogue" | "spotify";

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
  mode: "practice" | "daily";
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

export type Outcome = "correct" | "failed";

export type TransitionResult =
  | { outcome: "active"; roundToken: string; stage: number; clipSeconds: number; mistakes: number }
  | { outcome: Outcome; reveal: Reveal };

export type Suggestion = { id: string; title: string; artistName: string; artworkUrl: string };

export type FilterOption = { value: string; label: string; count?: number; image?: string | null };

export type FiltersData = { genres: FilterOption[]; eras: FilterOption[]; artists: FilterOption[] };

export type SpotifyMe =
  | { configured: boolean; connected: false; error?: string }
  | {
      configured: true;
      connected: true;
      profile: { id: string; displayName: string; image: string | null; product: string | null };
      artists: FilterOption[];
      topTracks: { id: string; name: string; artist: string; image: string | null }[];
      poolSize: number | null;
      poolByDifficulty: Record<string, number> | null;
    };

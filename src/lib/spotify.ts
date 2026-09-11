import "server-only";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { seal, open } from "@/lib/token";
import { tracksForArtist, spotifyArtistSlug } from "@/lib/itunes";
import { fold } from "@/lib/catalogue";
import type { CatalogueTrack } from "@/lib/catalogue-shared";

/**
 * Spotify sign-in (Authorization Code + PKCE) and taste import.
 *
 * Spotify is used for *who you are and what you like* (top artists / tracks).
 * Audio still comes from iTunes previews: Spotify removed preview URLs from
 * its Web API for new apps in late 2024, and its Web Playback SDK needs Premium.
 */
export const SESSION_COOKIE = "sp_session";
const PKCE_COOKIE = "sp_pkce";
const SCOPES = ["user-top-read", "user-read-email", "user-read-private"].join(" ");

export type SpotifySession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  userId?: string;
};

export type SpotifyArtist = { id: string; name: string; image: string | null; genres: string[] };
export type SpotifyTrack = { id: string; name: string; artist: string; image: string | null };

export type SpotifyProfile = {
  id: string;
  displayName: string;
  image: string | null;
  product: string | null;
};

export type TasteProfile = {
  profile: SpotifyProfile;
  artists: SpotifyArtist[];
  tracks: SpotifyTrack[];
  fetchedAt: number;
};

export function spotifyConfigured() {
  return !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

export function redirectUri(origin: string) {
  return process.env.SPOTIFY_REDIRECT_URI ?? `${origin}/api/spotify/callback`;
}

/**
 * Origin as the browser sees it (Host header), not the one Next.js reports —
 * Spotify only accepts the exact registered URI, and refuses "localhost".
 */
export function requestOrigin(req: Request) {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? url.host;
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  return `${proto}://${host}`;
}

/* ---------------- OAuth ---------------- */

export function buildAuthorizeUrl(origin: string) {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(12).toString("base64url");
  const url = new URL("https://accounts.spotify.com/authorize");
  url.search = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: SCOPES,
    redirect_uri: redirectUri(origin),
    state,
    code_challenge_method: "S256",
    code_challenge: challenge,
  }).toString();
  return { url: url.toString(), pkce: seal({ verifier, state, exp: Date.now() + 10 * 60_000 }) };
}

export async function setPkceCookie(value: string) {
  const jar = await cookies();
  jar.set(PKCE_COOKIE, value, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600, secure: process.env.NODE_ENV === "production" });
}

export async function readPkce() {
  const jar = await cookies();
  const raw = jar.get(PKCE_COOKIE)?.value;
  jar.delete(PKCE_COOKIE);
  const p = raw ? open<{ verifier: string; state: string; exp: number }>(raw) : null;
  return p && p.exp > Date.now() ? p : null;
}

export async function exchangeCode(code: string, verifier: string, origin: string): Promise<SpotifySession> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri(origin),
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify token exchange failed (${res.status}): ${await res.text()}`);
  const j = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return { accessToken: j.access_token, refreshToken: j.refresh_token, expiresAt: Date.now() + j.expires_in * 1000 - 30_000 };
}

async function refresh(session: SpotifySession): Promise<SpotifySession> {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: session.refreshToken }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify refresh failed (${res.status})`);
  const j = (await res.json()) as { access_token: string; refresh_token?: string; expires_in: number };
  return {
    ...session,
    accessToken: j.access_token,
    refreshToken: j.refresh_token ?? session.refreshToken,
    expiresAt: Date.now() + j.expires_in * 1000 - 30_000,
  };
}

export async function writeSession(session: SpotifySession) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, seal(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

/** Returns a valid session (refreshing if needed) or null. */
export async function getSession(): Promise<SpotifySession | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  const s = raw ? open<SpotifySession>(raw) : null;
  if (!s) return null;
  if (s.expiresAt > Date.now()) return s;
  try {
    const fresh = await refresh(s);
    await writeSession(fresh);
    return fresh;
  } catch {
    return null;
  }
}

/* ---------------- Web API ---------------- */

async function api<T>(session: SpotifySession, path: string): Promise<T> {
  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Spotify API ${res.status} on ${path}`);
  return (await res.json()) as T;
}

type ApiArtist = { id: string; name: string; images: { url: string }[]; genres: string[] };
type ApiTrack = { id: string; name: string; artists: { name: string }[]; album: { images: { url: string }[] } };

const tasteCache = new Map<string, TasteProfile>();
const TASTE_TTL = 1000 * 60 * 60 * 6;

export async function getTaste(session: SpotifySession): Promise<TasteProfile> {
  const me = await api<{ id: string; display_name: string | null; images: { url: string }[]; product?: string }>(session, "/me");
  const hit = tasteCache.get(me.id);
  if (hit && Date.now() - hit.fetchedAt < TASTE_TTL) return hit;

  const [medium, short, long, topTracks] = await Promise.all([
    api<{ items: ApiArtist[] }>(session, "/me/top/artists?time_range=medium_term&limit=50"),
    api<{ items: ApiArtist[] }>(session, "/me/top/artists?time_range=short_term&limit=30"),
    api<{ items: ApiArtist[] }>(session, "/me/top/artists?time_range=long_term&limit=30"),
    api<{ items: ApiTrack[] }>(session, "/me/top/tracks?time_range=medium_term&limit=50"),
  ]);
  const byId = new Map<string, SpotifyArtist>();
  for (const a of [...medium.items, ...short.items, ...long.items]) {
    if (!byId.has(a.id)) byId.set(a.id, { id: a.id, name: a.name, image: a.images?.[0]?.url ?? null, genres: a.genres ?? [] });
  }
  const taste: TasteProfile = {
    profile: { id: me.id, displayName: me.display_name ?? me.id, image: me.images?.[0]?.url ?? null, product: me.product ?? null },
    artists: [...byId.values()].slice(0, 60),
    tracks: topTracks.items.map((t) => ({ id: t.id, name: t.name, artist: t.artists[0]?.name ?? "", image: t.album?.images?.[0]?.url ?? null })),
    fetchedAt: Date.now(),
  };
  tasteCache.set(me.id, taste);
  return taste;
}

/* ---------------- Taste → playable pool ---------------- */

const poolCache = new Map<string, { at: number; tracks: CatalogueTrack[] }>();

/**
 * Builds the personal pool: iTunes previews for the listener's top artists.
 * Tracks that also appear in their Spotify top tracks are forced to "easy".
 */
export async function getTastePool(taste: TasteProfile): Promise<CatalogueTrack[]> {
  const hit = poolCache.get(taste.profile.id);
  if (hit && Date.now() - hit.at < TASTE_TTL) return hit.tracks;

  const artists = taste.artists.slice(0, 40);
  const results: CatalogueTrack[][] = [];
  // limited concurrency to stay polite with iTunes
  let i = 0;
  const worker = async () => {
    while (i < artists.length) {
      const idx = i++;
      const a = artists[idx];
      const tier: 1 | 2 | 3 | 4 = idx < 10 ? 1 : idx < 22 ? 2 : idx < 32 ? 3 : 4;
      try {
        results[idx] = await tracksForArtist(a.name, { tier, limit: 30 });
      } catch {
        results[idx] = [];
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);

  const known = new Set(taste.tracks.map((t) => `${fold(t.artist)}::${fold(t.name)}`));
  const tracks = results.flat().map((t) => {
    const k = `${fold(t.artist)}::${fold(t.title)}`;
    return known.has(k) ? { ...t, difficulty: "easy" as const } : t;
  });
  poolCache.set(taste.profile.id, { at: Date.now(), tracks });
  return tracks;
}

export function artistOptionsFromTaste(taste: TasteProfile) {
  return taste.artists.slice(0, 30).map((a) => ({ value: spotifyArtistSlug(a.name), label: a.name, image: a.image }));
}

import { createRound, parseDifficulty, parseEra, utcDateString, type PlaybackMode, type Source } from "@/lib/game";
import { ok, fail, personalPool } from "../_shared";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const q = u.searchParams;
  const source: Source = q.get("source") === "spotify" ? "spotify" : "catalogue";
  const artist = q.get("artist") ?? "any";
  const mode = q.get("mode") === "daily" ? "daily" : "practice";
  const needsPool = source === "spotify" || artist.startsWith("spotify:");
  const pool = needsPool ? await personalPool() : null;
  if (needsPool && !pool) return fail("Connect Spotify to play your library", 401);

  const result = createRound({
    difficulty: parseDifficulty(q.get("difficulty")),
    era: parseEra(q.get("era")),
    genre: q.get("genre") ?? "any",
    artist,
    playback: (q.get("playback") === "random" ? "random" : "start") as PlaybackMode,
    excludeKeys: (q.get("exclude") ?? "").split(",").filter(Boolean).slice(0, 200),
    collection: q.get("collection"),
    source,
    pool,
    mode,
    date: mode === "daily" ? utcDateString() : undefined,
  });
  if ("error" in result) return fail(result.error);
  return ok(result.round);
}

import { artistOptionsFromTaste, getSession, getTaste, getTastePool, spotifyConfigured } from "@/lib/spotify";
import { ok } from "../../_shared";

/** Who is connected + their taste summary (artists reel, pool size). */
export async function GET(req: Request) {
  const configured = spotifyConfigured();
  const session = configured ? await getSession() : null;
  if (!session) return ok({ configured, connected: false });
  try {
    const taste = await getTaste(session);
    const withPool = new URL(req.url).searchParams.get("pool") === "1";
    const pool = withPool ? await getTastePool(taste) : null;
    return ok({
      configured,
      connected: true,
      profile: taste.profile,
      artists: artistOptionsFromTaste(taste),
      topTracks: taste.tracks.slice(0, 10),
      poolSize: pool?.length ?? null,
      poolByDifficulty: pool
        ? pool.reduce<Record<string, number>>((acc, t) => ((acc[t.difficulty] = (acc[t.difficulty] ?? 0) + 1), acc), {})
        : null,
    });
  } catch (e) {
    console.error(e);
    return ok({ configured, connected: false, error: (e as Error).message });
  }
}

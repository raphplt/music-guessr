import { openRound, roundTrack } from "@/lib/game";
import { fetchPreview } from "@/lib/audio-cache";
import { fail } from "../_shared";

/** Streams the 30-second preview for the round identified by the sealed token. */
export async function GET(req: Request) {
  const token = req.headers.get("x-songspot-round-token") ?? new URL(req.url).searchParams.get("t");
  const round = openRound(token);
  if (!round) return fail("Invalid round token", 401);
  const track = roundTrack(round);
  if (!track?.previewUrl) return fail("No audio preview", 404);
  try {
    const { bytes, type } = await fetchPreview(track.previewUrl);
    return new Response(bytes, {
      headers: {
        "content-type": type,
        "content-length": String(bytes.byteLength),
        "cache-control": "private, max-age=600",
      },
    });
  } catch (e) {
    return fail((e as Error).message || "No audio preview", 502);
  }
}

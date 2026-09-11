import { genreOptions, FEATURED_ARTISTS, ERA_OPTIONS } from "@/lib/catalogue";
import { parseEra } from "@/lib/game";
import { ok } from "../_shared";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const era = parseEra(q.get("era"));
  const artist = q.get("artist") ?? "any";
  return ok({
    genres: genreOptions({ era, artist: artist.startsWith("spotify:") ? "any" : artist }),
    eras: ERA_OPTIONS,
    artists: FEATURED_ARTISTS.map((a) => ({ value: a.slug, label: a.name })),
  });
}

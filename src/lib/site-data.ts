import "server-only";
import { collections, catalogueStats, ARTIST_BY_SLUG } from "@/lib/catalogue";
import type { QuizGroups } from "@/components/site/SiteHeader";
import type { CollectionCard } from "@/components/landing/CollectionsSection";

const MENU_GENRES = ["hip-hop", "rock", "k-pop"];
const MENU_DECADES = ["1980s", "2000s", "2020s"];
const MENU_ARTISTS = ["taylor-swift", "michael-jackson", "bts"];

export function quizGroups(): QuizGroups {
  const all = collections();
  const pick = (slugs: string[], kind: CollectionCard["kind"]) =>
    slugs
      .map((s) => all.find((c) => c.slug === s && c.kind === kind))
      .filter((c): c is NonNullable<typeof c> => !!c)
      .map((c) => ({ href: `/music-quizzes/${c.slug}`, label: c.kind === "genre" && c.slug === "hip-hop" ? "Rap" : c.label }));
  return { genres: pick(MENU_GENRES, "genre"), decades: pick(MENU_DECADES, "decade"), artists: pick(MENU_ARTISTS, "artist") };
}

export function collectionCards(): CollectionCard[] {
  return collections()
    .map(({ kind, slug, label, total }) => ({ kind, slug, label, total }))
    .sort((a, b) => {
      if (a.kind !== "artist" || b.kind !== "artist") return 0;
      const ta = ARTIST_BY_SLUG.get(a.slug)?.tier ?? 4;
      const tb = ARTIST_BY_SLUG.get(b.slug)?.tier ?? 4;
      return ta - tb || b.total - a.total;
    });
}

export { catalogueStats };

import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SongspotGame } from "@/components/game/SongspotGame";
import { CollectionsSection } from "@/components/landing/CollectionsSection";
import { LandingSections } from "@/components/landing/LandingSections";
import { quizGroups, collectionCards, catalogueStats } from "@/lib/site-data";
import { genreOptions, FEATURED_ARTISTS, ERA_OPTIONS } from "@/lib/catalogue";

export default function HomePage() {
  const initialFilters = {
    genres: genreOptions({ era: "any", artist: "any" }),
    eras: ERA_OPTIONS,
    artists: FEATURED_ARTISTS.map((a) => ({ value: a.slug, label: a.name })),
  };
  return (
    <div className="songspot-landing">
      <SiteHeader quizGroups={quizGroups()} />
      <main>
        <SongspotGame initialFilters={initialFilters} />
        <CollectionsSection collections={collectionCards()} />
        <LandingSections />
      </main>
      <SiteFooter stats={catalogueStats()} />
    </div>
  );
}

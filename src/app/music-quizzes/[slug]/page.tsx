import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SongspotGame } from "@/components/game/SongspotGame";
import { CollectionsSection } from "@/components/landing/CollectionsSection";
import { quizGroups, collectionCards, catalogueStats } from "@/lib/site-data";
import { collectionBySlug, collections } from "@/lib/catalogue";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return collections().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const c = collectionBySlug(slug);
  if (!c) return {};
  return {
    title: `${c.label} Music Quiz – songspot`,
    description: `Guess ${c.label} songs from a 0.1-second clip. ${c.total} tracks, five difficulty levels.`,
  };
}

export default async function CollectionPage({ params }: Params) {
  const { slug } = await params;
  const c = collectionBySlug(slug);
  if (!c) notFound();
  return (
    <div className="songspot-landing">
      <SiteHeader quizGroups={quizGroups()} />
      <main>
        <SongspotGame collection={{ slug: c.slug, label: c.label, kind: c.kind, total: c.total }} />
        <CollectionsSection collections={collectionCards().filter((x) => x.slug !== c.slug)} />
      </main>
      <SiteFooter stats={catalogueStats()} />
    </div>
  );
}

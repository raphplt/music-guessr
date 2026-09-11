import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { CollectionsSection } from "@/components/landing/CollectionsSection";
import { quizGroups, collectionCards, catalogueStats } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Music Quizzes – songspot",
  description: "Focused 0.1-second song quizzes by genre, decade, and artist.",
};

export default function MusicQuizzesPage() {
  return (
    <div className="songspot-landing">
      <SiteHeader quizGroups={quizGroups()} overlay={false} />
      <main className="songspot-quizzes-page">
        <CollectionsSection collections={collectionCards()} showBrowse={false} limitArtists={500} />
      </main>
      <SiteFooter stats={catalogueStats()} />
    </div>
  );
}

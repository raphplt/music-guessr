import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SongspotGame } from "@/components/game/SongspotGame";
import { quizGroups, catalogueStats } from "@/lib/site-data";

export const metadata: Metadata = {
  title: "Daily Challenge – songspot",
  description: "One song a day, the same for everyone. Guess it from a 0.1-second clip.",
};

export default function DailyPage() {
  return (
    <div className="songspot-landing">
      <SiteHeader quizGroups={quizGroups()} />
      <main>
        <SongspotGame mode="daily" />
      </main>
      <SiteFooter stats={catalogueStats()} />
    </div>
  );
}
